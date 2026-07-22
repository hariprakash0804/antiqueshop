import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, duration, startTime: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex flex-col gap-3 pointer-events-none sm:max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  const typeStyles = {
    success: {
      border: 'border-cyber-gold/50',
      bg: 'bg-cyber-gold/10',
      icon: '✦',
      iconColor: 'text-cyber-gold',
      progressColor: 'bg-cyber-gold',
      label: 'CONFIRMED'
    },
    error: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      icon: '✕',
      iconColor: 'text-red-500',
      progressColor: 'bg-red-500',
      label: 'ERROR'
    },
    info: {
      border: 'border-cyber-cyan/50',
      bg: 'bg-cyber-cyan/10',
      icon: '◈',
      iconColor: 'text-cyber-cyan',
      progressColor: 'bg-cyber-cyan',
      label: 'SYSTEM'
    },
    warning: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/10',
      icon: '⚠',
      iconColor: 'text-amber-500',
      progressColor: 'bg-amber-500',
      label: 'ALERT'
    }
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  useEffect(() => {
    const timer = setTimeout(() => setIsExiting(true), toast.duration - 300);
    return () => clearTimeout(timer);
  }, [toast.duration]);

  return (
    <div 
      className={`pointer-events-auto rounded-2xl ${style.bg} ${style.border} border backdrop-blur-xl p-4 shadow-2xl transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-slide-in-right'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`${style.iconColor} text-lg font-display mt-0.5`}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-[9px] font-display tracking-[0.3em] ${style.iconColor} mb-1`}>
            {style.label}
          </div>
          <p className="text-xs text-gray-200 font-sans leading-relaxed">{toast.message}</p>
        </div>
        <button 
          onClick={() => onRemove(toast.id)}
          className="text-gray-500 hover:text-white text-xs font-display shrink-0"
        >
          [×]
        </button>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-0.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${style.progressColor} rounded-full`}
          style={{ 
            animation: `shrink ${toast.duration}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
}
