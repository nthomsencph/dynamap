import type { PoolClient } from 'pg';

/**
 * PostGIS spatial utility functions for Dynamap
 * Uses custom coordinate system (SRID 0) for the 2000x2000 pixel space
 */

/**
 * Convert a point coordinate array to PostGIS POINT geometry
 * @param position [x, y] coordinate array
 * @returns PostGIS POINT geometry string
 */
export function pointToGeometry(position: [number, number]): string {
  const [x, y] = position;
  return `POINT(${x} ${y})`;
}

/**
 * Convert a polygon coordinate array to PostGIS POLYGON geometry
 * @param positions Array of [x, y] coordinate arrays
 * @returns PostGIS POLYGON geometry string
 */
export function polygonToGeometry(positions: [number, number][]): string {
  if (positions.length < 3) {
    throw new Error('Polygon must have at least 3 points');
  }

  // Ensure polygon is closed (first and last points are the same)
  const coords = [...positions];
  if (
    coords[0][0] !== coords[coords.length - 1][0] ||
    coords[0][1] !== coords[coords.length - 1][1]
  ) {
    coords.push(coords[0]);
  }

  const coordString = coords.map(([x, y]) => `${x} ${y}`).join(', ');
  return `POLYGON((${coordString}))`;
}

/**
 * Calculate the area of a polygon using PostGIS ST_Area
 * @param client Database client
 * @param positions Array of [x, y] coordinate arrays
 * @returns Area in square units
 */
export async function calculatePolygonAreaPostGIS(
  client: PoolClient,
  positions: [number, number][]
): Promise<number> {
  if (positions.length < 3) {
    return 0;
  }

  const geometry = polygonToGeometry(positions);
  const query = `
    SELECT ST_Area(ST_GeomFromText($1, 0)) as area
  `;

  const result = await client.query(query, [geometry]);
  return parseFloat(result.rows[0].area) || 0;
}

/**
 * Check if a point is inside a polygon using PostGIS ST_Contains
 * @param client Database client
 * @param point [x, y] coordinate array
 * @param polygon Array of [x, y] coordinate arrays defining the polygon
 * @returns true if the point is inside the polygon
 */
export async function pointInPolygonPostGIS(
  client: PoolClient,
  point: [number, number],
  polygon: [number, number][]
): Promise<boolean> {
  if (polygon.length < 3) {
    return false;
  }

  const pointGeom = pointToGeometry(point);
  const polygonGeom = polygonToGeometry(polygon);

  const query = `
    SELECT ST_Contains(ST_GeomFromText($1, 0), ST_GeomFromText($2, 0)) as contains
  `;

  const result = await client.query(query, [polygonGeom, pointGeom]);
  return result.rows[0].contains || false;
}

/**
 * Calculate the center point of a polygon using PostGIS ST_Centroid
 * @param client Database client
 * @param positions Array of [x, y] coordinate arrays
 * @returns Center point as [x, y] coordinate array
 */
export async function calculatePolygonCenterPostGIS(
  client: PoolClient,
  positions: [number, number][]
): Promise<[number, number]> {
  if (positions.length < 3) {
    // Return average of points for invalid polygons
    const avgX = positions.reduce((sum, [x]) => sum + x, 0) / positions.length;
    const avgY =
      positions.reduce((sum, [, y]) => sum + y, 0) / positions.length;
    return [avgX, avgY];
  }

  const geometry = polygonToGeometry(positions);
  const query = `
    SELECT ST_X(ST_Centroid(ST_GeomFromText($1, 0))) as x, 
           ST_Y(ST_Centroid(ST_GeomFromText($1, 0))) as y
  `;

  const result = await client.query(query, [geometry]);
  return [parseFloat(result.rows[0].x), parseFloat(result.rows[0].y)];
}

/**
 * Check if one polygon is contained within another using PostGIS ST_Contains
 * @param client Database client
 * @param innerPolygon Array of [x, y] coordinate arrays for the inner polygon
 * @param outerPolygon Array of [x, y] coordinate arrays for the outer polygon
 * @returns true if inner polygon is contained within outer polygon
 */
export async function polygonContainsPolygonPostGIS(
  client: PoolClient,
  innerPolygon: [number, number][],
  outerPolygon: [number, number][]
): Promise<boolean> {
  if (innerPolygon.length < 3 || outerPolygon.length < 3) {
    return false;
  }

  const innerGeom = polygonToGeometry(innerPolygon);
  const outerGeom = polygonToGeometry(outerPolygon);

  const query = `
    SELECT ST_Contains(ST_GeomFromText($1, 0), ST_GeomFromText($2, 0)) as contains
  `;

  const result = await client.query(query, [outerGeom, innerGeom]);
  return result.rows[0].contains || false;
}

/**
 * Calculate the percentage of one polygon that is contained within another
 * @param client Database client
 * @param innerPolygon Array of [x, y] coordinate arrays for the inner polygon
 * @param outerPolygon Array of [x, y] coordinate arrays for the outer polygon
 * @returns Percentage (0-100) of containment
 */
export async function calculateContainmentPercentagePostGIS(
  client: PoolClient,
  innerPolygon: [number, number][],
  outerPolygon: [number, number][]
): Promise<number> {
  if (innerPolygon.length < 3 || outerPolygon.length < 3) {
    return 0;
  }

  const innerGeom = polygonToGeometry(innerPolygon);
  const outerGeom = polygonToGeometry(outerPolygon);

  const query = `
    SELECT 
      CASE 
        WHEN ST_Area(ST_GeomFromText($1, 0)) > 0 
        THEN (ST_Area(ST_Intersection(ST_GeomFromText($1, 0), ST_GeomFromText($2, 0))) / ST_Area(ST_GeomFromText($1, 0))) * 100
        ELSE 0 
      END as containment_percentage
  `;

  const result = await client.query(query, [outerGeom, innerGeom]);
  return parseFloat(result.rows[0].containment_percentage) || 0;
}

/**
 * Find all regions that contain a given point using PostGIS spatial query
 * @param client Database client
 * @param point [x, y] coordinate array
 * @param year Year to query for
 * @returns Array of region IDs that contain the point
 */
export async function findRegionsContainingPointPostGIS(
  client: PoolClient,
  point: [number, number],
  year: number
): Promise<string[]> {
  const pointGeom = pointToGeometry(point);

  const query = `
    SELECT id 
    FROM regions 
    WHERE valid_from <= $1 AND (valid_to IS NULL OR valid_to > $1)
    AND ST_Contains(geom, ST_GeomFromText($2, 0))
    ORDER BY ST_Area(geom) ASC
  `;

  const result = await client.query(query, [year, pointGeom]);
  return result.rows.map(row => row.id);
}

/**
 * Find all locations within a given region using PostGIS spatial query
 * @param client Database client
 * @param regionId ID of the region to search within
 * @param year Year to query for
 * @returns Array of location IDs within the region
 */
export async function findLocationsInRegionPostGIS(
  client: PoolClient,
  regionId: string,
  year: number
): Promise<string[]> {
  const query = `
    SELECT l.id 
    FROM locations l
    JOIN regions r ON ST_Contains(r.geom, l.geom)
    WHERE r.id = $1 
    AND l.valid_from <= $2 AND (l.valid_to IS NULL OR l.valid_to > $2)
    AND r.valid_from <= $2 AND (r.valid_to IS NULL OR r.valid_to > $2)
  `;

  const result = await client.query(query, [regionId, year]);
  return result.rows.map(row => row.id);
}

/**
 * Update the spatial geometry column for a location
 * @param client Database client
 * @param id Location ID
 * @param position [x, y] coordinate array
 * @param year Year for temporal versioning
 */
export async function updateLocationGeometry(
  client: PoolClient,
  id: string,
  position: [number, number],
  year: number
): Promise<void> {
  const geometry = pointToGeometry(position);

  const query = `
    UPDATE locations 
    SET geom = ST_GeomFromText($1, 0)
    WHERE id = $2 AND valid_from <= $3 AND (valid_to IS NULL OR valid_to > $3)
  `;

  await client.query(query, [geometry, id, year]);
}

/**
 * Update the spatial geometry column for a region
 * @param client Database client
 * @param id Region ID
 * @param positions Array of [x, y] coordinate arrays
 * @param year Year for temporal versioning
 */
export async function updateRegionGeometry(
  client: PoolClient,
  id: string,
  positions: [number, number][],
  year: number
): Promise<void> {
  if (positions.length < 3) {
    return;
  }

  const geometry = polygonToGeometry(positions);

  const query = `
    UPDATE regions 
    SET geom = ST_GeomFromText($1, 0)
    WHERE id = $2 AND valid_from <= $3 AND (valid_to IS NULL OR valid_to > $3)
  `;

  await client.query(query, [geometry, id, year]);
}

/**
 * Extract coordinates from PostGIS POINT geometry
 * @param geomText PostGIS geometry text representation
 * @returns [x, y] coordinate array
 */
export function extractPointCoordinates(geomText: string): [number, number] {
  // Parse POINT(x y) format
  const match = geomText.match(/POINT\(([^)]+)\)/);
  if (match) {
    const coords = match[1].trim().split(/\s+/);
    return [parseFloat(coords[0]), parseFloat(coords[1])];
  }
  return [0, 0];
}

/**
 * Extract coordinates from PostGIS POLYGON geometry
 * @param geomText PostGIS geometry text representation
 * @returns Array of [x, y] coordinate arrays
 */
export function extractPolygonCoordinates(
  geomText: string
): [number, number][] {
  // Parse POLYGON((x1 y1, x2 y2, ...)) format
  const match = geomText.match(/POLYGON\(\(([^)]+)\)\)/);
  if (match) {
    const coordPairs = match[1].trim().split(',');
    return coordPairs.map(pair => {
      const coords = pair.trim().split(/\s+/);
      return [parseFloat(coords[0]), parseFloat(coords[1])] as [number, number];
    });
  }
  return [[0, 0]];
}
