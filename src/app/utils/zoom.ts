import { MAP_IMAGE_WIDTH, MAP_IMAGE_HEIGHT } from '@/constants/map';

/**
 * Calculates the zoom level that fits the map image to the viewport
 */
export function getFitZoom(width: number, height: number): number {
  const scaleX = width / MAP_IMAGE_WIDTH;
  const scaleY = height / MAP_IMAGE_HEIGHT;
  // Use the smaller scale so the whole image fits inside the viewport, then shrink by 10%
  const scale = Math.min(scaleX, scaleY) * 0.9;
  const zoom = Math.log2(scale);
  return zoom;
}

/**
 * Calculates the zoom threshold for showing/hiding elements based on their prominence
 * @param prominence - Value from 1-10, where higher means more prominent
 * @param fitZoom - The base zoom level that fits the map to viewport
 */
export function getZoomThreshold(prominence: number, fitZoom: number): number {
  // Wider offset range: prominence 10 = fitZoom, prominence 1 = fitZoom + 2.7
  const zoomOffset = 3 - (prominence * 0.3);
  return fitZoom + zoomOffset;
}

/**
 * Calculate the prominence level based on current zoom and fit zoom
 * @param currentZoom The current zoom level
 * @param fitZoom The zoom level that fits the map in viewport
 * @returns The prominence level (10.0 to 1.0)
 */
export function calculateProminenceLevel(currentZoom: number, fitZoom: number): number {
  // From getZoomThreshold we know:
  // prominence 10 = fitZoom + 0
  // prominence 1 = fitZoom + 2.7
  // So we can calculate prominence directly:
  const zoomOffset = currentZoom - fitZoom;
  return Math.max(0, 10 - (zoomOffset / 0.3));
}

/**
 * Check if a map element should be visible at the current zoom level
 * @param prominence The prominence range of the map element (with lower and upper bounds)
 * @param currentZoom The current zoom level
 * @param fitZoom The zoom level that fits the map in viewport
 * @returns boolean indicating if the map element should be visible
 */
export function shouldShowElement(prominence: { lower: number; upper: number } | number, currentZoom: number, fitZoom: number): boolean {
  const currentProminence = calculateProminenceLevel(currentZoom, fitZoom);
  
  // Handle legacy single prominence values
  if (typeof prominence === 'number') {
    return currentProminence <= prominence;
  }
  
  // Handle new prominence range
  const { lower, upper } = prominence;
  
  // Element shows if current prominence is within the range
  // lower = 0 means no lower bound (always show if upper bound is met)
  const meetsLowerBound = lower === 0 || currentProminence >= lower;
  const meetsUpperBound = currentProminence <= upper;
  
  return meetsLowerBound && meetsUpperBound;
}

/**
 * Calculate the optimal zoom level for an element based on its upper prominence value
 * @param upperProminence The upper prominence bound of the element
 * @param fitZoom The zoom level that fits the map in viewport
 * @param offset Optional offset from the upper bound (default: 0.01)
 * @returns The optimal zoom level
 */
export function getOptimalZoomForElement(upperProminence: number, fitZoom: number, offset: number = 0.01): number {
  const targetProminence = upperProminence - offset;
  const zoomOffset = 3 - (targetProminence * 0.3);
  return fitZoom + zoomOffset;
}