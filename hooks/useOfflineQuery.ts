import {
  applyOverlay,
  getCacheKey,
  getPendingTempTodosForCacheKey,
  hasPendingTemp,
  isDeletedTombstoned,
  memoryCache,
  reconcileOverlay,
  removeTempEntry,
  subscribeToCache
} from '@/utils/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';

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
function withPendingState(cacheKey: string, data: any, isServerData: boolean = false): any {
  if (data === undefined || data === null) return data;

  if (Array.isArray(data)) {
    // Drop unregistered temp docs and locally tombstoned (deleted) docs
    const fresh = data.filter((item: any) => {
      const id = item?._id;
      if (!id) return false;
      if (isDeletedTombstoned(id)) return false;
      return !(typeof id === 'string' && id.startsWith('temp_') && !hasPendingTemp(id));
    });

    const merged = fresh
      .map((item: any) => {
        if (item && typeof item === 'object') {
          if (isServerData) reconcileOverlay(item);
          return applyOverlay(item);
        }
        return item;
      })
      .filter(Boolean); // remove tombstoned/null items

    const seen = new Set(merged.map((i: any) => i?._id));
    // A server doc carrying localId === tempId IS this temp doc, already
    // synced. Retire the temp immediately instead of rendering a duplicate.
    const serverLocalIds = new Set(
      merged.map((i: any) => i?.localId).filter((l: any) => typeof l === 'string' && l.startsWith('temp_'))
    );
    const temps = getPendingTempTodosForCacheKey(cacheKey).filter((t: any) => {
      if (seen.has(t._id)) return false;
      if (serverLocalIds.has(t._id)) {
        setTimeout(() => {
          removeTempEntry(t._id).catch(() => {});
        }, 0);
        return false;
      }
      return true;
    });
    if (temps.length > 0) return [...temps, ...merged];
    return merged;
  }

  if (typeof data === 'object' && data?._id) {
    if (isServerData) reconcileOverlay(data);
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
  const [prevCacheKey, setPrevCacheKey] = useState(cacheKey);
  const [offlineData, setOfflineData] = useState<any>(() => {
    if (isSkipped) return undefined;
    return readCachedValue(queryKey, args, cacheKey);
  });

  if (cacheKey !== prevCacheKey) {
    setPrevCacheKey(cacheKey);
    setOfflineData(isSkipped ? undefined : readCachedValue(queryKey, args, cacheKey));
  }

  const [isOffline, setIsOffline] = useState(false);

  // Network listener
  useEffect(() => {
    NetInfo.fetch().then((state) => setIsOffline(!state.isConnected));
    const unsub = NetInfo.addEventListener((state) => setIsOffline(!state.isConnected));
    return unsub;
  }, []);

  // Asynchronously backfill from persistent storage if memory cache was empty
  useEffect(() => {
    if (isSkipped) return;
    let cancelled = false;
    AsyncStorage.getItem(cacheKey)
      .then((value) => {
        if (cancelled || !value) return;
        try {
          const parsed = JSON.parse(value);
          if (!isEmptySingleResultCache(queryKey, parsed)) {
            memoryCache[cacheKey] = parsed;
            setOfflineData(parsed);
          }
        } catch (_) {
          // ignore parse error
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cacheKey, queryKey, isSkipped]);

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
      } catch (_) {
        AsyncStorage.setItem(cacheKey, JSON.stringify(convexData)).catch(() => {});
      }
    }
  }, [convexData, cacheKey, isSkipped]);

  // Overlay pending optimistic changes and locally-created docs on every render
  return useMemo(() => {
    if (isSkipped) return undefined;
    const base = isOffline
      ? offlineData !== undefined
        ? offlineData
        : !singleResultQueryKeys.includes(queryKey)
          ? []
          : offlineData
      : convexData !== undefined
        ? convexData
        : offlineData;

    const isServer = !isOffline && convexData !== undefined && base === convexData;
    return withPendingState(cacheKey, base, isServer) as T | undefined;
  }, [cacheKey, isSkipped, isOffline, convexData, offlineData, queryKey]);
}
