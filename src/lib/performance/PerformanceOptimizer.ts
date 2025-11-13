/**
 * Utilidades de Optimización de Rendimiento
 * Funciones helper para mejorar el rendimiento de la aplicación
 */

/**
 * Debounce: Retrasa la ejecución de una función hasta que hayan pasado X ms sin llamadas
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle: Limita la ejecución de una función a una vez cada X ms
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoization: Cachea resultados de funciones costosas
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    keys.push(key);

    // Limitar tamaño de caché
    if (keys.length > maxSize) {
      const oldKey = keys.shift()!;
      cache.delete(oldKey);
    }

    return result;
  }) as T;
}

/**
 * Batch: Agrupa múltiples llamadas en una sola
 */
export function batchify<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  options: {
    maxSize?: number;
    maxWait?: number;
  } = {}
): (item: T) => Promise<R> {
  const { maxSize = 50, maxWait = 100 } = options;

  let batch: T[] = [];
  let resolvers: Array<(value: R) => void> = [];
  let timeout: NodeJS.Timeout | null = null;

  const flush = async () => {
    if (batch.length === 0) return;

    const currentBatch = batch;
    const currentResolvers = resolvers;

    batch = [];
    resolvers = [];

    try {
      const results = await processor(currentBatch);
      results.forEach((result, index) => {
        currentResolvers[index](result);
      });
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  };

  return (item: T): Promise<R> => {
    return new Promise((resolve) => {
      batch.push(item);
      resolvers.push(resolve);

      if (batch.length >= maxSize) {
        if (timeout) clearTimeout(timeout);
        flush();
      } else if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          flush();
        }, maxWait);
      }
    });
  };
}

/**
 * Lazy Load: Carga datos de forma diferida
 */
export async function lazyLoad<T>(
  loader: () => Promise<T>,
  delay: number = 0
): Promise<T> {
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return loader();
}

/**
 * Chunk Array: Divide un array en chunks más pequeños
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

/**
 * Retry: Reintenta una operación fallida
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * Queue: Cola de ejecución para limitar concurrencia
 */
export class AsyncQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();

    if (task) {
      try {
        await task();
      } finally {
        this.running--;
        this.process();
      }
    }
  }

  get size(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.running;
  }
}

/**
 * Performance Monitor: Mide el tiempo de ejecución
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  static start(label: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;

      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }

      this.measurements.get(label)!.push(duration);

      // Mantener solo las últimas 100 mediciones
      const measurements = this.measurements.get(label)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  static getStats(label: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const measurements = this.measurements.get(label);

    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    const avg = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return {
      avg: Math.round(avg),
      min,
      max,
      count: measurements.length,
    };
  }

  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [label, _] of this.measurements) {
      stats[label] = this.getStats(label);
    }

    return stats;
  }

  static clear(label?: string): void {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }
}

/**
 * Memory Management: Limpia referencias y previene memory leaks
 */
export function cleanupRefs<T extends Record<string, any>>(obj: T): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      obj[key] = null as any;
    }
  }
}
