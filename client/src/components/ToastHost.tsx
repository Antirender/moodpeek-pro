import { useEffect, useState } from 'react';

type ToastItem = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

let enqueueToast: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function showToast(toast: Omit<ToastItem, 'id'>) {
  if (enqueueToast) {
    enqueueToast(toast);
  }
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    enqueueToast = (toast) => {
      const id = Date.now();
      const duration = toast.duration ?? 4000;
      setItems((prev) => [...prev, { ...toast, id, duration }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, duration);
    };
    return () => {
      enqueueToast = null;
    };
  }, []);

  if (!items.length) return null;

  return (
    <div className="toast-container">
      {items.map((item) => (
        <div key={item.id} className="toast">
          <span>{item.message}</span>
          {item.actionLabel && item.onAction && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  item.onAction?.();
                  setItems((prev) => prev.filter((toast) => toast.id !== item.id));
                }}
              >
                {item.actionLabel}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}