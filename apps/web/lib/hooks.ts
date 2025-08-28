import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from './utils';
import type { APIResponse, PaginatedResponse } from '@kontexto/core';

// Custom hook for API calls with authentication
export function useApi<T>(
  url: string | null,
  options?: SWRConfiguration
) {
  const { data: session } = useSession();

  return useSWR<APIResponse<T>>(
    url && session ? url : null,
    fetcher,
    {
      ...options,
      onError: (error) => {
        console.error('API Error:', error);
        if (options?.onError) {
          options.onError(error);
        }
      },
    }
  );
}

// Custom hook for paginated API calls
export function usePaginatedApi<T>(
  baseUrl: string,
  initialPage = 1,
  limit = 20
) {
  const [page, setPage] = useState(initialPage);
  const { data: session } = useSession();

  const url = session ? `${baseUrl}?page=${page}&limit=${limit}` : null;
  
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<T>>(
    url,
    fetcher
  );

  const nextPage = useCallback(() => {
    if (data?.hasMore) {
      setPage(prev => prev + 1);
    }
  }, [data?.hasMore]);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  return {
    data: data?.data || [],
    total: data?.total || 0,
    page,
    limit,
    hasMore: data?.hasMore || false,
    error,
    isLoading,
    mutate,
    nextPage,
    prevPage,
    goToPage,
  };
}

// Custom hook for local storage
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// Custom hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
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

// Custom hook for keyboard shortcuts
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { ctrlKey = false, metaKey = false, shiftKey = false } = options;

      if (
        keys.includes(event.key.toLowerCase()) &&
        event.ctrlKey === ctrlKey &&
        event.metaKey === metaKey &&
        event.shiftKey === shiftKey
      ) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [keys, callback, options]);
}

// Custom hook for online/offline status
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Custom hook for copying to clipboard
export function useClipboard(): [boolean, (text: string) => Promise<void>] {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  return [hasCopied, copyToClipboard];
}

// Custom hook for intersection observer
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// Custom hook for window size
export function useWindowSize(): { width: number; height: number } {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Custom hook for previous value
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}