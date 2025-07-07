import type { PoolClient } from 'pg';
import type { Location } from '@/types/locations';

export async function getAllLocations(
  client: PoolClient,
  year?: number
): Promise<Location[]> {
  if (year !== undefined) {
    const { getElementsAtYear, locationFromRow } = await import('./index');
    return await getElementsAtYear(client, 'locations', year, locationFromRow);
  } else {
    const result = await client.query(`
      SELECT DISTINCT ON (id) 
        *,
        ST_X(geom) as x,
        ST_Y(geom) as y
      FROM locations 
      WHERE valid_to IS NULL 
      ORDER BY id, valid_from DESC
    `);
    const { locationFromRow } = await import('./index');
    return result.rows.map(locationFromRow);
  }
}

export async function getLocationById(
  client: PoolClient,
  id: string,
  year?: number
): Promise<Location | null> {
  if (year !== undefined) {
    const { getElementAtYear, locationFromRow } = await import('./index');
    return await getElementAtYear(
      client,
      'locations',
      id,
      year,
      locationFromRow
    );
  } else {
    const result = await client.query(
      `SELECT 
        *,
        ST_X(geom) as x,
        ST_Y(geom) as y
      FROM locations WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1`,
      [id]
    );
    const { locationFromRow } = await import('./index');
    return result.rows.length > 0 ? locationFromRow(result.rows[0]) : null;
  }
}

export async function createLocation(
  client: PoolClient,
  input: any
): Promise<Location> {
  // Import PostGIS utilities
  const { pointToGeometry } = await import('@/app/utils/postgis');

  // Parse geom from JSON string if needed
  const geomArray =
    typeof input.geom === 'string' ? JSON.parse(input.geom) : input.geom;
  const geometry = pointToGeometry(geomArray);

  const result = await client.query(
    `INSERT INTO locations (
      id, valid_from, valid_to, name, type, description, image, color, icon, icon_size,
      show_label, label, label_position, prominence, fields, geom, creation_year, destruction_year
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, ST_GeomFromText($16, 0), $17, $18)
    RETURNING 
      *,
      ST_X(geom) as x,
      ST_Y(geom) as y`,
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
      input.creationYear,
      null,
    ]
  );
  const { locationFromRow } = await import('./index');
  return locationFromRow(result.rows[0]);
}

export async function updateLocation(
  client: PoolClient,
  input: any
): Promise<Location | null> {
  // Import PostGIS utilities
  const { pointToGeometry } = await import('@/app/utils/postgis');

  // Find the latest version
  const result = await client.query(
    'SELECT * FROM locations WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
    [input.id]
  );
  if (result.rows.length === 0) {
    throw new Error('Location not found');
  }

  // Parse geom from JSON string if needed
  const geomArray =
    typeof input.geom === 'string' ? JSON.parse(input.geom) : input.geom;
  const geometry = pointToGeometry(geomArray);

  // Update the row (for simplicity, just update the latest row)
  await client.query(
    `UPDATE locations SET
      name = $2, type = $3, description = $4, image = $5, color = $6, icon = $7, icon_size = $8,
      show_label = $9, label = $10, label_position = $11, prominence = $12, fields = $13,
      geom = ST_GeomFromText($14, 0), creation_year = $15
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
      input.creationYear,
    ]
  );
  // Return updated row
  const updated = await client.query(
    `SELECT 
      *,
      ST_X(geom) as x,
      ST_Y(geom) as y
    FROM locations WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1`,
    [input.id]
  );
  const { locationFromRow } = await import('./index');
  return updated.rows.length > 0 ? locationFromRow(updated.rows[0]) : null;
}

export async function deleteLocation(
  client: PoolClient,
  id: string
): Promise<{ success: boolean }> {
  await client.query('DELETE FROM locations WHERE id = $1', [id]);
  return { success: true };
}

export async function getLocationParents(
  client: PoolClient,
  id: string,
  year: number
): Promise<any[]> {
  // Get the target location for the specified year
  const targetLocation = await getLocationById(client, id, year);
  if (!targetLocation) {
    throw new Error('Location not found');
  }

  // Use PostGIS spatial query to find containing regions
  const { pointToGeometry } = await import('@/app/utils/postgis');
  const pointGeom = pointToGeometry(targetLocation.geom as [number, number]);

  const query = `
    SELECT r.*, ST_Area(r.geom) as area,
      ST_AsText(r.geom) as geom_text,
      CASE 
        WHEN ST_Contains(r.geom, ST_GeomFromText($2, 0)) THEN 1.0
        ELSE 0.0  -- Points can't be partially contained, so this is just for consistency
      END as containment_ratio
    FROM regions r
    WHERE r.valid_from <= $1 AND (r.valid_to IS NULL OR r.valid_to > $1)
    AND ST_Contains(r.geom, ST_GeomFromText($2, 0))  -- Points must be fully contained
    ORDER BY containment_ratio DESC, ST_Area(r.geom) ASC
  `;

  const result = await client.query(query, [year, pointGeom]);
  const { regionFromRow } = await import('./index');

  return result.rows.map(regionFromRow);
}
