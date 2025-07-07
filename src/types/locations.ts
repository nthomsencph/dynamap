import { MapElement } from '@/types/elements';

/**
 * Default types for locations.
 * These are the predefined types that come with the application.
 * Users can also type custom types directly in the dialog.
 */
export const DEFAULT_LOCATION_TYPES = [
  'City',
  'Town',
  'Village',
  'Castle',
  'Ruin',
  'Landmark',
] as const;

// Default icon size for locations
export const DEFAULT_ICON_SIZE = 12;

// Location interface
export interface Location extends MapElement {
  geom: [number, number]; // Locations must have a single point
  iconSize?: number; // Base size of the icon (will be scaled based on zoom)
}
