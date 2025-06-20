import { useState, useEffect, useCallback } from 'react';
import type { Region } from '@/types/regions';
import { useTimelineContext } from '@/contexts/TimelineContext';
import { buildChangeMap, getRegionStateForYear, diffObjects, createTimelineChange } from '@/app/utils/timeline-changes';

export function useRegions(currentYear: number = 0) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { entries, loading: timelineLoading, fetchTimeline } = useTimelineContext();

  // Fetch all regions and reconstruct for current year
  const fetchRegions = useCallback(async () => {
    // Don't fetch if timeline is still loading
    if (timelineLoading) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error("Failed to fetch regions");
      const allRegions: Region[] = await res.json();
      
      // If no timeline entries, just show current state
      if (entries.length === 0) {
        setRegions(allRegions);
        setLoading(false);
        setError(null);
        return;
      }
      
      // Build change map for efficient lookup
      const changeMap = buildChangeMap(entries);
      
      // Reconstruct regions for current year
      const reconstructedRegions = allRegions
        .map(region => getRegionStateForYear(region, currentYear, changeMap))
        .filter((region): region is Region => region !== null)
        .filter(region => region.creationYear <= currentYear);
      
      setRegions(reconstructedRegions);
      
      setLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, [currentYear, entries, timelineLoading]);

  // Add a new region
  const addRegion = useCallback(async (region: Region) => {
    const res = await fetch("/api/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(region),
    });
    if (!res.ok) throw new Error("Failed to add region");
    const newRegion = await res.json();
    
    // After creating the region, refetch timeline data to update the context
    await fetchTimeline();
    
    // Refetch regions to include the new one
    await fetchRegions();
    
    return newRegion;
  }, [fetchTimeline]);

  // Update a region
  const updateRegion = useCallback(async (region: Region) => {
    // Get the base region from the database for change tracking
    const baseRegionRes = await fetch("/api/regions");
    const allBaseRegions: Region[] = await baseRegionRes.json();
    const baseRegion = allBaseRegions.find(reg => reg.id === region.id);
    
    if (!baseRegion) {
      console.log('updateRegion: Base region not found');
      return region;
    }
    
    // Get the reconstructed region from the previous year for change tracking
    let previousYearRegion: Region | null = null;
    
    if (currentYear > region.creationYear) {
      // Get the timeline entries to reconstruct the previous year's state
      const timelineRes = await fetch("/api/timeline");
      const timelineData = await timelineRes.json();
      const entries = timelineData.entries || [];
      
      // Build change map and get the reconstructed state from the previous year
      const changeMap = buildChangeMap(entries);
      previousYearRegion = getRegionStateForYear(baseRegion, currentYear - 1, changeMap);
    } else if (currentYear === region.creationYear) {
      // For creation year, use the base region as the previous state
      previousYearRegion = baseRegion;
    }
    
    // Always record changes in timeline, including creation year
    // This ensures the base region remains the original state
    const comparisonRegion = previousYearRegion || baseRegion;
    const changes = diffObjects(comparisonRegion, region);
    
    if (Object.keys(changes).length > 0) {
      console.log('updateRegion: Recording changes for region', region.id, 'in year', currentYear, ':', changes);
      
      const timelineChange = createTimelineChange(
        currentYear,
        region.id,
        'region',
        'updated',
        changes
      );
      
      await fetch("/api/timeline/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timelineChange),
      });
      
      // After recording the change, refetch timeline data to update the context
      await fetchTimeline();
      
      // After recording the change, refetch to get the reconstructed state
      await fetchRegions();
      return region;
    } else {
      console.log('updateRegion: No changes detected for region', region.id, 'in year', currentYear);
    }
    
    // If no changes were recorded, just return the region as-is
    return region;
  }, [currentYear, fetchRegions, fetchTimeline]);

  // Delete a region
  const deleteRegion = useCallback(async (id: string) => {
    // Get the region before deleting it for the timeline event
    const regionToDelete = regions.find(reg => reg.id === id);
    
    if (!regionToDelete) {
      console.error('deleteRegion: Region not found:', id);
      return;
    }
    
    // Record the deletion in timeline (DO NOT delete from database)
    const timelineChange = createTimelineChange(
      currentYear,
      id,
      'region',
      'deleted',
      {}
    );
    
    await fetch("/api/timeline/changes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(timelineChange),
    });
    
    // Purge all timeline changes for this region AFTER the deletion year
    // This removes any changes that happened after the deletion
    await fetch(`/api/timeline/changes/${id}?afterYear=${currentYear}&elementType=region`, {
      method: "DELETE",
    });
    
    // After recording the deletion and purging changes, refetch timeline data
    await fetchTimeline();
    
    // Refetch regions to get the updated state
    await fetchRegions();
  }, [regions, currentYear, fetchTimeline, fetchRegions]);

  // Delete a region and purge all timeline data
  const deleteRegionFromTimeline = useCallback(async (id: string) => {
    // Delete the region from the database
    const res = await fetch(`/api/regions/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete region");
    
    // Purge all timeline data for this region (from all years)
    await fetch(`/api/timeline/changes/${id}?elementType=region`, {
      method: "DELETE",
    });
    
    // After deleting timeline data, refetch timeline data to update the context
    await fetchTimeline();
    
    // Refetch regions to get updated state
    await fetchRegions();
  }, [fetchTimeline, fetchRegions]);

  // Auto-refresh when year changes or timeline entries change
  useEffect(() => {
    fetchRegions();
  }, [currentYear, entries, timelineLoading]);

  return {
    regions,
    loading,
    error,
    fetchRegions,
    addRegion,
    updateRegion,
    deleteRegion,
    deleteRegionFromTimeline,
  };
}