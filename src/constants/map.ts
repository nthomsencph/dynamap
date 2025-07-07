import { LatLngBoundsExpression } from 'leaflet';

// Map image dimensions
export const MAP_IMAGE_WIDTH = 2000; // px
export const MAP_IMAGE_HEIGHT = 2000; // px

// Map bounds and center
export const MAP_BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [MAP_IMAGE_HEIGHT, MAP_IMAGE_WIDTH],
];

export const MAP_CENTER: [number, number] = [
  MAP_IMAGE_HEIGHT / 2,
  MAP_IMAGE_WIDTH / 2,
];
