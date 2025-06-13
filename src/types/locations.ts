import { MapElement } from '@/types/elements';

/**
 * Default types for locations.
 * These are the predefined types that come with the application.
 * Custom types can be added through the UI and are stored in public/types.json.
 */
export const DEFAULT_LOCATION_TYPES = [
  'City',
  'Town',
  'Village',
  'Castle',
  'Ruin',
  'Landmark'
] as const;

// Default icon size for locations
export const DEFAULT_ICON_SIZE = 12;

// Location interface
export interface Location extends MapElement {
  position: [number, number];  // Locations must have a single point
  iconSize?: number;  // Base size of the icon (will be scaled based on zoom)
} 