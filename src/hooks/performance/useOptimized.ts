/**
 * 🚀 PERFORMANCE OPTIMIZATION HOOKS
 *
 * Custom hooks para optimizar performance en React Native.
 * Incluye memoization, debouncing, throttling y más.
 */

import {useCallback, useEffect, useRef, useState, useMemo} from 'react';

/**
 * Hook para memoizar valores costosos
 * Similar a useMemo pero con dependencias más claras
 */
export function useExpensiveComputation<T>(
  computeFn: () => T,
  dependencies: React.DependencyList,
): T {
  return useMemo(computeFn, dependencies);
}

/**
 * Hook para manejar estados booleanos de forma optimizada
 */
export function useBoolean(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue(v => !v), []);

  return {
    value,
    setValue,
    setTrue,
    setFalse,
    toggle,
  } as const;
}

/**
 * Hook para crear un contador optimizado
 */
export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  const set = useCallback((value: number) => setCount(value), []);

  return {
    count,
    increment,
    decrement,
    reset,
    set,
  } as const;
}

/**
 * Hook para prevenir memory leaks en componentes desmontados
 */
export function useSafeState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: T | ((prevState: T) => T)) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState] as const;
}

/**
 * Hook para valores previos
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook para detectar si es el primer render
 */
export function useIsFirstRender(): boolean {
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }

  return false;
}

/**
 * Hook para ejecutar código solo una vez (al montar)
 */
export function useMount(fn: () => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    fnRef.current();
  }, []);
}

/**
 * Hook para ejecutar código al desmontar
 */
export function useUnmount(fn: () => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    return () => {
      fnRef.current();
    };
  }, []);
}

/**
 * Hook para intervalos que se limpian automáticamente
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook para timeouts que se limpian automáticamente
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook para throttling de funciones
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): T {
  const lastRan = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        fn(...args);
        lastRan.current = now;
      }
    },
    [fn, delay],
  ) as T;
}

/**
 * Hook para debouncing de valores
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para actualizar el documento title (útil para web)
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * Hook para obtener dimensiones de ventana reactivas
 */
export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}
