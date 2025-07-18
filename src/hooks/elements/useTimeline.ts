import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  TimelineEntry,
  TimelineEpoch,
  TimelineNote,
} from '@/types/timeline';
import { trpc } from '@/trpc';

export function useTimeline() {
  const [currentYear, setCurrentYear] = useState(0);

  // Use tRPC queries
  const { isLoading: timelineLoading, error: timelineError } =
    trpc.timeline.getAll.useQuery();
  const {
    data: epochsData,
    isLoading: epochsLoading,
    error: epochsError,
  } = trpc.timeline.getEpochs.useQuery();
  const {
    data: entriesData,
    isLoading: entriesLoading,
    error: entriesError,
  } = trpc.timeline.getEntries.useQuery();

  // Derived state instead of useEffect synchronization
  const loading = timelineLoading || epochsLoading || entriesLoading;
  const error =
    timelineError?.message ||
    epochsError?.message ||
    entriesError?.message ||
    null;

  // Use tRPC mutations
  const createEntryMutation = trpc.timeline.upsertEntry.useMutation();
  const updateEntryMutation = trpc.timeline.upsertEntry.useMutation();
  const deleteEntryMutation = trpc.timeline.deleteEntry.useMutation();
  const createEpochMutation = trpc.timeline.createEpoch.useMutation();
  const updateEpochMutation = trpc.timeline.updateEpoch.useMutation();
  const deleteEpochMutation = trpc.timeline.deleteEpoch.useMutation();

  // Extract data
  const entries = entriesData || [];
  const epochs = epochsData || [];

  // Calculate year range from entries
  const yearRange = useMemo(() => {
    if (entries.length === 0) {
      return { min: 0, max: 0 };
    }
    const years = entries.map(e => e.year);
    return {
      min: Math.min(...years),
      max: Math.max(...years),
    };
  }, [entries]);

  // Get current entry for the current year
  const currentEntry = useMemo(() => {
    return entries.find(e => e.year === currentYear) || null;
  }, [entries, currentYear]);

  // Get current epoch for the current year
  const currentEpoch = useMemo(() => {
    return (
      epochs.find(
        e => currentYear >= e.startYear && currentYear <= e.endYear
      ) || null
    );
  }, [epochs, currentYear]);

  // Create a new timeline entry
  const createEntry = useCallback(
    async (entry: TimelineEntry) => {
      try {
        const newEntry = await createEntryMutation.mutateAsync(entry);
        return newEntry;
      } catch (err) {
        // Error is handled by tRPC mutation state
        throw err;
      }
    },
    [createEntryMutation]
  );

  // Update an existing timeline entry
  const updateEntry = useCallback(
    async (year: number, updates: Partial<TimelineEntry>) => {
      try {
        const currentEntry = entries.find(e => e.year === year);
        if (!currentEntry) {
          throw new Error('Timeline entry not found');
        }

        const updatedEntry = await updateEntryMutation.mutateAsync({
          ...currentEntry,
          ...updates,
        });
        return updatedEntry;
      } catch (err) {
        // Error is handled by tRPC mutation state
        throw err;
      }
    },
    [updateEntryMutation, entries]
  );

  // Delete a timeline entry
  const deleteEntry = useCallback(
    async (year: number) => {
      try {
        await deleteEntryMutation.mutateAsync({ year });

        // If we deleted the current year, move to the closest available year
        if (currentYear === year) {
          const remainingYears = entries
            .filter(e => e.year !== year)
            .map(e => e.year);
          if (remainingYears.length > 0) {
            const closestYear = remainingYears.reduce((prev, curr) =>
              Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
            );
            setCurrentYear(closestYear);
          }
        }
      } catch (err) {
        // Error is handled by tRPC mutation state
        throw err;
      }
    },
    [deleteEntryMutation, currentYear, entries]
  );

  // Navigate to a specific year
  const navigateToYear = useCallback(async (year: number) => {
    setCurrentYear(year);
  }, []);

  // Get entry for a specific year
  const getEntryForYear = useCallback(
    (year: number) => {
      return entries.find(e => e.year === year) || null;
    },
    [entries]
  );

  // Get entries for a year range
  const getEntriesForYearRange = useCallback(
    (fromYear: number, toYear: number) => {
      return entries.filter(e => e.year >= fromYear && e.year <= toYear);
    },
    [entries]
  );

  // Check if a year has an entry
  const isYearInTimeline = useCallback(
    (year: number) => {
      return entries.some(e => e.year === year);
    },
    [entries]
  );

  // Legacy compatibility functions (for existing components)
  const snapshots = useMemo(() => entries, [entries]);
  const currentSnapshot = currentEntry;
  const metadata = useMemo(
    () => ({
      totalSnapshots: entries.length,
      yearRange,
    }),
    [entries.length, yearRange]
  );

  // Create snapshot (legacy compatibility)
  const createSnapshot = useCallback(
    async (year: number, name: string, description?: string) => {
      const note: TimelineNote = {
        id: crypto.randomUUID(),
        title: name,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const entry: TimelineEntry = {
        year,
        notes: [note],
      };
      return createEntry(entry);
    },
    [createEntry]
  );

  // Create a new epoch
  const createEpoch = useCallback(
    async (epoch: Omit<TimelineEpoch, 'id'>) => {
      try {
        const newEpoch = await createEpochMutation.mutateAsync(epoch);
        return newEpoch;
      } catch (err) {
        // Error is handled by tRPC mutation state
        throw err;
      }
    },
    [createEpochMutation]
  );

  // Update an existing epoch
  const updateEpoch = useCallback(
    async (id: string, updates: Partial<TimelineEpoch>) => {
      try {
        const updatedEpoch = await updateEpochMutation.mutateAsync({
          id,
          updates,
        });
        return updatedEpoch;
      } catch (err) {
        // Error is handled by tRPC mutation state
        throw err;
      }
    },
    [updateEpochMutation]
  );

  // Delete an epoch
  const deleteEpoch = useCallback(
    async (id: string) => {
      try {
        await deleteEpochMutation.mutateAsync({ id });
      } catch (err) {
        // Error is handled by tRPC mutation state
        throw err;
      }
    },
    [deleteEpochMutation]
  );

  // Fetch timeline data (legacy compatibility)
  const fetchTimeline = useCallback(async () => {
    // This is now handled by tRPC queries automatically
    // The data will be refetched when the queries are invalidated
  }, []);

  // Set initial current year when data loads
  useEffect(() => {
    if (entries.length > 0 && currentYear === 0) {
      // Start with year 0 by default, not the earliest timeline entry
      // This ensures elements created in year 0 are visible
      setCurrentYear(0);
    }
  }, [entries, currentYear]);

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
    createSnapshot,
  };
}
