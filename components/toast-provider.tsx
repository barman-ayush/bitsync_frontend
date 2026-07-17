'use client';

import React, { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Toast from './toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

function ToastUrlListener() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [handledToast, setHandledToast] = useState(false);

  // Handle toast from URL params on mount
  useEffect(() => {
    if (handledToast) return;

    const toastMessage = searchParams.get('toast');
    const toastType = (searchParams.get('toastType') as ToastMessage['type']) || 'success';

    if (toastMessage) {
      // Remove surrounding quotes if present (e.g., "message" -> message)
      const cleanedMessage = toastMessage.replace(/^["']|["']$/g, '');
      setHandledToast(true);
      addToast(cleanedMessage, toastType);

      // Remove toast params from URL
      const params = new URLSearchParams(searchParams);
      params.delete('toast');
      params.delete('toastType');

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState(null, '', newUrl);
    }
  }, [searchParams, handledToast, addToast]);

  return null;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Suspense fallback={null}>
        <ToastUrlListener />
      </Suspense>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
