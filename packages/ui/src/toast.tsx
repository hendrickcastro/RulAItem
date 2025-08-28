import * as React from 'react';
import { cn } from './utils';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 shadow-lg transition-all',
          variant === 'destructive'
            ? 'destructive border-destructive bg-destructive text-destructive-foreground'
            : 'border bg-background text-foreground',
          className
        )}
        {...props}
      />
    );
  }
);
Toast.displayName = 'Toast';