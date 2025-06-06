import { useState, useEffect } from 'react';
import type { Region } from '@/types/regions';

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch regions
  useEffect(() => {
    async function fetchRegions() {
      try {
        const response = await fetch('/api/regions');
        if (!response.ok) throw new Error('Failed to fetch regions');
        const data = await response.json();
        setRegions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch regions');
      } finally {
        setLoading(false);
      }
    }
    fetchRegions();
  }, []); // No dependencies

  // Add a new region
  async function addRegion(region: Omit<Region, 'id'>) {
    try {
      const response = await fetch('/api/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...region, id: crypto.randomUUID() }),
      });
      if (!response.ok) throw new Error('Failed to add region');
      const newRegion = await response.json();
      setRegions(prev => [...prev, newRegion]);
      return newRegion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add region');
      throw err;
    }
  }

  // Update an existing region
  async function updateRegion(region: Region) {
    try {
      const response = await fetch('/api/regions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(region),
      });
      if (!response.ok) throw new Error('Failed to update region');
      const updatedRegion = await response.json();
      setRegions(prev => prev.map(r => r.id === region.id ? updatedRegion : r));
      return updatedRegion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update region');
      throw err;
    }
  }

  // Delete a region
  async function deleteRegion(regionId: string) {
    try {
      const response = await fetch(`/api/regions/${regionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete region');
      setRegions(prev => prev.filter(r => r.id !== regionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete region');
      throw err;
    }
  }

  return {
    regions,
    loading,
    error,
    addRegion,
    updateRegion,
    deleteRegion,
  };
}