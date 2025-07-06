import type { PoolClient } from 'pg';
import type { Region } from '@/types/regions';

export async function getAllRegions(client: PoolClient, year?: number): Promise<Region[]> {
  if (year !== undefined) {
    const { getElementsAtYear, regionFromRow } = await import('./index');
    return await getElementsAtYear(client, 'regions', year, regionFromRow);
  } else {
    const result = await client.query(`
      SELECT DISTINCT ON (id) * FROM regions 
      WHERE valid_to IS NULL 
      ORDER BY id, valid_from DESC
    `);
    const { regionFromRow } = await import('./index');
    return result.rows.map(regionFromRow);
  }
}

export async function getRegionById(client: PoolClient, id: string, year?: number): Promise<Region | null> {
  if (year !== undefined) {
    const { getElementAtYear, regionFromRow } = await import('./index');
    return await getElementAtYear(client, 'regions', id, year, regionFromRow);
  } else {
    const result = await client.query(
      'SELECT * FROM regions WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
      [id]
    );
    const { regionFromRow } = await import('./index');
    return result.rows.length > 0 ? regionFromRow(result.rows[0]) : null;
  }
}

export async function createRegion(client: PoolClient, input: any): Promise<Region> {
  const result = await client.query(
    `INSERT INTO regions (
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
  const { regionFromRow } = await import('./index');
  return regionFromRow(result.rows[0]);
}

export async function updateRegion(client: PoolClient, input: any): Promise<Region | null> {
  // Find the latest version
  const result = await client.query(
    'SELECT * FROM regions WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
    [input.id]
  );
  if (result.rows.length === 0) {
    throw new Error('Region not found');
  }
  // Update the row (for simplicity, just update the latest row)
  await client.query(
    `UPDATE regions SET
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
    'SELECT * FROM regions WHERE id = $1 AND valid_to IS NULL ORDER BY valid_from DESC LIMIT 1',
    [input.id]
  );
  const { regionFromRow } = await import('./index');
  return updated.rows.length > 0 ? regionFromRow(updated.rows[0]) : null;
}

export async function deleteRegion(client: PoolClient, id: string): Promise<{ success: boolean }> {
  await client.query('DELETE FROM regions WHERE id = $1', [id]);
  return { success: true };
}

export async function getRegionParents(client: PoolClient, id: string, year: number): Promise<Region[]> {
  // Get the target region for the specified year
  const targetRegion = await getRegionById(client, id, year);
  if (!targetRegion) {
    throw new Error('Region not found');
  }

  // Get all regions for the specified year
  const allRegions = await getAllRegions(client, year);
  
  // Import utility functions
  const { isPercentContained } = await import('@/app/utils/containment');
  const { calculatePolygonAreaDirect } = await import('@/app/utils/geometry');
  
  const containingRegions: Region[] = [];

  // Find all regions that contain this region
  for (const potentialParent of allRegions) {
    if (potentialParent.id === targetRegion.id) continue; // Skip self
    
    if (!Array.isArray(potentialParent.position) || potentialParent.position.length < 3) continue;
    if (!Array.isArray(targetRegion.position) || targetRegion.position.length < 3) continue;
    
    // Check if this region is contained within the potential parent
    if (isPercentContained(targetRegion.position as [number, number][], potentialParent.position as [number, number][], 90)) {
      containingRegions.push(potentialParent);
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

export async function getRegionChildren(client: PoolClient, id: string, year: number): Promise<{
  childRegions: Array<{ region: Region; locations: any[] }>;
  locationsInRegion: any[];
}> {
  // Get the target region for the specified year
  const targetRegion = await getRegionById(client, id, year);
  if (!targetRegion) {
    throw new Error('Region not found');
  }

  // Get all regions and locations for the specified year
  const allRegions = await getAllRegions(client, year);
  const { getAllLocations } = await import('./locations');
  const allLocations = await getAllLocations(client, year);
  
  // Import utility functions
  const { isPercentContained } = await import('@/app/utils/containment');
  const { pointInPolygon } = await import('@/app/utils/geometry');

  // Find child regions (fully contained within this region, not self)
  const childRegions = allRegions.filter(r =>
    r.id !== targetRegion.id &&
    Array.isArray(r.position) && r.position.length > 2 &&
    Array.isArray(targetRegion.position) && targetRegion.position.length > 2 &&
    isPercentContained(r.position, targetRegion.position, 90)
  );

  // For each child region, find its locations
  const childRegionLocations: Record<string, any[]> = {};
  childRegions.forEach(child => {
    childRegionLocations[child.id] = allLocations.filter(loc =>
      Array.isArray(child.position) && child.position.length > 2 &&
      Array.isArray(loc.position) && loc.position.length === 2 &&
      pointInPolygon(loc.position as [number, number], child.position as [number, number][])
    );
  });

  // Locations in this region, but not in any child region
  const allLocationsInRegion = allLocations.filter(loc =>
    Array.isArray(targetRegion.position) && targetRegion.position.length > 2 &&
    Array.isArray(loc.position) && loc.position.length === 2 &&
    pointInPolygon(loc.position as [number, number], targetRegion.position as [number, number][])
  );
  
  // Exclude those in any child region
  const childLocIds = new Set(
    Object.values(childRegionLocations).flat().map(l => l.id)
  );
  const locationsInRegion = allLocationsInRegion.filter(loc => !childLocIds.has(loc.id));

  // Build response
  const childRegionsData = childRegions.map(child => ({
    region: child,
    locations: childRegionLocations[child.id] || []
  }));

  return {
    childRegions: childRegionsData,
    locationsInRegion
  };
} 