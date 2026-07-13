import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'cancel',
  warning: 'warning',
  info: 'info',
};

const colors: Record<ToastType, { bg: string; icon: string; bar: string }> = {
  success: { bg: '#1a1d27', icon: '#22c55e', bar: '#22c55e' },
  error:   { bg: '#1a1d27', icon: '#ef4444', bar: '#ef4444' },
  warning: { bg: '#1a1d27', icon: '#ef4444', bar: '#ef4444' },
  info:    { bg: '#1a1d27', icon: '#3b82f6', bar: '#3b82f6' },
};

let toastId = 0;
let externalToast: ((msg: string, type?: ToastType) => void) | null = null;
let externalConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

// Standalone helpers — call anywhere without hooks
export const showToast = (message: string, type: ToastType = 'info') => {
  externalToast?.(message, type);
};
export const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
  if (externalConfirm) return externalConfirm(options);
  return Promise.resolve(window.confirm(options.message));
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => setConfirmState({ opts, resolve }));
  }, []);

  useEffect(() => {
    externalToast = toast;
    externalConfirm = confirm;
    return () => { externalToast = null; externalConfirm = null; };
  }, [toast, confirm]);

  const handleConfirm = (val: boolean) => {
    confirmState?.resolve(val);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 360 }}>
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-4 fade-in duration-300"
              style={{ background: c.bg, borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5" style={{ color: c.icon }}>{icons[t.type]}</span>
              <p className="text-sm leading-snug flex-1" style={{ color: '#e2e8f0' }}>{t.message}</p>
              <div className="absolute bottom-0 left-0 h-0.5 rounded-b-xl animate-[shrink_4s_linear_forwards]" style={{ background: c.bar, width: '100%' }} />
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => handleConfirm(false)} />
          <div
            className="relative w-full max-w-sm rounded-2xl shadow-2xl border p-6 animate-in zoom-in-95 fade-in duration-200"
            style={{ background: '#1a1d27', borderColor: '#2d3748' }}
          >
            {/* Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: confirmState.opts.danger ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)' }}>
                <span className="material-symbols-outlined text-xl"
                  style={{ color: confirmState.opts.danger ? '#ef4444' : '#3b82f6' }}>
                  {confirmState.opts.danger ? 'warning' : 'help'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {confirmState.opts.title || 'Xác nhận'}
              </h3>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#94a3b8' }}>
              {confirmState.opts.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition border"
                style={{ borderColor: '#2d3748', color: '#94a3b8' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {confirmState.opts.cancelText || 'Hủy'}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition"
                style={{ background: confirmState.opts.danger ? '#ef4444' : '#3b82f6' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {confirmState.opts.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shrink { from { width: 100% } to { width: 0% } }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
