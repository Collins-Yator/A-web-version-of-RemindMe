import React, { useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, X, Mail } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'reminder' | 'error';
  deliveryId?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onOpenNotification?: (deliveryId?: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss, onOpenNotification }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
          onClick={() => onOpenNotification && onOpenNotification(toast.deliveryId)}
        />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: () => void;
  onClick: () => void;
}> = ({ toast, onDismiss, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'reminder':
        return <Bell className="w-5 h-5 text-blue-600 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />;
      default:
        return <Mail className="w-5 h-5 text-indigo-600 shrink-0" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="pointer-events-auto flex items-start gap-3 p-4 bg-white border border-slate-200/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="p-1.5 bg-slate-50 rounded-lg">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {toast.title}
        </h4>
        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
          {toast.message}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
