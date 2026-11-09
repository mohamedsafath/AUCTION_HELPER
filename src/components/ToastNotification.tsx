import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Undo2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description?: string;
  canUndo?: boolean;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
  onUndo?: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
  onUndo,
}) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-center space-x-3 max-w-md backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white">{toast.title}</div>
          {toast.description && (
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {toast.description}
            </div>
          )}
        </div>

        {toast.canUndo && onUndo && (
          <button
            onClick={() => {
              onUndo();
              onClose();
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-400 text-xs font-bold flex items-center space-x-1 border border-amber-500/30 transition flex-shrink-0"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-white transition flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
