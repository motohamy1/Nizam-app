import { applyOptimisticMutation, getIdMappings, pushMutationToQueue, updateCachedQuery } from '@/utils/offlineStorage';
import NetInfo from '@react-native-community/netinfo';

// Reactive network state tracker
let _isConnected = true;
NetInfo.addEventListener((state) => {
  _isConnected = state.isConnected ?? true;
});

// Initial network fetch
NetInfo.fetch().then((state) => {
  _isConnected = state.isConnected ?? true;
});

const recentMutations = new Map<string, { timestamp: number; result: any }>();

// Same-tick executions sharing one promise: the reservation MUST happen
// synchronously at entry, before the first await below.
const inflightMutations = new Map<string, Promise<any>>();

// Volatile fields differ between two taps of the "same" action, so they must
// be excluded from the duplicate-tap hash or rapid-tap suppression never hits.
const VOLATILE_ARG_KEYS = new Set(['timerStartTime', 'localId', 'timestamp']);

function hashArgs(args: any): string {
  if (!args || typeof args !== 'object') return JSON.stringify(args);
  const clean: Record<string, any> = {};
  Object.keys(args)
    .sort()
    .forEach((k) => {
      if (!VOLATILE_ARG_KEYS.has(k)) clean[k] = args[k];
    });
  return JSON.stringify(clean);
}

function findTempIds(value: any, found: Set<string> = new Set()): Set<string> {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    value.forEach((v) => findTempIds(v, found));
    return found;
  }
  Object.entries(value).forEach(([key, val]) => {
    // localId is deliberately the temp id itself (the server's idempotency key)
    if (key === 'localId') return;
    if (typeof val === 'string' && val.startsWith('temp_') && /id$/i.test(key)) {
      found.add(val);
    } else {
      findTempIds(val, found);
    }
  });
  return found;
}

// Replace temp ids with their synced server equivalents (recursively).
async function remapArgs(args: any): Promise<any> {
  if (!args || typeof args !== 'object') return args;
  const map = await getIdMappings();
  const temps = Array.from(findTempIds(args));
  if (temps.length === 0) return args;
  const resolve = (v: any): any => {
    if (Array.isArray(v)) return v.map(resolve);
    if (v && typeof v === 'object') {
      const out: Record<string, any> = {};
      Object.entries(v).forEach(([k, val]) => {
        out[k] =
          k !== 'localId' && typeof val === 'string' && /id$/i.test(k) && map[val]
            ? map[val]
            : resolve(val);
      });
      return out;
    }
    return v;
  };
  return resolve(args);
}

// Create mutations across the app; each gets the optimistic temp id injected
// as `localId` so a queued replay can never insert a second copy server-side.
const CREATE_MUTATION_RE = /^(todos|projects|yearlyGoals):(add|create)/;

export function useOfflineMutation(mutationFn: any, mutationPath: string) {
  return async (
    rawArgs: any,
    options?: {
      optimisticUpdater?: (oldData: any[]) => any[];
      queryKey?: string;
      queryArgs?: any;
    }
  ) => {
    // Same-tick double-submit guard: two invocations with identical args
    // before the first awaits anything must share ONE execution.
    const mutationHash = `${mutationPath}_${hashArgs(rawArgs)}`;
    const inflight = inflightMutations.get(mutationHash);
    if (inflight) {
      console.log(`Sharing in-flight mutation: ${mutationPath}`);
      return inflight;
    }
    // Rapid duplicate tap suppression (500ms window, completed executions)
    const last = recentMutations.get(mutationHash);
    if (last && Date.now() - last.timestamp < 500) {
      console.log(`Debounced rapid duplicate mutation tap: ${mutationPath}`);
      return last.result;
    }

    const run = (async () => {
      // Carry any previously-synced temp ids forward as real server ids.
      const args = await remapArgs(rawArgs);

      // 1. Apply explicit custom optimistic updater if provided
      if (options?.optimisticUpdater && options?.queryKey) {
        await updateCachedQuery(options.queryKey, options.queryArgs, options.optimisticUpdater);
      }

      // 2. Apply automatic built-in optimistic update to local store
      const optimisticResult = applyOptimisticMutation(mutationPath, args);
      const createdTempId = typeof optimisticResult === 'string' ? optimisticResult : undefined;
      const tempId = createdTempId || (optimisticResult && optimisticResult._id) || `temp_${Date.now()}`;
      const fallbackResult = createdTempId
        ? createdTempId
        : { _id: tempId, id: tempId, ...(typeof optimisticResult === 'object' ? optimisticResult : {}) };

      recentMutations.set(mutationHash, { timestamp: Date.now(), result: fallbackResult });
      if (recentMutations.size > 100) {
        const now = Date.now();
        recentMutations.forEach((val, key) => {
          if (now - val.timestamp > 5000) recentMutations.delete(key);
        });
      }

      // Creation mutations carry the optimistic temp id as an idempotency key so
      // a queued replay can never insert a second copy server-side.
      let serverArgs = args;
      if (createdTempId && CREATE_MUTATION_RE.test(mutationPath)) {
        serverArgs = { ...args, localId: createdTempId };
      }

      // 3. TRUE LOCAL-FIRST EXECUTION:
      // Persist to offline queue immediately and return optimistic result.
      // UI is NEVER blocked by network timeouts or flaky connection stalls.
      // Background useSyncManager executes the queue in FIFO order with retries.
      await pushMutationToQueue(mutationPath, mutationPath, serverArgs, createdTempId);

      return fallbackResult;
    })();

    inflightMutations.set(mutationHash, run);
    try {
      const res = await run;
      recentMutations.set(mutationHash, { timestamp: Date.now(), result: res });
      return res;
    } catch (e) {
      recentMutations.delete(mutationHash);
      throw e;
    } finally {
      inflightMutations.delete(mutationHash);
    }
  };
}
