import { trpc } from '@/trpc';
import type { Region } from '@/types/regions';
import type { Location } from '@/types/locations';
import { useTimelineContext } from '@/app/contexts/TimelineContext';

export function useContainingRegions(element: Location | Region | null) {
  const { currentYear } = useTimelineContext();

  // Use tRPC for location parents
  const locationParents = trpc.locations.getParents.useQuery(
    { id: element?.id || '', year: currentYear },
    { enabled: !!element && element.elementType === 'location' }
  );

  // Use tRPC for region parents
  const regionParents = trpc.regions.getParents.useQuery(
    { id: element?.id || '', year: currentYear },
    { enabled: !!element && element.elementType === 'region' }
  );

  // Return the appropriate query result based on element type
  if (element?.elementType === 'location') {
    return locationParents;
  } else if (element?.elementType === 'region') {
    return regionParents;
  } else {
    // Return a dummy query result for null element
    return {
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: () => Promise.resolve(),
    };
  }
} 