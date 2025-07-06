import React from 'react';
import type { Region } from '@/types/regions';
import type { RegionDialogProps } from '@/types/dialogs';
import { DEFAULT_DIALOG_COLORS } from '@/types/dialogs';
import { BaseDialog } from './BaseDialog';
import { calculatePolygonAreaKm } from '@/app/utils/area';
import { useSettings } from '@/hooks/useSettings';
import '@/css/dialogs/base-dialog.css';

interface ExtendedRegionDialogProps extends RegionDialogProps {
  onPreviewChange?: (previewElement: Partial<Region>) => void;
}

export function RegionDialog({ 
  open, 
  mode, 
  region, 
  map, 
  onSave, 
  onDelete, 
  onClose,
  onPreviewChange
}: ExtendedRegionDialogProps) {
  const { settings } = useSettings();
  const { mapScale = 17.4 } = settings || {};
  const validateForm = (form: Partial<Region>): string | null => {
    // Basic required fields
    if (!form.name?.trim()) return 'Please enter a name for the region.';
    if (!form.type?.trim()) return 'Please select or create a type for the region.';
    if (!form.position?.length) return 'Region must have a position.';
    return null;
  };

  const handleSave = (regionToSave: Region) => {
    let area = regionToSave.area;
    if (area === undefined && regionToSave.position && map) {
      area = calculatePolygonAreaKm(regionToSave.position, map, mapScale);
    }
    onSave({ ...regionToSave, area });
  };

  const regionArea = region?.area !== undefined
    ? region.area
    : (region?.position && map ? calculatePolygonAreaKm(region.position, map, mapScale) : undefined);

  return (
    <BaseDialog<Region>
      open={open}
      mode={mode}
      element={region || undefined}
      onSave={handleSave}
      onDelete={onDelete}
      onClose={onClose}
      defaultColor={DEFAULT_DIALOG_COLORS.region}
      title="Region"
      typeCategory="regions"
      validateForm={validateForm}
      stylingFields={{
        fields: [
          {
            id: 'showBorder',
            label: 'Show border',
            type: 'checkbox',
            defaultValue: true,
            getValue: (element) => element?.showBorder !== false,
            onChange: (element, value) => ({ ...element, showBorder: value as boolean })
          },
          {
            id: 'showHighlight',
            label: 'Show highlight',
            type: 'checkbox',
            defaultValue: true,
            getValue: (element) => element?.showHighlight !== false,
            onChange: (element, value) => ({ ...element, showHighlight: value as boolean })
          },
          {
            id: 'areaFadeDuration',
            label: 'Area fade duration',
            type: 'range',
            min: 0,
            max: 2000,
            defaultValue: 800,
            getValue: (element) => element?.areaFadeDuration ?? 800,
            onChange: (element, value) => ({ ...element, areaFadeDuration: value as number }),
            showWhen: (element) => (element?.showBorder !== false) || (element?.showHighlight !== false)
          }
        ]
      }}
      richTextEditorProps={{ isRegion: true, regionArea }}
      mapRef={{ current: map }}
      onPreviewChange={onPreviewChange}
    />
  );
}
