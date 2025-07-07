import { MapElement } from '@/types/elements';

/**
 * Default types for regions.
 * These are the predefined types that come with the application.
 * Users can also type custom types directly in the dialog.
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
  'Desert',
] as const;

// Region interface
export interface Region extends MapElement {
  geom: [number, number][]; // Regions must have multiple points forming a polygon
  showBorder?: boolean; // Whether to show the border of the region
  showHighlight?: boolean; // Whether to show the highlight when hovering
  area?: number; // Calculated area of the region
  areaFadeDuration?: number; // Duration of the area highlight animation
}
