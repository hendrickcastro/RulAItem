'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/toaster';
import { GlobalKeyboardShortcuts } from './global-keyboard-shortcuts';
import { fetcher } from '@/lib/utils';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          dedupingInterval: 2000,
          errorRetryCount: 3,
          errorRetryInterval: 1000,
          onError: (error) => {
            console.error('SWR Error:', error);
          },
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <GlobalKeyboardShortcuts />
        </ThemeProvider>
      </SWRConfig>
    </SessionProvider>
  );
}