import { trpc } from '@/trpc';

interface SearchResult {
  id: string;
  name: string;
  type: string;
  elementType: 'location' | 'region';
  icon: string;
  color: string;
  relevance: number;
  description?: string;
  position: [number, number] | [number, number][];
  prominence: { lower: number; upper: number };
  fields: Record<string, any>;
  creationYear: number;
  showBorder?: boolean;
  showHighlight?: boolean;
}

// Type guard to check if a SearchResult is a Location
function isLocation(result: SearchResult): result is SearchResult & { elementType: 'location'; position: [number, number] } {
  return result.elementType === 'location';
}

// Type guard to check if a SearchResult is a Region
function isRegion(result: SearchResult): result is SearchResult & { elementType: 'region'; position: [number, number][] } {
  return result.elementType === 'region';
}

interface UseSearchOptions {
  query: string;
  year?: number;
  limit?: number;
  enabled?: boolean;
}

export function useSearch({ query, year, limit = 50, enabled = true }: UseSearchOptions) {
  return trpc.search.search.useQuery(
    {
      query,
      year,
      limit,
    },
    {
      enabled: enabled && (query.trim().length > 0 || year !== undefined),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );
} 