import { useState, useCallback, useEffect, useMemo } from 'react';

type Category = 'locations' | 'regions';

interface Types {
  locations: string[];
  regions: string[];
}

export function useTypes() {
  const [types, setTypes] = useState<Types>({ locations: [], regions: [] });
  const [loading, setLoading] = useState(false); // Start with false to prevent initial re-render
  const [error, setError] = useState<string | null>(null);

  // Fetch all types
  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/types');
      if (!res.ok) throw new Error('Failed to fetch types');
      const data = await res.json();
      // Combine state updates to reduce re-renders
      setTypes(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  }, []);

  // Add a new type
  const addType = useCallback(async (category: Category, type: string) => {
    try {
      const res = await fetch('/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, type }),
      });
      if (!res.ok) throw new Error('Failed to add type');
      const data = await res.json();
      setTypes(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      throw err;
    }
  }, []);

  // Delete a type
  const deleteType = useCallback(async (category: Category, type: string) => {
    try {
      const res = await fetch('/api/types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, type }),
      });
      if (!res.ok) throw new Error('Failed to delete type');
      const data = await res.json();
      setTypes(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      throw err;
    }
  }, []);

  // Load types when component mounts
  useEffect(() => {
    fetchTypes();
  }, []); // Remove fetchTypes from dependencies to prevent circular dependency

  // Memoize the return value to prevent unnecessary re-renders
  const result = useMemo(() => ({
    types,
    loading,
    error,
    fetchTypes,
    addType,
    deleteType,
  }), [types, loading, error]); // Remove callback functions from dependencies

  return result;
} 