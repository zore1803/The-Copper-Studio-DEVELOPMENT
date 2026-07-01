import { useCallback, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { ToastContext } from "./toastContext";

const styles = {
  success: {
    icon: CheckCircle2,
    border: "border-emerald-100",
    bg: "bg-emerald-50",
    iconText: "text-emerald-600",
  },
  error: {
    icon: XCircle,
    border: "border-red-100",
    bg: "bg-red-50",
    iconText: "text-red-600",
  },
  info: {
    icon: Info,
    border: "border-blue-100",
    bg: "bg-blue-50",
    iconText: "text-[#C55418]",
  },
};

const MAX_HISTORY = 50;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifHistory, setNotifHistory] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = useCallback(({ title, message = "", type = "success" }) => {
    const id = crypto.randomUUID();
    const ts = new Date();
    setToasts((current) => [...current, { id, title, message, type }]);
    setNotifHistory((current) => {
      const entry = { id, title, message, type, ts };
      const next = [entry, ...current].slice(0, MAX_HISTORY);
      return next;
    });
    setUnreadCount((n) => n + 1);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  const clearHistory = useCallback(() => {
    setNotifHistory([]);
    setUnreadCount(0);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, notifHistory, unreadCount, markAllRead, clearHistory }}>
      {children}
      <div className="fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
        {toasts.map((toast) => {
          const cfg = styles[toast.type] || styles.info;
          const Icon = cfg.icon;
          return (
            <div
              key={toast.id}
              className={`rounded-xl border ${cfg.border} ${cfg.bg} bg-white p-3 shadow-xl shadow-gray-950/10 animate-[toast-in_180ms_ease-out]`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${cfg.iconText}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-950">{toast.title}</p>
                  {toast.message && <p className="mt-0.5 text-xs leading-5 text-gray-500">{toast.message}</p>}
                </div>
                <button onClick={() => removeToast(toast.id)} className="rounded-lg p-1 text-gray-400 hover:bg-white/70 hover:text-gray-700">
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
