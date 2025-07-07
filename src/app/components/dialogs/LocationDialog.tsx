import React from 'react';
import type { Location } from '@/types/locations';
import { DEFAULT_ICON_SIZE } from '@/types/locations';
import type { LocationDialogProps } from '@/types/dialogs';
import { DEFAULT_DIALOG_COLORS } from '@/types/dialogs';
import { BaseDialog } from './BaseDialog';
import '@/css/dialogs/base-dialog.css';

interface ExtendedLocationDialogProps extends LocationDialogProps {
  mapRef?: React.RefObject<L.Map | null>;
  onPreviewChange?: (previewElement: Partial<Location>) => void;
}

export function LocationDialog({
  open,
  mode,
  location,
  onSave,
  onDelete,
  onClose,
  mapRef,
  onPreviewChange,
}: ExtendedLocationDialogProps) {
  const validateForm = (form: Partial<Location>): string | null => {
    // Check required text fields
    if (!form.name?.toString().trim()) {
      return 'Name is required';
    }
    if (!form.type?.toString().trim()) {
      return 'Type is required';
    }
    if (!form.geom) {
      return 'Position is required';
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
        fields: [
          {
            id: 'iconSize',
            label: 'Icon size',
            type: 'range',
            min: 1,
            max: 24,
            defaultValue: DEFAULT_ICON_SIZE,
            getValue: element => element?.iconSize || DEFAULT_ICON_SIZE,
            onChange: (element, value) => ({
              ...element,
              iconSize: value as number,
            }),
          },
        ],
      }}
      mapRef={mapRef}
      onPreviewChange={onPreviewChange}
    />
  );
}
