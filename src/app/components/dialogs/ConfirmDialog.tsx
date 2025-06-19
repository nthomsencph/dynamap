import React from 'react';
import '@/css/dialogs/confirm-dialog.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDeleteFromTimeline?: () => void;
  showDeleteFromTimeline?: boolean;
}

export function ConfirmDialog({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  onDeleteFromTimeline,
  showDeleteFromTimeline = false 
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="confirm-dialog-backdrop" onClick={onCancel}>
      <div 
        className="confirm-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button type="button" className="dialog-cancel" onClick={onCancel}>Cancel</button>
          {showDeleteFromTimeline && onDeleteFromTimeline && (
            <button type="button" className="dialog-delete-timeline" onClick={onDeleteFromTimeline}>
              Delete from Timeline
            </button>
          )}
          <button type="button" className="dialog-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
} 