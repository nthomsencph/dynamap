"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { useTimeline } from '@/hooks/elements/useTimeline';

interface TimelineContextType {
  currentYear: number;
  entries: any[];
  epochs: any[];
  currentEntry: any;
  currentEpoch: any;
  yearRange: { min: number; max: number };
  loading: boolean;
  error: string | null;
  fetchTimeline: () => Promise<void>;
  navigateToYear: (year: number) => Promise<void>;
  createEntry: (entry: any) => Promise<any>;
  updateEntry: (year: number, updates: any) => Promise<any>;
  deleteEntry: (year: number) => Promise<void>;
  createEpoch: (epoch: any) => Promise<any>;
  updateEpoch: (id: string, updates: any) => Promise<any>;
  deleteEpoch: (id: string) => Promise<void>;
  getEntryForYear: (year: number) => any;
  getEntriesForYearRange: (fromYear: number, toYear: number) => any[];
  isYearInTimeline: (year: number) => boolean;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const timelineData = useTimeline();

  return (
    <TimelineContext.Provider value={timelineData}>
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