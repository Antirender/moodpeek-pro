import { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

export default function Toast({ message, actionLabel, onAction, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="toast">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="text-link" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}