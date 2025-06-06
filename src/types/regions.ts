import { MapElement } from '@/types/elements';

/**
 * Default types for regions.
 * These are the predefined types that come with the application.
 * Custom types can be added through the UI and are stored in public/types.json.
 */
export const DEFAULT_REGION_TYPES = [
  'Region',
  'Island',
  'Continent',
  'Kingdom',
  'Forest',
  'Mountains',
  'Lake',
  'Sea',
  'Desert'
] as const;

// Region interface
export interface Region extends MapElement {
  position: [number, number][];  // Regions must have multiple points
  showBorder: boolean;
  showHighlight: boolean;  // Whether to show the area fill
  area?: number;  // Calculated area of the region in square pixels
} 