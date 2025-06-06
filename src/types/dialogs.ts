import type { Location } from './locations';
import type { Region } from './regions';
import type { Map as LeafletMap } from 'leaflet';

export type DialogMode = 'create' | 'edit';
export type DialogTab = 'content' | 'styling' | 'custom';

export interface BaseDialogProps {
  open: boolean;
  mode: DialogMode;
  onSave: (element: any) => void;
  onDelete: (element: any) => void;
  onClose: () => void;
}

export interface LocationDialogProps extends BaseDialogProps {
  location: Partial<Location> | null;
}

export interface RegionDialogProps extends BaseDialogProps {
  region?: Region;
  position?: [number, number][];
  map: LeafletMap;
}

// Default values
export const DEFAULT_DIALOG_COLORS = {
  location: '#ffffff',
  region: '#2563eb'
} as const;

export const DEFAULT_ICON_SIZE = 24; 