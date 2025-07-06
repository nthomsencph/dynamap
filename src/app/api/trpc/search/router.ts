import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getDatabase, getElementsAtYear, locationFromRow, regionFromRow } from '@/database';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

// Search result extends the base types with relevance scoring
export interface SearchResult extends Omit<Location | Region, 'elementType'> {
  elementType: 'location' | 'region';
  relevance: number;
}

export const searchRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        year: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      
      try {
        const searchQuery = input.query?.trim() || '';
        const year = input.year || 2024;
        const limit = input.limit;
        
        // If no query, return all elements for the year using existing functions
        if (!searchQuery) {
          const [locations, regions] = await Promise.all([
            getElementsAtYear(client, 'locations', year, locationFromRow),
            getElementsAtYear(client, 'regions', year, regionFromRow)
          ]);
          
          // Convert to SearchResult format using existing types
          const allResults: SearchResult[] = [
            ...locations.map(location => ({
              ...location,
              relevance: 0
            })),
            ...regions.map(region => ({
              ...region,
              relevance: 0
            }))
          ];
          
          return allResults.slice(0, limit);
        }
        
        // Use PostgreSQL's trigram similarity for fuzzy search
        const locationsQuery = `
          SELECT *, 
            GREATEST(
              similarity(COALESCE(name, ''), $2),
              similarity(COALESCE(type, ''), $2),
              similarity(COALESCE(description, ''), $2)
            ) as relevance
          FROM locations
          WHERE valid_from <= $1 AND (valid_to IS NULL OR valid_to > $1)
          AND (
            COALESCE(name, '') % $2 OR
            COALESCE(type, '') % $2 OR
            COALESCE(description, '') % $2
          )
          ORDER BY relevance DESC, name ASC
          LIMIT $3
        `;
        
        const regionsQuery = `
          SELECT *, 
            GREATEST(
              similarity(COALESCE(name, ''), $2),
              similarity(COALESCE(type, ''), $2),
              similarity(COALESCE(description, ''), $2)
            ) as relevance
          FROM regions
          WHERE valid_from <= $1 AND (valid_to IS NULL OR valid_to > $1)
          AND (
            COALESCE(name, '') % $2 OR
            COALESCE(type, '') % $2 OR
            COALESCE(description, '') % $2
          )
          ORDER BY relevance DESC, name ASC
          LIMIT $3
        `;
        
        const [locationsResult, regionsResult] = await Promise.all([
          client.query(locationsQuery, [year, searchQuery, limit]),
          client.query(regionsQuery, [year, searchQuery, limit])
        ]);
        
        // Convert results using existing functions
        const locations = locationsResult.rows
          .map(locationFromRow)
          .map(location => ({
            ...location,
            relevance: Math.round(locationsResult.rows.find(row => row.id === location.id)?.relevance * 100)
          }));
        
        const regions = regionsResult.rows
          .map(regionFromRow)
          .map(region => ({
            ...region,
            relevance: Math.round(regionsResult.rows.find(row => row.id === region.id)?.relevance * 100)
          }));
        
        // Combine results using existing types
        const allResults: SearchResult[] = [
          ...locations,
          ...regions
        ];
        
        // Sort by relevance (highest first), then by name
        allResults.sort((a, b) => {
          if (b.relevance !== a.relevance) {
            return b.relevance - a.relevance;
          }
          return (a.name || '').localeCompare(b.name || '');
        });
        
        // Apply limit
        return allResults.slice(0, limit);
      } finally {
        client.release();
      }
    }),
}); 