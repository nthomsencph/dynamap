import L from 'leaflet';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

// Constants from ScaleBar component
const BASE_PIXELS = 115;

/**
 * Calculates the area of a polygon in screen pixels
 * @param points Array of [lat, lng] points defining the polygon
 * @param map Leaflet map instance
 * @returns Area in screen pixels
 */
export function calculatePolygonArea(points: [number, number][], map: L.Map): number {
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
 * Calculates the area of a polygon directly from custom coordinates
 * @param points Array of [x, y] points defining the polygon
 * @returns Area in square units
 */
export function calculatePolygonAreaDirect(points: [number, number][]): number {
  // Calculate area using shoelace formula directly on the coordinates
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return Math.abs(area / 2);
}

/**
 * Calculates the area of a polygon in square kilometers
 * @param points Array of [lat, lng] points defining the polygon
 * @param map Leaflet map instance
 * @param mapScale Map scale in km per pixel at BASE_ZOOM
 * @returns Area in square kilometers
 */
export function calculatePolygonAreaKm(points: [number, number][], map: L.Map, mapScale: number): number {
  // Check if we're dealing with custom coordinates (non-geographic)
  // Custom coordinates typically have values > 100, while lat/lng are typically < 90
  const isCustomCoordinates = points.some(point => Math.abs(point[0]) > 100 || Math.abs(point[1]) > 100);
  
  let areaPixels: number;
  
  if (isCustomCoordinates) {
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
  const minSize = 12;      // Smaller minimum for tiny regions
  const maxSize = 32;      // More reasonable maximum
  
  // Keep your area thresholds - they seem well calibrated
  const minArea = 500;     
  const maxArea = 200000;  
  
  const clampedArea = Math.max(minArea, Math.min(maxArea, area));
  
  // Your power scaling is excellent - maybe try 1.3 for slightly less aggressive curve
  const scale = Math.pow(
    (Math.log(clampedArea) - Math.log(minArea)) / (Math.log(maxArea) - Math.log(minArea)),
    1.2  // Slightly less aggressive than 1.5
  );
  
  const fontSize = Math.round(minSize + scale * (maxSize - minSize));
  return fontSize;
}

/**
 * Checks if a point is inside a polygon using the ray-casting algorithm
 * @param point [lat, lng] point
 * @param polygon Array of [lat, lng] points defining the polygon
 * @returns true if the point is inside the polygon
 */
export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0], yi = polygon[i][1];
    let xj = polygon[j][0], yj = polygon[j][1];
    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
} 

// Helper function to calculate the center point of a polygon
export function calculatePolygonCenter(points: [number, number][]): [number, number] {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  area *= 0.5;
  const factor = 1 / (6 * area);
  return [cx * factor, cy * factor];
}

/**
 * Calculate the center position of a map element (location or region)
 * @param element The location or region element
 * @returns The center position as [lat, lng]
 */
export function getElementCenter(element: Location | Region): [number, number] {
  if (element.elementType === 'region') {
    // Region: calculate the center of the polygon
    const positions = element.position as [number, number][];
    const centerLat = positions.reduce((sum, pos) => sum + pos[0], 0) / positions.length;
    const centerLng = positions.reduce((sum, pos) => sum + pos[1], 0) / positions.length;
    return [centerLat, centerLng];
  } else {
    // Location: use the single position
    return element.position as [number, number];
  }
}