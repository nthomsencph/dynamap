import { useState, useEffect, useCallback } from 'react';
import type { Region } from '@/types/regions';

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch regions
  const fetchRegions = useCallback(async () => {
    setLoading(true); // Set loading when we start fetching
    try {
      const response = await fetch('/api/regions');
      if (!response.ok) throw new Error('Failed to fetch regions');
      const data = await response.json();
      
      // Combine state updates to reduce re-renders
      setRegions(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch regions');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, []);

  // Add a new region
  const addRegion = useCallback(async (region: Region) => {
    const response = await fetch('/api/regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(region),
    });

    if (!response.ok) throw new Error('Failed to add region');
    const newRegion = await response.json();
    setRegions(prev => [...prev, newRegion]);
    
    return newRegion;
  }, []);

  // Update an existing region
  const updateRegion = useCallback(async (region: Region) => {
    // Get the previous region state for change tracking
    const previousRegion = regions.find(reg => reg.id === region.id);
    
    try {
      const response = await fetch('/api/regions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(region)
      });

      if (!response.ok) throw new Error('Failed to update region');
      const updatedRegion = await response.json();
      setRegions(prev => prev.map(r => r.id === region.id ? updatedRegion : r));
      
      return updatedRegion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update region');
      throw err;
    }
  }, [regions]);

  // Delete a region
  const deleteRegion = useCallback(async (regionId: string) => {
    // Get the region before deleting it for the timeline event
    const regionToDelete = regions.find(reg => reg.id === regionId);
    
    try {
      const response = await fetch('/api/regions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regionId }),
      });
      if (!response.ok) throw new Error('Failed to delete region');
      setRegions(prev => prev.filter(r => r.id !== regionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete region');
      throw err;
    }
  }, [regions]);

  // Memoize the return value to prevent unnecessary re-renders
  const result = {
    regions,
    loading,
    error,
    fetchRegions,
    addRegion,
    updateRegion,
    deleteRegion,
  };

  return result;
}