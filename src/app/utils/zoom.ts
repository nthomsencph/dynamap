import { MAP_IMAGE_WIDTH, MAP_IMAGE_HEIGHT } from '@/constants/map';
import type { MapElement } from '@/types/elements';

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
 * Check if an element should be visible at the current zoom level
 * @param prominence The prominence level of the element
 * @param currentZoom The current zoom level
 * @param fitZoom The zoom level that fits the map in viewport
 * @returns boolean indicating if the element should be visible
 */
export function shouldShowElement(prominence: number, currentZoom: number, fitZoom: number): boolean {
  const currentProminence = calculateProminenceLevel(currentZoom, fitZoom);
  // Show element when current prominence level is less than or equal to the element's prominence
  // e.g., an element with prominence 5 should show when current prominence is 5.0 or lower
  return currentProminence <= prominence;
}