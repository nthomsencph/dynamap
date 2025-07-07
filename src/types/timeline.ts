import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

/**
 * Timeline system types for managing map states across different time periods.
 * This allows users to create and manage different "eras" of their world.
 */

// Timeline change tracking types
export interface TimelineChange {
  year: number;
  elementId: string;
  elementType: 'location' | 'region';
  changeType: 'updated' | 'deleted';
  changes: Partial<Location | Region>;
}

export interface ElementChange {
  _deleted?: boolean;
  [key: string]: any;
}

export interface ChangeMap {
  locations: Map<string, Map<number, ElementChange>>;
  regions: Map<string, Map<number, ElementChange>>;
}

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
  reverseYears?: boolean; // If true, years count backwards (like BC/AD system)
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
    deleted: { locations: [], regions: [] },
  };
}

// Timeline data structure
export interface TimelineData {
  entries: TimelineEntry[];
  epochs: TimelineEpoch[];
}
