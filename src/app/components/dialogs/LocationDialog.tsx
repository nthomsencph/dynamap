import React from 'react';
import type { Location } from '@/types/locations';
import { DEFAULT_ICON_SIZE } from '@/types/locations';
import type { LocationDialogProps } from '@/types/dialogs';
import { DEFAULT_DIALOG_COLORS } from '@/types/dialogs';
import { BaseDialog } from './BaseDialog';
import '@/css/dialogs/base-dialog.css';

export function LocationDialog({ open, mode, location, onSave, onDelete, onClose }: LocationDialogProps) {
  const validateForm = (form: Partial<Location>): string | null => {
    const requiredFields = ['name', 'type', 'position', 'color', 'icon'] as const;
    for (const key of requiredFields) {
      if (!form[key]?.toString().trim()) {
        return `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      }
    }
    return null;
  };

  return (
    <BaseDialog<Location>
      open={open}
      mode={mode}
      element={location || undefined}
      onSave={onSave}
      onDelete={onDelete}
      onClose={onClose}
      defaultColor={DEFAULT_DIALOG_COLORS.location}
      title="Location"
      typeCategory="locations"
      validateForm={validateForm}
      stylingFields={{
        fields: [{
          id: 'iconSize',
          label: 'Icon size',
          type: 'range',
          min: 16,
          max: 32,
          defaultValue: DEFAULT_ICON_SIZE,
          getValue: (element) => element?.iconSize || DEFAULT_ICON_SIZE,
          onChange: (element, value) => ({ ...element, iconSize: value as number })
        }]
      }}
    />
  );
}
