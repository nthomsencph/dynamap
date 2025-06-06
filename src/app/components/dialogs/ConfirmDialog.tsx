import React from 'react';
import '@/css/dialogs/confirm-dialog.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
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
          <button type="button" className="dialog-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
} 