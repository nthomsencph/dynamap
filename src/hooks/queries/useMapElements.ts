import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { trpc } from '@/trpc';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import type { TimelineEntry } from '@/types/timeline';
import { buildChangeMap, getLocationStateForYear, getRegionStateForYear } from '@/app/utils/timeline-changes';

// Query keys
export const mapElementKeys = {
  all: ['mapElements'] as const,
  locations: () => [...mapElementKeys.all, 'locations'] as const,
  regions: () => [...mapElementKeys.all, 'regions'] as const,
  timeline: () => [...mapElementKeys.all, 'timeline'] as const,
  byYear: (year: number) => [...mapElementKeys.all, 'byYear', year] as const,
};

// Hooks
export const useTimeline = () => {
  return trpc.timeline.getAll.useQuery();
};

export const useMapElementsByYear = (currentYear: number) => {
  const { data: timelineData } = useTimeline();
  
  // Use tRPC for locations and regions
  const { data: allLocations } = trpc.locations.getAll.useQuery();
  const { data: allRegions } = trpc.regions.getAll.useQuery();

  // Reconstruct elements for current year
  const locations = useMemo(() => {
    if (!allLocations || !timelineData?.entries) return allLocations || [];
    
    const changeMap = buildChangeMap(timelineData.entries);
    return allLocations
      .map(location => getLocationStateForYear(location, currentYear, changeMap))
      .filter((location): location is Location => location !== null)
      .filter(location => location.creationYear <= currentYear);
  }, [allLocations, timelineData?.entries, currentYear]);

  const regions = useMemo(() => {
    if (!allRegions || !timelineData?.entries) return allRegions || [];
    
    const changeMap = buildChangeMap(timelineData.entries);
    return allRegions
      .map(region => getRegionStateForYear(region, currentYear, changeMap))
      .filter((region): region is Region => region !== null)
      .filter(region => region.creationYear <= currentYear);
  }, [allRegions, timelineData?.entries, currentYear]);

  return {
    locations,
    regions,
    isLoading: false, // We'll handle loading states separately if needed
  };
};

// Location mutations using tRPC
export const useCreateLocation = () => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  
  return trpc.locations.create.useMutation({
    onSuccess: () => {
      utils.locations.getAll.invalidate();
      // Invalidate timeline queries since locations affect timeline
      queryClient.invalidateQueries({ queryKey: mapElementKeys.timeline() });
    },
  });
};

export const useUpdateLocation = () => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  
  return trpc.locations.update.useMutation({
    onSuccess: () => {
      utils.locations.getAll.invalidate();
      // Invalidate timeline queries since locations affect timeline
      queryClient.invalidateQueries({ queryKey: mapElementKeys.timeline() });
    },
  });
};

export const useDeleteLocation = () => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  
  return trpc.locations.delete.useMutation({
    onSuccess: () => {
      utils.locations.getAll.invalidate();
      // Invalidate timeline queries since locations affect timeline
      queryClient.invalidateQueries({ queryKey: mapElementKeys.timeline() });
    },
  });
};

// Region mutations using tRPC
export const useCreateRegion = () => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  
  return trpc.regions.create.useMutation({
    onSuccess: () => {
      utils.regions.getAll.invalidate();
      // Invalidate timeline queries since regions affect timeline
      queryClient.invalidateQueries({ queryKey: mapElementKeys.timeline() });
    },
  });
};

export const useUpdateRegion = () => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  
  return trpc.regions.update.useMutation({
    onSuccess: () => {
      utils.regions.getAll.invalidate();
      // Invalidate timeline queries since regions affect timeline
      queryClient.invalidateQueries({ queryKey: mapElementKeys.timeline() });
    },
  });
};

export const useDeleteRegion = () => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  
  return trpc.regions.delete.useMutation({
    onSuccess: () => {
      utils.regions.getAll.invalidate();
      // Invalidate timeline queries since regions affect timeline
      queryClient.invalidateQueries({ queryKey: mapElementKeys.timeline() });
    },
  });
};

// Timeline mutations using tRPC
export const useCreateTimelineChange = () => {
  const utils = trpc.useUtils();
  
  return trpc.timeline.recordChange.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });
};

export const useDeleteTimelineChanges = () => {
  const utils = trpc.useUtils();
  
  return trpc.timeline.deleteChange.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });
}; 