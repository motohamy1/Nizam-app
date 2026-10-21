import { applyOverlay, getCacheKey, getPendingTempTodosForCacheKey, hasPendingTemp, memoryCache, reconcileOverlay, removeTempEntry, subscribeToCache } from '@/utils/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const singleResultQueryKeys = [
  'auth.getUserSettings',
  'projects.getCategory',
  'projects.getProject',
  'projects.getProjectMetadata',
  'projects.getSubCategory',
  'todos.getById',
];

const isEmptySingleResultCache = (queryKey: string, value: any) =>
  singleResultQueryKeys.includes(queryKey) && Array.isArray(value) && value.length === 0;

// Last JSON we persisted per cache key.
const lastPersistedJsonByKey: Record<string, string> = {};

// Defensive read of the module-shared memory cache.
const readMemoryCache = (key: string): any => {
  try {
    return memoryCache?.[key];
  } catch (e) {
    return undefined;
  }
};

const findInListCaches = (prefix: string, id: string): any => {
  try {
    for (const k of Object.keys(memoryCache)) {
      if (k.startsWith(prefix)) {
        const list = memoryCache[k];
        if (Array.isArray(list)) {
          const found = list.find((item: any) => item?._id === id);
          if (found) return found;
        }
      }
    }
  } catch (e) {}
  return undefined;
};

const readCachedValue = (queryKey: string, args: any, cacheKey: string): any => {
  const memVal = readMemoryCache(cacheKey);
  if (memVal !== undefined && !isEmptySingleResultCache(queryKey, memVal)) {
    return memVal;
  }
  // Fast instantaneous fallback lookup from list collections
  if (queryKey === 'todos.getById' && args?.id) {
    const found = findInListCaches('CACHE_todos', args.id);
    if (found) {
      memoryCache[cacheKey] = found;
      return found;
    }
  }
  if (queryKey === 'projects.getProjectMetadata' && args?.id) {
    const found = findInListCaches('CACHE_projects.getProjects', args.id);
    if (found) {
      memoryCache[cacheKey] = found;
      return found;
    }
  }
  return undefined;
};

// Only client-created temp docs are "offline ids". Real Convex ids must never
// match, or the live subscription would be silently skipped.
function hasOfflineId(args: any): boolean {
  if (!args || typeof args !== 'object' || args === 'skip') return false;
  for (const key of Object.keys(args)) {
    if (key === 'localId') continue;
    const val = args[key];
    if (typeof val === 'string' && val.startsWith('temp_') && /id$/i.test(key)) {
      return true;
    } else if (typeof val === 'object' && val !== null) {
      if (hasOfflineId(val)) return true;
    }
  }
  return false;
}

// Re-apply unacknowledged optimistic state to whatever the server (or cache)
// returned, so a subscription update can no longer wipe a fresh pause/start/
// create until the server has echoed the same values (or the overlay TTLs).
function withPendingState(cacheKey: string, data: any): any {
  if (data === undefined || data === null) return data;

  if (Array.isArray(data)) {
    // Drop unregistered temp docs baked into a persisted snapshot (stale after
    // a restart) — only temps still tracked by the pending registry may render.
    const fresh = data.filter((item: any) => {
      const id = item?._id;
      return !(typeof id === 'string' && id.startsWith('temp_') && !hasPendingTemp(id));
    });

    const merged = fresh.map((item: any) => {
      if (item && typeof item === 'object') {
        reconcileOverlay(item);
        return applyOverlay(item);
      }
      return item;
    });

    const seen = new Set(merged.map((i: any) => i?._id));
    // A server doc carrying localId === tempId IS this temp doc, already
    // synced. Retire the temp immediately instead of rendering a duplicate.
    const serverLocalIds = new Set(
      merged.map((i: any) => i?.localId).filter((l: any) => typeof l === 'string' && l.startsWith('temp_'))
    );
    const temps = getPendingTempTodosForCacheKey(cacheKey).filter((t: any) => {
      if (seen.has(t._id)) return false;
      if (serverLocalIds.has(t._id)) {
        removeTempEntry(t._id).catch(() => {});
        return false;
      }
      return true;
    });
    if (temps.length > 0) return [...temps, ...merged];
    return merged;
  }

  if (typeof data === 'object' && data?._id) {
    reconcileOverlay(data);
    return applyOverlay(data);
  }

  return data;
}

export function useOfflineQuery<T = any>(queryKey: string, queryFn: any, args?: any): T | undefined {
  const isSkipped = args === 'skip';
  const convexArgs = (isSkipped || hasOfflineId(args)) ? 'skip' : args;
  const convexData = useQuery(queryFn, convexArgs);
  const cacheKey = getCacheKey(queryKey, args);

  // Synchronously initialize with in-memory cache if available
  const [offlineData, setOfflineData] = useState<any>(() => {
    if (isSkipped) return undefined;
    return readCachedValue(queryKey, args, cacheKey);
  });

  const [isOffline, setIsOffline] = useState(false);

  // Network listener
  useEffect(() => {
    NetInfo.fetch().then((state) => setIsOffline(!state.isConnected));
    const unsub = NetInfo.addEventListener((state) => setIsOffline(!state.isConnected));
    return unsub;
  }, []);

  // Sync state with in-memory or persisted cache whenever cacheKey changes
  const refreshFromCache = useCallback(() => {
    if (isSkipped) {
      setOfflineData(undefined);
      return;
    }
    const memVal = readCachedValue(queryKey, args, cacheKey);
    if (memVal !== undefined) {
      setOfflineData(memVal);
      return;
    }

    AsyncStorage.getItem(cacheKey)
      .then((value) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (!isEmptySingleResultCache(queryKey, parsed)) {
              memoryCache[cacheKey] = parsed;
              setOfflineData(parsed);
            }
          } catch (e) {
            // ignore parse error
          }
        }
      })
      .catch(() => {});
  }, [cacheKey, queryKey, args, isSkipped]);

  // Initial and cacheKey change refresh
  useEffect(() => {
    refreshFromCache();
  }, [refreshFromCache]);

  // Subscribe to offlineStorage events (fires on any optimistic update or cache change)
  useEffect(() => {
    if (isSkipped) return;
    const unsub = subscribeToCache(() => {
      const memVal = readCachedValue(queryKey, args, cacheKey);
      if (memVal !== undefined) {
        setOfflineData(memVal);
      }
    });
    return unsub;
  }, [cacheKey, isSkipped, queryKey, args]);

  // When live Convex server data arrives, update cache & persistence.
  useEffect(() => {
    if (convexData !== undefined && !isSkipped) {
      memoryCache[cacheKey] = convexData;
      try {
        const json = JSON.stringify(convexData);
        if (lastPersistedJsonByKey[cacheKey] !== json) {
          lastPersistedJsonByKey[cacheKey] = json;
          AsyncStorage.setItem(cacheKey, json).catch(() => {});
        }
      } catch (e) {
        AsyncStorage.setItem(cacheKey, JSON.stringify(convexData)).catch(() => {});
      }
      setOfflineData(convexData);
    }
  }, [convexData, cacheKey, isSkipped]);

  const base = isSkipped
    ? undefined
    : isOffline
      ? offlineData !== undefined
        ? offlineData
        : !singleResultQueryKeys.includes(queryKey)
          ? []
          : offlineData
      : convexData !== undefined
        ? convexData
        : offlineData;

  // Overlay pending optimistic changes and locally-created docs on every render
  return useMemo(() => {
    if (isSkipped) return undefined;
    return withPendingState(cacheKey, base) as T | undefined;
  }, [base, cacheKey, isSkipped]);
}
