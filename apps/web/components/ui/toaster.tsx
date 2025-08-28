'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, removeToast } = useUIStore();

  useEffect(() => {
    const timers = toasts.map((toast) => {
      const duration = toast.duration || 5000;
      return setTimeout(() => {
        removeToast(toast.id);
      }, duration);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex items-start space-x-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm',
              'w-80 max-w-sm',
              {
                'bg-green-50 border-green-200 text-green-900': toast.type === 'success',
                'bg-red-50 border-red-200 text-red-900': toast.type === 'error',
                'bg-yellow-50 border-yellow-200 text-yellow-900': toast.type === 'warning',
                'bg-blue-50 border-blue-200 text-blue-900': toast.type === 'info',
              }
            )}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{toast.title}</div>
              {toast.message && (
                <div className="text-sm opacity-90 mt-1">{toast.message}</div>
              )}
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}