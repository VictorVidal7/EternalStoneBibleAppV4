/**
 * Sistema de Caché para Optimización de Rendimiento
 * Mejora la velocidad de acceso a datos frecuentemente consultados
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milisegundos
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly maxMemoryCacheSize = 100; // Máximo de entradas en memoria
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Guarda datos en caché (memoria + AsyncStorage)
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number = this.defaultTTL,
    persistToDisk: boolean = false
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    };

    // Guardar en memoria
    this.memoryCache.set(key, entry);

    // Limpiar caché si está muy grande
    if (this.memoryCache.size > this.maxMemoryCacheSize) {
      this.evictOldest();
    }

    // Guardar en disco si se requiere
    if (persistToDisk) {
      try {
        await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      } catch (error) {
        console.error('Error saving to disk cache:', error);
      }
    }
  }

  /**
   * Obtiene datos de caché
   */
  async get<T>(key: string): Promise<T | null> {
    // Primero buscar en memoria
    const memoryEntry = this.memoryCache.get(key);

    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // Si no está en memoria o está expirado, buscar en disco
    try {
      const diskData = await AsyncStorage.getItem(`cache:${key}`);

      if (diskData) {
        const entry: CacheEntry<T> = JSON.parse(diskData);

        if (!this.isExpired(entry)) {
          // Restaurar a memoria
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Limpiar entrada expirada
          await AsyncStorage.removeItem(`cache:${key}`);
        }
      }
    } catch (error) {
      console.error('Error reading from disk cache:', error);
    }

    return null;
  }

  /**
   * Invalida una entrada de caché
   */
  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      await AsyncStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Invalida múltiples entradas por patrón
   */
  async invalidatePattern(pattern: RegExp): Promise<void> {
    // Limpiar memoria
    const memoryKeys = Array.from(this.memoryCache.keys());
    for (const key of memoryKeys) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpiar disco
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(
        (k) => k.startsWith('cache:') && pattern.test(k.replace('cache:', ''))
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error invalidating pattern:', error);
    }
  }

  /**
   * Limpia toda la caché
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => k.startsWith('cache:'));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Obtiene el tamaño de la caché
   */
  async getSize(): Promise<{ memory: number; disk: number }> {
    const memorySize = this.memoryCache.size;

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => k.startsWith('cache:'));
      return { memory: memorySize, disk: cacheKeys.length };
    } catch (error) {
      console.error('Error getting cache size:', error);
      return { memory: memorySize, disk: 0 };
    }
  }

  /**
   * Verifica si una entrada está expirada
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.expiresIn;
  }

  /**
   * Elimina las entradas más antiguas
   */
  private evictOldest(): void {
    const entries = Array.from(this.memoryCache.entries());

    // Ordenar por timestamp (más antiguas primero)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Eliminar el 20% más antiguo
    const toRemove = Math.floor(this.maxMemoryCacheSize * 0.2);

    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * Precarga datos en caché
   */
  async preload<T>(key: string, dataFetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await dataFetcher();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Obtiene estadísticas de caché
   */
  async getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    memorySize: number;
    diskSize: number;
  }> {
    const size = await this.getSize();

    // En una implementación real, mantendríamos contadores de hits/misses
    // Por ahora retornamos valores básicos

    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memorySize: size.memory,
      diskSize: size.disk,
    };
  }
}

// Instancia singleton
export const cacheManager = new CacheManager();
