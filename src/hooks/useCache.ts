/**
 * ⚡ USE CACHE HOOK
 *
 * Hook personalizado para usar el sistema de caché predictivo
 * Simplifica el uso de caché en componentes React
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useState, useEffect, useCallback} from 'react';
import {predictiveCacheService} from '../lib/cache/PredictiveCache';

interface UseCacheOptions {
  ttl?: number;
  priority?: number;
  autoRefresh?: boolean;
}

export function useCache<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      const cached = await predictiveCacheService.get<T>(key);

      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return cached;
      }

      // If not in cache, fetch fresh data
      const freshData = await fetcher();
      setData(freshData);

      // Store in cache
      await predictiveCacheService.set(key, freshData, {
        ttl: options.ttl,
        priority: options.priority,
      });

      return freshData;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.ttl, options.priority]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    // Force refresh by deleting cache entry first
    await predictiveCacheService.delete(key);
    return loadData();
  }, [key, loadData]);

  const invalidate = useCallback(async () => {
    await predictiveCacheService.delete(key);
    setData(null);
  }, [key]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
}

/**
 * Hook para pre-cargar datos en caché
 */
export function usePrefetch() {
  const prefetch = useCallback(
    async <T = any>(
      key: string,
      fetcher: () => Promise<T>,
      options: UseCacheOptions = {},
    ) => {
      try {
        const cached = await predictiveCacheService.get<T>(key);
        if (cached !== null) {
          return; // Already cached
        }

        const data = await fetcher();
        await predictiveCacheService.set(key, data, {
          ttl: options.ttl,
          priority: options.priority || 7, // Default higher priority for prefetch
        });
      } catch (error) {
        console.error('Prefetch error:', error);
      }
    },
    [],
  );

  return {prefetch};
}

/**
 * Hook para estadísticas de caché
 */
export function useCacheStats() {
  const [stats, setStats] = useState({
    totalEntries: 0,
    memoryEntries: 0,
    hitRate: 0,
    avgAccessCount: 0,
  });

  const loadStats = useCallback(async () => {
    const cacheStats = await predictiveCacheService.getCacheStats();
    setStats(cacheStats);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = useCallback(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    refresh,
  };
}
