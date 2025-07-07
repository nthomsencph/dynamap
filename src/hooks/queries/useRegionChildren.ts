import { trpc } from '@/trpc';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';



interface UseRegionChildrenOptions {
  regionId: string;
  year?: number;
  enabled?: boolean;
}

export function useRegionChildren({ regionId, year, enabled = true }: UseRegionChildrenOptions) {
  return trpc.regions.getChildren.useQuery(
    { id: regionId, year: year || 0 },
    { 
      enabled: enabled && !!regionId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );
} 