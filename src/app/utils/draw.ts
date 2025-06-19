import { DrawingResult } from '@/hooks/elements/usePolygonDraw';

/**
 * Converts drawing results to polygon points
 * Handles rectangles, circles, and regular polygons
 */
export function convertDrawingToPolygonPoints(result: DrawingResult): [number, number][] {
    let points: [number, number][] = result.points;
    
    if (result.type === 'rectangle' && result.bounds) {
        // Rectangle: convert bounds to 4 corners (SW, NW, NE, SE, SW)
        const [[swLat, swLng], [neLat, neLng]] = result.bounds;
        points = [
            [swLat, swLng], // SW
            [neLat, swLng], // NW
            [neLat, neLng], // NE
            [swLat, neLng], // SE
            [swLat, swLng], // Close polygon
        ];
    } else if (result.type === 'circle' && result.center && result.radius) {
        // Circle: approximate as 32-point polygon
        const numPoints = 32;
        const [centerLat, centerLng] = result.center;
        const radius = result.radius;
        points = Array.from({ length: numPoints }, (_, i) => {
            const angle = (2 * Math.PI * i) / numPoints;
            // For custom coordinate system, use a more appropriate scale factor
            // Since the radius is in meters but coordinates are in custom units,
            // we need to scale it appropriately for the map
            const scaleFactor = 0.1; // Increased scale factor for better visibility
            const dLat = (radius * scaleFactor) * Math.cos(angle);
            const dLng = (radius * scaleFactor) * Math.sin(angle);
            return [centerLat + dLat, centerLng + dLng] as [number, number];
        });
        // Close polygon
        points.push(points[0]);
    }
    
    return points;
} 