"use client";
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { trpc } from '@/trpc';
import type { TimelineEntry, TimelineEpoch } from '@/types/timeline';

interface TimelineContextType {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  entries: TimelineEntry[];
  epochs: TimelineEpoch[];
  currentEntry: TimelineEntry | undefined;
  currentEpoch: TimelineEpoch | undefined;
  yearRange: { min: number; max: number };
  loading: boolean;
  error: string | null;
  navigateToYear: (year: number) => void;
  createEntry: (entry: TimelineEntry) => Promise<any>;
  updateEntry: (year: number, updates: any) => Promise<any>;
  deleteEntry: (year: number) => Promise<void>;
  createEpoch: (epoch: Omit<TimelineEpoch, 'id'>) => Promise<any>;
  updateEpoch: (id: string, updates: any) => Promise<any>;
  deleteEpoch: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getEntryForYear: (year: number) => TimelineEntry | undefined;
  getEntriesForYearRange: (fromYear: number, toYear: number) => TimelineEntry[];
  isYearInTimeline: (year: number) => boolean;
  fetchTimeline: () => Promise<void>;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState(0);
  
  // Use tRPC queries
  const { data: timelineData, isLoading, error } = trpc.timeline.getAll.useQuery();
  const utils = trpc.useUtils();

  const entries = timelineData?.entries || [];
  const epochs = timelineData?.epochs || [];

  // Calculate year range
  const yearRange = React.useMemo(() => {
    if (entries.length === 0) return { min: 0, max: 0 };
    
    const years = entries.map(entry => entry.year);
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  }, [entries]);

  // Get current entry and epoch
  const currentEntry = React.useMemo(() => {
    return entries.find(entry => entry.year === currentYear);
  }, [entries, currentYear]);

  const currentEpoch = React.useMemo(() => {
    return epochs.find(epoch => 
      currentYear >= epoch.startYear && currentYear <= epoch.endYear
    );
  }, [epochs, currentYear]);

  // Helper functions
  const navigateToYear = (year: number) => {
    setCurrentYear(year);
  };

  const getEntryForYear = (year: number) => {
    return entries.find(entry => entry.year === year);
  };

  const getEntriesForYearRange = (fromYear: number, toYear: number) => {
    return entries.filter(entry => entry.year >= fromYear && entry.year <= toYear);
  };

  const isYearInTimeline = (year: number) => {
    return entries.some(entry => entry.year === year);
  };

  // Timeline mutations using tRPC
  const createEntryMutation = trpc.timeline.upsertEntry.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });

  const updateEntryMutation = trpc.timeline.upsertEntry.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });

  const deleteEntryMutation = trpc.timeline.deleteEntry.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });

  const createEpochMutation = trpc.timeline.createEpoch.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });

  const updateEpochMutation = trpc.timeline.updateEpoch.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });

  const deleteEpochMutation = trpc.timeline.deleteEpoch.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });

  const deleteNoteMutation = trpc.timeline.deleteNote.useMutation({
    onSuccess: () => {
      utils.timeline.getAll.invalidate();
    },
  });

  // Mutation handlers
  const createEntry = async (entry: TimelineEntry) => {
    return createEntryMutation.mutateAsync(entry);
  };

  const updateEntry = async (year: number, updates: any) => {
    const currentEntry = entries.find(e => e.year === year);
    if (!currentEntry) {
      throw new Error('Timeline entry not found');
    }
    
    return updateEntryMutation.mutateAsync({
      ...currentEntry,
      ...updates,
    });
  };

  const deleteEntry = async (year: number) => {
    await deleteEntryMutation.mutateAsync({ year });
  };

  const createEpoch = async (epoch: Omit<TimelineEpoch, 'id'>) => {
    return createEpochMutation.mutateAsync(epoch);
  };

  const updateEpoch = async (id: string, updates: any) => {
    return updateEpochMutation.mutateAsync({ id, updates });
  };

  const deleteEpoch = async (id: string) => {
    await deleteEpochMutation.mutateAsync({ id });
  };

  const deleteNote = async (id: string) => {
    await deleteNoteMutation.mutateAsync({ id });
  };

  const fetchTimeline = async () => {
    utils.timeline.getAll.invalidate();
  };

  const value: TimelineContextType = {
    currentYear,
    setCurrentYear,
    entries,
    epochs,
    currentEntry,
    currentEpoch,
    yearRange,
    loading: isLoading,
    error: error?.message || null,
    navigateToYear,
    createEntry,
    updateEntry,
    deleteEntry,
    createEpoch,
    updateEpoch,
    deleteEpoch,
    deleteNote,
    getEntryForYear,
    getEntriesForYearRange,
    isYearInTimeline,
    fetchTimeline,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimelineContext() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimelineContext must be used within a TimelineProvider');
  }
  return context;
} 