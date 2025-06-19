import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

/**
 * Timeline system types for managing map states across different time periods.
 * This allows users to create and manage different "eras" of their world.
 */

// Extended types for timeline modifications that can include metadata
export interface TimelineLocationModification extends Partial<Location> {
  _originalState?: boolean; // Flag to indicate this is the original state when element was created
}

export interface TimelineRegionModification extends Partial<Region> {
  _originalState?: boolean; // Flag to indicate this is the original state when element was created
}

// Timeline entry structure
export interface TimelineEntry {
  year: number;
  age?: string; // Optional age label
  notes?: TimelineNote[]; // Array of notes for this year
  changes?: TimelineChanges; // Optional - only include if there are actual changes
}

// Epoch structure for time periods
export interface TimelineEpoch {
  id: string;
  name: string;
  description: string;
  startYear: number;
  endYear: number;
  color?: string; // Optional color for visual distinction
  yearPrefix?: string; // Optional prefix for year counter
  yearSuffix?: string; // Optional suffix for year counter
  restartAtZero?: boolean; // If true, year counter restarts at startYear
  showEndDate?: boolean; // If false, only show start date in displays (default: true)
}

// Individual note structure
export interface TimelineNote {
  id: string;
  title: string;
  description: string; // Rich text from TipTap editor
  createdAt: string;
  updatedAt?: string;
}

// Legacy notes structure (for backward compatibility)
export interface TimelineNotes {
  title: string;
  description: string; // Rich text from TipTap editor
}

// Changes structure for each timeline entry
export interface TimelineChanges {
  modified: {
    locations: Record<string, TimelineLocationModification>; // ID -> changed fields
    regions: Record<string, TimelineRegionModification>; // ID -> changed fields
  };
  deleted: {
    locations: string[]; // Array of location IDs
    regions: string[]; // Array of region IDs
  };
}

// Helper function to check if changes are empty
export function isEmptyChanges(changes: TimelineChanges): boolean {
  return (
    Object.keys(changes.modified.locations).length === 0 &&
    Object.keys(changes.modified.regions).length === 0 &&
    changes.deleted.locations.length === 0 &&
    changes.deleted.regions.length === 0
  );
}

// Helper function to create empty changes object
export function createEmptyChanges(): TimelineChanges {
  return {
    modified: { locations: {}, regions: {} },
    deleted: { locations: [], regions: [] }
  };
}

// Timeline data structure
export interface TimelineData {
  entries: TimelineEntry[];
  epochs: TimelineEpoch[];
}

// Timeline metadata (calculated, not stored)
export interface TimelineMetadata {
  yearRange: {
    min: number;
    max: number;
  };
}

// Timeline navigation state
export interface TimelineNavigationState {
  currentYear: number;
  targetYear: number;
  isNavigating: boolean;
  animationProgress: number; // 0-1
}

// Legacy types for backward compatibility (can be removed later)
export interface TimelineEvent {
  id: string;
  year: number;
  timestamp: string;
  eventType: TimelineEventType;
  data: TimelineEventData;
  description?: string;
}

export type TimelineEventType = 
  | 'location-created'
  | 'location-updated'
  | 'location-deleted'
  | 'region-created'
  | 'region-updated'
  | 'region-deleted'
  | 'settings-changed'
  | 'snapshot';

export interface TimelineEventData {
  // For location events
  location?: Location;
  locationId?: string;
  changes?: Partial<Location>; // For storing only changed fields
  
  // For region events
  region?: Region;
  regionId?: string;
  regionChanges?: Partial<Region>; // For storing only changed fields
  
  // For settings events
  settings?: any; // Simplified for now
  
  // For snapshot events (legacy)
  snapshot?: {
    locations: Location[];
    regions: Region[];
    settings: any;
  };
}

// Minimal location type for timeline events
export interface TimelineLocation {
  id: string;
  name: string;
  type: string;
  position: [number, number];
}

// Minimal region type for timeline events
export interface TimelineRegion {
  id: string;
  name: string;
  type: string;
  position: [number, number][];
}

export interface TimelineSnapshot {
  id: string;
  year: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // New: Change-based storage
  changes: TimelineChanges;
  
  // Legacy: Complete map state (for backward compatibility and caching)
  locations?: Location[];
  regions?: Region[];
  settings?: any;
  
  // Optional: track which elements changed from previous snapshot
  changedElements?: {
    locations: string[]; // IDs of changed locations
    regions: string[];   // IDs of changed regions
    settings: boolean;   // Whether settings changed
  };
}

// Legacy interface for backward compatibility
export interface LegacyTimelineSnapshot {
  id: string;
  year: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // Complete map state at this point in time
  locations: Location[];
  regions: Region[];
  settings: any;
  
  // Optional: track which elements changed from previous snapshot
  changedElements?: {
    locations: string[]; // IDs of changed locations
    regions: string[];   // IDs of changed regions
    settings: boolean;   // Whether settings changed
  };
}

export interface TimelineState {
  entries: TimelineEntry[];
  currentYear: number; // Current year being viewed (may not match any snapshot)
}

export type TimelineAction = 
  | { type: 'SET_CURRENT_YEAR'; payload: number }
  | { type: 'ADD_ENTRY'; payload: TimelineEntry }
  | { type: 'UPDATE_ENTRY'; payload: { year: number; entry: TimelineEntry } }
  | { type: 'DELETE_ENTRY'; payload: number }
  | { type: 'LOAD_TIMELINE'; payload: TimelineData };

export interface TimelineContextType {
  state: TimelineState;
  dispatch: React.Dispatch<TimelineAction>;
  navigateToYear: (year: number) => void;
  addEntry: (entry: TimelineEntry) => void;
  updateEntry: (year: number, entry: TimelineEntry) => void;
  deleteEntry: (year: number) => void;
  getEntryForYear: (year: number) => TimelineEntry | null;
  getEntriesForYearRange: (fromYear: number, toYear: number) => TimelineEntry[];
  isYearInTimeline: (year: number) => boolean;
  getYearRange: () => { min: number; max: number };
  settingsChanged: boolean;
} 