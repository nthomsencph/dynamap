import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import type { Map as LeafletMap } from 'leaflet';

export type EditorMode = 'simple' | 'full';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  nameFallback?: string;
  rows?: number;
  mode?: EditorMode;
  mentions?: {
    locations?: Location[];
    regions?: Region[];
  };
  onElementSelect?: (element: Location | Region) => void;
  isRegion?: boolean;
  map?: LeafletMap;
  position?: [number, number][];
}
