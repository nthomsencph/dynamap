/**
 * Checks if a point is inside a polygon using the ray-casting algorithm
 * @param point [lat, lng] point
 * @param polygon Array of [lat, lng] points defining the polygon
 * @returns true if the point is inside the polygon
 */
export function pointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  let x = point[0],
    y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0],
      yi = polygon[i][1];
    let xj = polygon[j][0],
      yj = polygon[j][1];
    let intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Helper function to calculate the center point of a polygon
export function calculatePolygonCenter(
  points: [number, number][]
): [number, number] {
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
