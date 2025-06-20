import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TimelineData, TimelineEntry, TimelineChanges, TimelineEpoch, TimelineNote } from '@/types/timeline';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

export function useTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [epochs, setEpochs] = useState<TimelineEpoch[]>([]);
  const [currentYear, setCurrentYear] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate year range from entries
  const yearRange = useMemo(() => {
    if (entries.length === 0) {
      return { min: 0, max: 0 };
    }
    const years = entries.map(e => e.year);
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  }, [entries]);

  // Get current entry for the current year
  const currentEntry = useMemo(() => {
    return entries.find(e => e.year === currentYear) || null;
  }, [entries, currentYear]);

  // Fetch timeline data
  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/timeline');
      if (!response.ok) throw new Error('Failed to fetch timeline');
      const data: TimelineData = await response.json();
      
      setEntries(data.entries || []);
      setEpochs(data.epochs || []);
      
      // Only set current year if it hasn't been set yet (avoid overriding user navigation)
      if (data.entries && data.entries.length > 0) {
        setCurrentYear(prevYear => {
          if (prevYear === 0) {
            // Start with year 0 by default, not the earliest timeline entry
            // This ensures elements created in year 0 are visible
            return 0;
          }
          return prevYear;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  }, []); // Remove currentYear dependency

  // Create a new timeline entry
  const createEntry = useCallback(async (entry: TimelineEntry) => {
    try {
      const response = await fetch('/api/timeline/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create timeline entry');
      }

      const newEntry = await response.json();
      setEntries(prev => [...prev, newEntry].sort((a, b) => a.year - b.year));
      return newEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create timeline entry');
      throw err;
    }
  }, []);

  // Update an existing timeline entry
  const updateEntry = useCallback(async (year: number, updates: Partial<TimelineEntry>) => {
    try {
      const response = await fetch(`/api/timeline/entries/${year}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update timeline entry');
      }

      const updatedEntry = await response.json();
      setEntries(prev => prev.map(e => e.year === year ? updatedEntry : e));
      return updatedEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update timeline entry');
      throw err;
    }
  }, []);

  // Delete a timeline entry
  const deleteEntry = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/timeline/entries/${year}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete timeline entry');
      }

      setEntries(prev => prev.filter(e => e.year !== year));
      
      // If we deleted the current year, move to the closest available year
      if (currentYear === year) {
        const remainingYears = entries.filter(e => e.year !== year).map(e => e.year);
        if (remainingYears.length > 0) {
          const closestYear = remainingYears.reduce((prev, curr) => 
            Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
          );
          setCurrentYear(closestYear);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete timeline entry');
      throw err;
    }
  }, [currentYear, entries]);

  // Navigate to a specific year
  const navigateToYear = useCallback(async (year: number) => {
    console.log('useTimeline: navigateToYear called with year:', year, 'current year was:', currentYear);
    setCurrentYear(year);
    console.log('useTimeline: setCurrentYear called, new year should be:', year);
  }, [currentYear]);

  // Get entry for a specific year
  const getEntryForYear = useCallback((year: number) => {
    return entries.find(e => e.year === year) || null;
  }, [entries]);

  // Get entries for a year range
  const getEntriesForYearRange = useCallback((fromYear: number, toYear: number) => {
    return entries.filter(e => e.year >= fromYear && e.year <= toYear);
  }, [entries]);

  // Check if a year has an entry
  const isYearInTimeline = useCallback((year: number) => {
    return entries.some(e => e.year === year);
  }, [entries]);

  // Legacy compatibility functions (for existing components)
  const snapshots = useMemo(() => entries, [entries]);
  const currentSnapshot = currentEntry;
  const metadata = useMemo(() => ({
    totalSnapshots: entries.length,
    yearRange
  }), [entries.length, yearRange]);

  // Create snapshot (legacy compatibility)
  const createSnapshot = useCallback(async (year: number, name: string, description?: string) => {
    const note: TimelineNote = {
      id: crypto.randomUUID(),
      title: name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const entry: TimelineEntry = {
      year,
      notes: [note]
    };
    return createEntry(entry);
  }, [createEntry]);

  // Create a new epoch
  const createEpoch = useCallback(async (epoch: Omit<TimelineEpoch, 'id'>) => {
    try {
      const response = await fetch('/api/timeline/epochs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(epoch)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create epoch');
      }

      const newEpoch = await response.json();
      setEpochs(prev => [...prev, newEpoch].sort((a, b) => a.startYear - b.startYear));
      return newEpoch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create epoch');
      throw err;
    }
  }, []);

  // Update an existing epoch
  const updateEpoch = useCallback(async (id: string, updates: Partial<TimelineEpoch>) => {
    try {
      const response = await fetch(`/api/timeline/epochs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update epoch');
      }

      const updatedEpoch = await response.json();
      setEpochs(prev => prev.map(e => e.id === id ? updatedEpoch : e).sort((a, b) => a.startYear - b.startYear));
      return updatedEpoch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update epoch');
      throw err;
    }
  }, []);

  // Delete an epoch
  const deleteEpoch = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/timeline/epochs/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete epoch');
      }

      setEpochs(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete epoch');
      throw err;
    }
  }, []);

  // Get current epoch for the current year
  const currentEpoch = useMemo(() => {
    return epochs.find(e => currentYear >= e.startYear && currentYear <= e.endYear) || null;
  }, [epochs, currentYear]);

  useEffect(() => {
    fetchTimeline();
  }, []); // Remove currentYear from dependencies to prevent infinite loops

  // Debug: Log when currentYear changes
  useEffect(() => {
    console.log('useTimeline: currentYear changed to:', currentYear);
  }, [currentYear]);

  return {
    // New structure
    entries,
    epochs,
    currentYear,
    currentEntry,
    currentEpoch,
    yearRange,
    loading,
    error,
    
    // Functions
    fetchTimeline,
    createEntry,
    updateEntry,
    deleteEntry,
    navigateToYear,
    getEntryForYear,
    getEntriesForYearRange,
    isYearInTimeline,
    
    // Epoch functions
    createEpoch,
    updateEpoch,
    deleteEpoch,
    
    // Legacy compatibility
    snapshots,
    currentSnapshot,
    metadata,
    createSnapshot
  };
} 