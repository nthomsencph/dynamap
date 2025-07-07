import L from 'leaflet';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import {
  pointInPolygon,
  calculatePolygonCenter,
  calculatePolygonAreaDirect,
} from './geometry';
import { calculatePolygonAreaPostGIS } from './postgis';

/**
 * Calculates the area of a polygon in screen pixels
 * @param points Array of [lat, lng] points defining the polygon
 * @param map Leaflet map instance
 * @returns Area in screen pixels
 */
export function calculatePolygonArea(
  points: [number, number][],
  map: L.Map
): number {
  // Convert latlng points to screen coordinates
  const screenPoints = points.map(point => {
    const latlng = L.latLng(point[0], point[1]);
    const point2 = map.latLngToContainerPoint(latlng);
    return [point2.x, point2.y];
  });

  // Calculate area using shoelace formula
  let area = 0;
  for (let i = 0; i < screenPoints.length; i++) {
    const j = (i + 1) % screenPoints.length;
    area += screenPoints[i][0] * screenPoints[j][1];
    area -= screenPoints[j][0] * screenPoints[i][1];
  }
  return Math.abs(area / 2);
}

/**
 * Calculates the area of a polygon in square kilometers
 * @param points Array of [lat, lng] points defining the polygon
 * @param map Leaflet map instance
 * @param mapScale Map scale in km per pixel at BASE_ZOOM
 * @param client Optional database client for PostGIS calculation
 * @returns Area in square kilometers
 */
export async function calculatePolygonAreaKm(
  points: [number, number][],
  map: L.Map,
  mapScale: number,
  client?: any
): Promise<number> {
  // Check if we're dealing with custom coordinates (non-geographic)
  // Custom coordinates typically have values > 100, while lat/lng are typically < 90
  const isCustomCoordinates = points.some(
    point => Math.abs(point[0]) > 100 || Math.abs(point[1]) > 100
  );

  let areaPixels: number;

  if (isCustomCoordinates && client) {
    // Use PostGIS for custom coordinate system when database client is available
    try {
      areaPixels = await calculatePolygonAreaPostGIS(client, points);
    } catch (error) {
      console.warn(
        'PostGIS area calculation failed, falling back to manual calculation:',
        error
      );
      areaPixels = calculatePolygonAreaDirect(points);
    }
  } else if (isCustomCoordinates) {
    // Use direct calculation for custom coordinate system
    areaPixels = calculatePolygonAreaDirect(points);
  } else {
    // Convert latlng points to screen coordinates at current map zoom
    const screenPoints = points.map(point => {
      const latlng = L.latLng(point[0], point[1]);
      const point2 = map.latLngToContainerPoint(latlng);
      return [point2.x, point2.y];
    });

    // Calculate area in square pixels using shoelace formula
    areaPixels = 0;
    for (let i = 0; i < screenPoints.length; i++) {
      const j = (i + 1) % screenPoints.length;
      areaPixels += screenPoints[i][0] * screenPoints[j][1];
      areaPixels -= screenPoints[j][0] * screenPoints[i][1];
    }
    areaPixels = Math.abs(areaPixels / 2);
  }

  // Convert square pixels to square kilometers
  // At BASE_ZOOM, 1 pixel represents mapScale km
  // So 1 square pixel = mapScale² square km
  const pixelsToKm = mapScale;
  const areaKm = areaPixels * (pixelsToKm * pixelsToKm);

  return areaKm;
}

/**
 * Calculates the appropriate font size based on polygon area
 * @param area Area in screen pixels
 * @returns Font size in pixels
 */
export function getFontSizeForArea(area: number): number {
  // Slightly smaller range for better map readability
  const minSize = 12; // Smaller minimum for tiny regions
  const maxSize = 32; // More reasonable maximum

  // Keep your area thresholds - they seem well calibrated
  const minArea = 500;
  const maxArea = 200000;

  const clampedArea = Math.max(minArea, Math.min(maxArea, area));

  // Your power scaling is excellent - maybe try 1.3 for slightly less aggressive curve
  const scale = Math.pow(
    (Math.log(clampedArea) - Math.log(minArea)) /
      (Math.log(maxArea) - Math.log(minArea)),
    1.2 // Slightly less aggressive than 1.5
  );

  const fontSize = Math.round(minSize + scale * (maxSize - minSize));
  return fontSize;
}

/**
 * Calculate the center position of a map element (location or region)
 * @param element The location or region element
 * @returns The center position as [lat, lng]
 */
export function getElementCenter(element: Location | Region): [number, number] {
  if (element.elementType === 'region') {
    // Region: calculate the center of the polygon
    const positions = element.geom as [number, number][];
    const centerLat =
      positions.reduce((sum, pos) => sum + pos[0], 0) / positions.length;
    const centerLng =
      positions.reduce((sum, pos) => sum + pos[1], 0) / positions.length;
    return [centerLat, centerLng];
  } else {
    // Location: use the single position
    return element.geom as [number, number];
  }
}
