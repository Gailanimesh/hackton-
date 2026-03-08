'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '1rem 1.75rem',
              background: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid rgba(255,255,255,0.1)`,
              borderLeft: toast.type === 'success' ? '4px solid #00f2fe' : '4px solid #ff4444',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              animation: 'slideInRight 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
              pointerEvents: 'auto',
              maxWidth: '350px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>
              {toast.type === 'success' ? '✨' : '⚠️'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
