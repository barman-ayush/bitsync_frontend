'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-right-4';
    
    const variants = {
      success: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
      error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
      warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
      info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    };

    const opacity = isVisible ? 'opacity-100' : 'opacity-0';

    return `${baseClasses} ${variants[type]} ${opacity}`;
  };

  const getIconColor = () => {
    const iconVariants = {
      success: 'text-green-600 dark:text-green-400',
      error: 'text-red-600 dark:text-red-400',
      warning: 'text-amber-600 dark:text-amber-400',
      info: 'text-blue-600 dark:text-blue-400',
    };
    return iconVariants[type];
  };

  const getIcon = () => {
    const iconClass = `h-5 w-5 flex-shrink-0 ${getIconColor()}`;
    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
    }
  };

  const closeButtonClass = {
    success: 'hover:bg-green-200 dark:hover:bg-green-800',
    error: 'hover:bg-red-200 dark:hover:bg-red-800',
    warning: 'hover:bg-amber-200 dark:hover:bg-amber-800',
    info: 'hover:bg-blue-200 dark:hover:bg-blue-800',
  };

  return (
    <div className={getStyles()}>
      {getIcon()}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className={`ml-2 p-1 rounded-md transition-colors ${closeButtonClass[type]}`}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
