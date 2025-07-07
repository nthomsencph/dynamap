import type { PoolClient } from 'pg';
import type { Region } from '@/types/regions';

export async function getAllRegions(
  client: PoolClient,
  year?: number
): Promise<Region[]> {
  if (year !== undefined) {
    const { getElementsAtYear, regionFromRow } = await import('./index');
    return await getElementsAtYear(client, 'regions', year, regionFromRow);
  } else {
    const result = await client.query(`
      SELECT DISTINCT ON (id) 
        *,
        ST_AsText(geom) as geom_text
      FROM regions 
      WHERE valid_to IS NULL 
      ORDER BY id, valid_from DESC
    `);
    const { regionFromRow } = await import('./index');
    return result.rows.map(regionFromRow);
  }
}

export async function getRegionById(
  client: PoolClient,
  id: string,
  year?: number
): Promise<Region | null> {
  if (year !== undefined) {
    const { getElementAtYear, regionFromRow } = await import('./index');
    return await getElementAtYear(client, 'regions', id, year, regionFromRow);
  } else {
    const result = await client.query(
      `SELECT 
        *,
        ST_AsText(geom) as geom_text
      FROM regions WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1`,
      [id]
    );
    const { regionFromRow } = await import('./index');
    return result.rows.length > 0 ? regionFromRow(result.rows[0]) : null;
  }
}

export async function createRegion(
  client: PoolClient,
  input: any
): Promise<Region> {
  // Import PostGIS utilities
  const { polygonToGeometry, calculatePolygonAreaPostGIS } = await import(
    '@/app/utils/postgis'
  );

  const geometry = polygonToGeometry(input.geom);
  const area = await calculatePolygonAreaPostGIS(client, input.geom);

  const result = await client.query(
    `INSERT INTO regions (
      id, valid_from, valid_to, name, type, description, image, color, icon, icon_size,
      show_label, label, label_position, prominence, fields, geom, show_border, show_highlight,
      area_fade_duration, area, creation_year, destruction_year
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, ST_GeomFromText($16, 0), $17, $18, $19, $20, $21, $22)
    RETURNING 
      *,
      ST_AsText(geom) as geom_text`,
    [
      input.id,
      input.creationYear,
      null,
      input.name,
      input.type,
      input.description,
      input.image,
      input.color,
      input.icon,
      input.iconSize,
      input.showLabel,
      input.label,
      input.labelPosition,
      input.prominence,
      input.fields,
      geometry,
      input.showBorder,
      input.showHighlight,
      input.areaFadeDuration,
      area,
      input.creationYear,
      null,
    ]
  );
  const { regionFromRow } = await import('./index');
  return regionFromRow(result.rows[0]);
}

export async function updateRegion(
  client: PoolClient,
  input: any
): Promise<Region | null> {
  // Import PostGIS utilities
  const { polygonToGeometry, calculatePolygonAreaPostGIS } = await import(
    '@/app/utils/postgis'
  );

  // Find the latest version
  const result = await client.query(
    'SELECT * FROM regions WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
    [input.id]
  );
  if (result.rows.length === 0) {
    throw new Error('Region not found');
  }

  const geometry = polygonToGeometry(input.geom);
  const area = await calculatePolygonAreaPostGIS(client, input.geom);

  // Update the row (for simplicity, just update the latest row)
  await client.query(
    `UPDATE regions SET
      name = $2, type = $3, description = $4, image = $5, color = $6, icon = $7, icon_size = $8,
      show_label = $9, label = $10, label_position = $11, prominence = $12, fields = $13,
      geom = ST_GeomFromText($14, 0), show_border = $15, show_highlight = $16, area_fade_duration = $17, area = $18, creation_year = $19
    WHERE id = $1 AND valid_to IS NULL`,
    [
      input.id,
      input.name,
      input.type,
      input.description,
      input.image,
      input.color,
      input.icon,
      input.iconSize,
      input.showLabel,
      input.label,
      input.labelPosition,
      input.prominence,
      input.fields,
      geometry,
      input.showBorder,
      input.showHighlight,
      input.areaFadeDuration,
      area,
      input.creationYear,
    ]
  );
  // Return updated row
  const updated = await client.query(
    `SELECT 
      *,
      ST_AsText(geom) as geom_text
    FROM regions WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1`,
    [input.id]
  );
  const { regionFromRow } = await import('./index');
  return updated.rows.length > 0 ? regionFromRow(updated.rows[0]) : null;
}

export async function deleteRegion(
  client: PoolClient,
  id: string
): Promise<{ success: boolean }> {
  await client.query('DELETE FROM regions WHERE id = $1', [id]);
  return { success: true };
}

export async function getRegionParents(
  client: PoolClient,
  id: string,
  year: number
): Promise<Region[]> {
  // Get the target region for the specified year
  const targetRegion = await getRegionById(client, id, year);
  if (!targetRegion) {
    throw new Error('Region not found');
  }

  // Use PostGIS spatial query to find containing regions
  const { polygonToGeometry } = await import('@/app/utils/postgis');
  const regionGeom = polygonToGeometry(targetRegion.geom as [number, number][]);

  const query = `
    SELECT r.*, ST_Area(r.geom) as area,
      ST_AsText(r.geom) as geom_text,
      CASE 
        WHEN ST_Contains(r.geom, ST_GeomFromText($3, 0)) THEN 1.0
        ELSE ST_Area(ST_Intersection(r.geom, ST_GeomFromText($3, 0))) / ST_Area(ST_GeomFromText($3, 0))
      END as containment_ratio
    FROM regions r
    WHERE r.valid_from <= $1 AND (r.valid_to IS NULL OR r.valid_to > $1)
    AND r.id != $2
    AND (
      ST_Contains(r.geom, ST_GeomFromText($3, 0))  -- Full containment (100%)
      OR 
      (ST_Area(ST_Intersection(r.geom, ST_GeomFromText($3, 0))) / ST_Area(ST_GeomFromText($3, 0))) >= 0.8  -- 80%+ containment
    )
    ORDER BY containment_ratio DESC, ST_Area(r.geom) ASC
  `;

  const result = await client.query(query, [year, id, regionGeom]);
  const { regionFromRow } = await import('./index');

  return result.rows.map(regionFromRow);
}

export async function getRegionChildren(
  client: PoolClient,
  id: string,
  year: number
): Promise<{
  childRegions: Array<{ region: Region; locations: any[] }>;
  locationsInRegion: any[];
}> {
  // Get the target region for the specified year
  const targetRegion = await getRegionById(client, id, year);
  if (!targetRegion) {
    throw new Error('Region not found');
  }

  // Use PostGIS spatial queries
  const { polygonToGeometry, pointToGeometry } = await import(
    '@/app/utils/postgis'
  );
  const regionGeom = polygonToGeometry(targetRegion.geom as [number, number][]);

  // Find child regions (contained within this region, not self)
  // Use 80% containment threshold with hierarchical priority
  const childRegionsQuery = `
    SELECT r.*, ST_Area(r.geom) as area,
      ST_AsText(r.geom) as geom_text,
      CASE 
        WHEN ST_Contains(ST_GeomFromText($3, 0), r.geom) THEN 1.0
        ELSE ST_Area(ST_Intersection(ST_GeomFromText($3, 0), r.geom)) / ST_Area(r.geom)
      END as containment_ratio
    FROM regions r
    WHERE r.valid_from <= $1 AND (r.valid_to IS NULL OR r.valid_to > $1)
    AND r.id != $2
    AND (
      ST_Contains(ST_GeomFromText($3, 0), r.geom)  -- Full containment (100%)
      OR 
      (ST_Area(ST_Intersection(ST_GeomFromText($3, 0), r.geom)) / ST_Area(r.geom)) >= 0.8  -- 80%+ containment
    )
    ORDER BY containment_ratio DESC, ST_Area(r.geom) ASC
  `;

  const childRegionsResult = await client.query(childRegionsQuery, [
    year,
    id,
    regionGeom,
  ]);
  const { regionFromRow } = await import('./index');
  const childRegions = childRegionsResult.rows.map(regionFromRow);

  // Find locations in this region
  const locationsInRegionQuery = `
    SELECT l.*,
      ST_X(l.geom) as x,
      ST_Y(l.geom) as y
    FROM locations l
    WHERE l.valid_from <= $1 AND (l.valid_to IS NULL OR l.valid_to > $1)
    AND ST_Contains(ST_GeomFromText($2, 0), l.geom)
  `;

  const locationsResult = await client.query(locationsInRegionQuery, [
    year,
    regionGeom,
  ]);
  const { locationFromRow } = await import('./index');
  const allLocationsInRegion = locationsResult.rows.map(locationFromRow);

  // For each child region, find its locations
  const childRegionLocations: Record<string, any[]> = {};
  for (const child of childRegions) {
    const childGeom = polygonToGeometry(child.geom as [number, number][]);
    const childLocationsQuery = `
      SELECT l.*,
        ST_X(l.geom) as x,
        ST_Y(l.geom) as y
      FROM locations l
      WHERE l.valid_from <= $1 AND (l.valid_to IS NULL OR l.valid_to > $1)
      AND ST_Contains(ST_GeomFromText($2, 0), l.geom)
    `;

    const childLocResult = await client.query(childLocationsQuery, [
      year,
      childGeom,
    ]);
    childRegionLocations[child.id] = childLocResult.rows.map(locationFromRow);
  }

  // Exclude locations that are in child regions
  const childLocIds = new Set(
    Object.values(childRegionLocations)
      .flat()
      .map(l => l.id)
  );
  const locationsInRegion = allLocationsInRegion.filter(
    loc => !childLocIds.has(loc.id)
  );

  // Build response
  const childRegionsData = childRegions.map(child => ({
    region: child,
    locations: childRegionLocations[child.id] || [],
  }));

  return {
    childRegions: childRegionsData,
    locationsInRegion,
  };
}
