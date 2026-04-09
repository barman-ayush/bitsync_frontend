'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

function getColors(type: string, isDark: boolean) {
  if (type === 'success') {
    return isDark
      ? { bg: 'rgba(5, 46, 22, 0.4)', border: '#166534', text: '#dcfce7', icon: '#4ade80', hoverBg: '#166534' }
      : { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', icon: '#16a34a', hoverBg: '#bbf7d0' };
  }
  if (type === 'error') {
    return isDark
      ? { bg: 'rgba(69, 10, 10, 0.4)', border: '#991b1b', text: '#fee2e2', icon: '#f87171', hoverBg: '#991b1b' }
      : { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', icon: '#dc2626', hoverBg: '#fecaca' };
  }
  if (type === 'warning') {
    return isDark
      ? { bg: 'rgba(66, 32, 6, 0.4)', border: '#854d0e', text: '#fef9c3', icon: '#facc15', hoverBg: '#854d0e' }
      : { bg: '#fefce8', border: '#fef08a', text: '#713f12', icon: '#ca8a04', hoverBg: '#fef08a' };
  }
  // info (default)
  return isDark
    ? { bg: 'rgba(8, 47, 73, 0.4)', border: '#075985', text: '#e0f2fe', icon: '#38bdf8', hoverBg: '#075985' }
    : { bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e', icon: '#0284c7', hoverBg: '#bae6fd' };
}

function getIconElement(type: string, iconColor: string) {
  const style: React.CSSProperties = { color: iconColor };
  const cls = 'h-5 w-5 flex-shrink-0';
  if (type === 'success') return <CheckCircle className={cls} style={style} />;
  if (type === 'error') return <AlertCircle className={cls} style={style} />;
  if (type === 'warning') return <AlertTriangle className={cls} style={style} />;
  return <Info className={cls} style={style} />;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains('dark');
    setIsDark(checkDark());

    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = useMemo(() => getColors(type, isDark), [type, isDark]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-right-4"
      style={{
        backgroundColor: colors.bg,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: colors.border,
        color: colors.text,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {getIconElement(type, colors.icon)}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        onMouseEnter={() => setIsCloseHovered(true)}
        onMouseLeave={() => setIsCloseHovered(false)}
        className="ml-2 p-1 rounded-md transition-colors"
        style={{ backgroundColor: isCloseHovered ? colors.hoverBg : 'transparent' }}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
