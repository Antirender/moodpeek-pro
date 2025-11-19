import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type WeeklyGoalModalProps = {
  open: boolean;
  onClose: () => void;
  targetCheckins: number;
  onDownloadReminder: () => void;
};

export default function WeeklyGoalModal({ open, onClose, targetCheckins, onDownloadReminder }: WeeklyGoalModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const restoreOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = restoreOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      primaryButtonRef.current?.focus();
    }
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="goal-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="goal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-goal-title"
        aria-describedby="weekly-goal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="goal-modal-header">
          <p className="muted">MoodPeek</p>
          <button type="button" className="goal-modal-close" aria-label="Close weekly goal dialog" onClick={onClose}>
            &times;
          </button>
        </div>
        <h3 id="weekly-goal-title">Set a weekly goal</h3>
        <p id="weekly-goal-description">
          Commit to {targetCheckins} check-ins next week. We&apos;ll drop a calendar reminder you can follow.
        </p>
        <div className="goal-modal-actions">
          <button type="button" ref={primaryButtonRef} className="btn-cta" onClick={onDownloadReminder}>
            Download reminder (.ics)
          </button>
          <button type="button" className="ghost-button" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
