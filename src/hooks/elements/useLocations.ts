import { useState, useEffect, useCallback } from 'react';
import type { Location } from '@/types/locations';
import { useTimelineContext } from '@/contexts/TimelineContext';
import { buildChangeMap, getLocationStateForYear, diffObjects, createTimelineChange } from '@/app/utils/timeline-changes';

export function useLocations(currentYear: number = 0) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { entries, loading: timelineLoading, fetchTimeline } = useTimelineContext();

  // Fetch all locations and reconstruct for current year
  const fetchLocations = useCallback(async () => {
    // Don't fetch if timeline is still loading
    if (timelineLoading) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/locations");
      if (!res.ok) throw new Error("Failed to fetch locations");
      const allLocations: Location[] = await res.json();
      
      // If no timeline entries, just show current state
      if (entries.length === 0) {
        setLocations(allLocations);
        setLoading(false);
        setError(null);
        return;
      }
      
      // Build change map for efficient lookup
      const changeMap = buildChangeMap(entries);
      
      // Reconstruct locations for current year
      const reconstructedLocations = allLocations
        .map(location => getLocationStateForYear(location, currentYear, changeMap))
        .filter((location): location is Location => location !== null);
      
      // If reconstruction resulted in no locations, fall back to current state
      if (reconstructedLocations.length === 0 && allLocations.length > 0) {
        setLocations(allLocations);
      } else {
        setLocations(reconstructedLocations);
      }
      
      setLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, [currentYear, entries, timelineLoading]);

  // Add a new location
  const addLocation = useCallback(async (location: Location) => {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    });
    if (!res.ok) throw new Error("Failed to add location");
    const newLocation = await res.json();
    
    // After creating the location, refetch timeline data to update the context
    await fetchTimeline();
    
    // Refetch locations to include the new one
    await fetchLocations();
    
    return newLocation;
  }, [fetchTimeline]);

  // Update a location
  const updateLocation = useCallback(async (location: Location) => {
    // Get the base location from the database for change tracking
    const baseLocationRes = await fetch("/api/locations");
    const allBaseLocations: Location[] = await baseLocationRes.json();
    const baseLocation = allBaseLocations.find(loc => loc.id === location.id);
    
    if (!baseLocation) {
      console.log('updateLocation: Base location not found');
      return location;
    }
    
    // Get the reconstructed location from the previous year for change tracking
    let previousYearLocation: Location | null = null;
    
    if (currentYear > location.creationYear) {
      // Get the timeline entries to reconstruct the previous year's state
      const timelineRes = await fetch("/api/timeline");
      const timelineData = await timelineRes.json();
      const entries = timelineData.entries || [];
      
      // Build change map and get the reconstructed state from the previous year
      const changeMap = buildChangeMap(entries);
      previousYearLocation = getLocationStateForYear(baseLocation, currentYear - 1, changeMap);
    } else if (currentYear === location.creationYear) {
      // For creation year, use the base location as the previous state
      previousYearLocation = baseLocation;
    }
    
    // Always record changes in timeline, including creation year
    // This ensures the base location remains the original state
    const comparisonLocation = previousYearLocation || baseLocation;
    const changes = diffObjects(comparisonLocation, location);
    
    if (Object.keys(changes).length > 0) {
      console.log('updateLocation: Recording changes for location', location.id, 'in year', currentYear, ':', changes);
      
      const timelineChange = createTimelineChange(
        currentYear,
        location.id,
        'location',
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
      await fetchLocations();
      return location;
    } else {
      console.log('updateLocation: No changes detected for location', location.id, 'in year', currentYear);
    }
    
    // If no changes were recorded, just return the location as-is
    return location;
  }, [currentYear, fetchLocations, fetchTimeline]);

  // Delete a location
  const deleteLocation = useCallback(async (id: string) => {
    // Get the location before deleting it for the timeline event
    const locationToDelete = locations.find(loc => loc.id === id);
    
    const res = await fetch(`/api/locations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete location");
    
    // Record the deletion in timeline
    if (locationToDelete) {
      const timelineChange = createTimelineChange(
        currentYear,
        id,
        'location',
        'deleted',
        {}
      );
      
      await fetch("/api/timeline/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timelineChange),
      });
    }
    
    // After deleting the location, refetch timeline data to update the context
    await fetchTimeline();
    
    // Refetch locations to remove the deleted one
    await fetchLocations();
  }, [locations, currentYear, fetchTimeline]);

  // Delete a location and purge all timeline data
  const deleteLocationFromTimeline = useCallback(async (id: string) => {
    // Delete the location from the database
    const res = await fetch(`/api/locations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete location");
    
    // Purge all timeline data for this location
    await fetch(`/api/timeline/changes/${id}`, {
      method: "DELETE",
    });
    
    // After deleting timeline data, refetch timeline data to update the context
    await fetchTimeline();
    
    // Refetch locations to get updated state
    await fetchLocations();
  }, [fetchTimeline, fetchLocations]);

  // Auto-refresh when year changes or timeline entries change
  useEffect(() => {
    console.log('useLocations: useEffect triggered - currentYear:', currentYear, 'entries length:', entries.length);
    fetchLocations();
  }, [currentYear, entries, timelineLoading]);

  return {
    locations,
    loading,
    error,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    deleteLocationFromTimeline,
  };
} 