'use client';

import { useToast } from '@/components/toast-provider';

export function useToastNotify() {
  const { addToast } = useToast();

  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  };
}
