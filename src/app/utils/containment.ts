const polygonClipping = require('polygon-clipping');
import type { Region } from '@/types/regions';

type Point = [number, number];
type Polygon = Point[];

/**
 * Find all regions that contain the clicked point, sorted from smallest to largest
 * @param clickPoint - The [x, y] coordinates of the click
 * @param regions - Array of regions to check
 * @returns Array of regions containing the point, sorted by area (smallest first)
 */
export function findContainingRegions(
    clickPoint: Point,
    regions: Region[]
  ): Region[] {
    // First, find all regions that contain the point
    const containingRegions = regions.filter(region => 
      pointInPolygon(clickPoint, region.position)
    );
  
    // Sort by area (smallest first)
    const sortedRegions = containingRegions.sort((a, b) => {
      // Use calculated areas instead of stored areas since stored areas appear to be incorrect
      const areaA = getArea(a.position);
      const areaB = getArea(b.position);
      
      return areaA - areaB;
    });
    
    return sortedRegions;
  }

/**
 * Returns true if `inner` polygon is at least `minPercent` contained within `outer` polygon
 * @param inner - The polygon to check containment for
 * @param outer - The containing polygon
 * @param minPercent - Minimum percentage (0-100) of inner that must be inside outer
 * @returns true if inner is at least minPercent% contained in outer
 */
export function isPercentContained(
  inner: Polygon,
  outer: Polygon,
  minPercent: number
): boolean {
  // Early rejection 1: Bounding box check
  const innerBounds = getBounds(inner);
  const outerBounds = getBounds(outer);
  
  if (!boundsOverlap(innerBounds, outerBounds)) {
    return false;
  }

  // Early rejection 2: Max possible overlap check
  const maxOverlap = getOverlapArea(innerBounds, outerBounds);
  const innerArea = getArea(inner);
  
  if ((maxOverlap / innerArea) * 100 < minPercent) {
    return false;
  }

  // Early rejection 3: Sample a few points
  const sampleSize = Math.min(10, inner.length);
  const step = Math.floor(inner.length / sampleSize);
  let insideCount = 0;
  
  for (let i = 0; i < inner.length; i += step) {
    if (pointInPolygon(inner[i], outer)) {
      insideCount++;
    }
  }
  
  if ((insideCount / sampleSize) * 100 < minPercent * 0.5) {
    return false;
  }

  // Do the actual intersection
  const intersectionResult = polygonClipping.intersection([inner], [outer]);
  if (intersectionResult.length === 0) return false;
  
  const intersectionArea = getArea(intersectionResult[0][0]);
  return (intersectionArea / innerArea) * 100 >= minPercent;
}

// Example usage:
// isPercentContained(polygonA, polygonB, 80) returns true if A is ≥80% inside B

function getBounds(poly: Polygon) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const [x, y] of poly) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  
  return { minX, minY, maxX, maxY };
}

function boundsOverlap(a: any, b: any): boolean {
  return !(a.maxX < b.minX || b.maxX < a.minX || 
           a.maxY < b.minY || b.maxY < a.minY);
}

function getOverlapArea(a: any, b: any): number {
  const width = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const height = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  return Math.max(0, width * height);
}

function getArea(poly: Polygon): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    area += poly[i][0] * poly[j][1];
    area -= poly[j][0] * poly[i][1];
  }
  return Math.abs(area) / 2;
}

function pointInPolygon(point: Point, poly: Polygon): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    
    if (((yi > y) !== (yj > y)) && 
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}