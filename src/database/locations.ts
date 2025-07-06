import type { PoolClient } from 'pg';
import type { Location } from '@/types/locations';

export async function getAllLocations(client: PoolClient, year?: number): Promise<Location[]> {
  if (year !== undefined) {
    const { getElementsAtYear, locationFromRow } = await import('./index');
    return await getElementsAtYear(client, 'locations', year, locationFromRow);
  } else {
    const result = await client.query(`
      SELECT DISTINCT ON (id) * FROM locations 
      WHERE valid_to IS NULL 
      ORDER BY id, valid_from DESC
    `);
    const { locationFromRow } = await import('./index');
    return result.rows.map(locationFromRow);
  }
}

export async function getLocationById(client: PoolClient, id: string, year?: number): Promise<Location | null> {
  if (year !== undefined) {
    const { getElementAtYear, locationFromRow } = await import('./index');
    return await getElementAtYear(client, 'locations', id, year, locationFromRow);
  } else {
    const result = await client.query(
      'SELECT * FROM locations WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
      [id]
    );
    const { locationFromRow } = await import('./index');
    return result.rows.length > 0 ? locationFromRow(result.rows[0]) : null;
  }
}

export async function createLocation(client: PoolClient, input: any): Promise<Location> {
  const result = await client.query(
    `INSERT INTO locations (
      id, valid_from, valid_to, name, type, description, image, color, icon, icon_size,
      show_label, label, label_position, prominence, fields, position, creation_year, destruction_year
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      input.id, input.creationYear, null, input.name, input.type, input.description,
      input.image, input.color, input.icon, input.iconSize, input.showLabel,
      input.label, input.labelPosition, input.prominence, input.fields, input.position,
      input.creationYear, null
    ]
  );
  const { locationFromRow } = await import('./index');
  return locationFromRow(result.rows[0]);
}

export async function updateLocation(client: PoolClient, input: any): Promise<Location | null> {
  // Find the latest version
  const result = await client.query(
    'SELECT * FROM locations WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
    [input.id]
  );
  if (result.rows.length === 0) {
    throw new Error('Location not found');
  }
  // Update the row (for simplicity, just update the latest row)
  await client.query(
    `UPDATE locations SET
      name = $2, type = $3, description = $4, image = $5, color = $6, icon = $7, icon_size = $8,
      show_label = $9, label = $10, label_position = $11, prominence = $12, fields = $13, position = $14,
      creation_year = $15
    WHERE id = $1 AND valid_to IS NULL`,
    [
      input.id, input.name, input.type, input.description, input.image, input.color,
      input.icon, input.iconSize, input.showLabel, input.label, input.labelPosition,
      input.prominence, input.fields, input.position, input.creationYear
    ]
  );
  // Return updated row
  const updated = await client.query(
    'SELECT * FROM locations WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
    [input.id]
  );
  const { locationFromRow } = await import('./index');
  return updated.rows.length > 0 ? locationFromRow(updated.rows[0]) : null;
}

export async function deleteLocation(client: PoolClient, id: string): Promise<{ success: boolean }> {
  await client.query('DELETE FROM locations WHERE id = $1', [id]);
  return { success: true };
}

export async function getLocationParents(client: PoolClient, id: string, year: number): Promise<any[]> {
  // Get the target location for the specified year
  const targetLocation = await getLocationById(client, id, year);
  if (!targetLocation) {
    throw new Error('Location not found');
  }

  // Get all regions for the specified year
  const { getAllRegions } = await import('./regions');
  const allRegions = await getAllRegions(client, year);
  
  // Import utility functions
  const { pointInPolygon, calculatePolygonAreaDirect } = await import('@/app/utils/geometry');
  
  const containingRegions: any[] = [];

  // Find all regions that contain this location
  for (const region of allRegions) {
    if (!Array.isArray(region.position) || region.position.length < 3) continue;
    
    if (pointInPolygon(targetLocation.position as [number, number], region.position as [number, number][])) {
      containingRegions.push(region);
    }
  }

  // Sort by area (smallest first) for proper hierarchy display
  containingRegions.sort((a, b) => {
    const areaA = calculatePolygonAreaDirect(a.position as [number, number][]);
    const areaB = calculatePolygonAreaDirect(b.position as [number, number][]);
    return areaA - areaB;
  });

  return containingRegions;
} 