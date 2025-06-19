import type { TimelineEntry, TimelineChanges } from '@/types/timeline';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

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

/**
 * Build a map of changes for efficient lookup during reconstruction
 */
export function buildChangeMap(entries: TimelineEntry[]): ChangeMap {
  const changeMap: ChangeMap = {
    locations: new Map(),
    regions: new Map()
  };

  entries.forEach(entry => {
    if (entry.changes) {
      // Handle modified elements
      Object.entries(entry.changes.modified.locations).forEach(([id, changes]) => {
        if (!changeMap.locations.has(id)) {
          changeMap.locations.set(id, new Map());
        }
        changeMap.locations.get(id)!.set(entry.year, changes);
      });

      Object.entries(entry.changes.modified.regions).forEach(([id, changes]) => {
        if (!changeMap.regions.has(id)) {
          changeMap.regions.set(id, new Map());
        }
        changeMap.regions.get(id)!.set(entry.year, changes);
      });

      // Handle deleted elements
      entry.changes.deleted.locations.forEach(id => {
        if (!changeMap.locations.has(id)) {
          changeMap.locations.set(id, new Map());
        }
        changeMap.locations.get(id)!.set(entry.year, { _deleted: true });
      });

      entry.changes.deleted.regions.forEach(id => {
        if (!changeMap.regions.has(id)) {
          changeMap.regions.set(id, new Map());
        }
        changeMap.regions.get(id)!.set(entry.year, { _deleted: true });
      });
    }
  });

  return changeMap;
}

/**
 * Get the state of a location for a specific year
 */
export function getLocationStateForYear(
  location: Location,
  targetYear: number,
  changeMap: ChangeMap
): Location | null {
  // If the location was created after the target year, it doesn't exist yet
  if (location.creationYear > targetYear) {
    return null;
  }

  const locationChanges = changeMap.locations.get(location.id);
  if (!locationChanges) {
    // No changes recorded, return the base location
    return location;
  }

  // Find all changes from creation year to target year (inclusive)
  // Now that we store changes for creation year, include them
  const applicableChanges = Array.from(locationChanges.entries())
    .filter(([year]) => year >= location.creationYear && year <= targetYear)
    .sort(([a], [b]) => a - b); // Sort by year ascending for proper application order

  if (applicableChanges.length === 0) {
    return location;
  }

  // Check if element was deleted before or at target year
  const latestChange = applicableChanges[applicableChanges.length - 1];
  if (latestChange[1]._deleted) {
    return null; // Element was deleted
  }

  // Start with the base location and apply modifications chronologically
  let reconstructedLocation = { ...location };
  
  applicableChanges.forEach(([year, changes]) => {
    if (!changes._deleted) {
      reconstructedLocation = {
        ...reconstructedLocation,
        ...changes
      };
    }
  });

  return reconstructedLocation;
}

/**
 * Get the state of a region for a specific year
 */
export function getRegionStateForYear(
  region: Region,
  targetYear: number,
  changeMap: ChangeMap
): Region | null {
  // If the region was created after the target year, it doesn't exist yet
  if (region.creationYear > targetYear) {
    return null;
  }

  const regionChanges = changeMap.regions.get(region.id);
  if (!regionChanges) {
    // No changes recorded, return the base region
    return region;
  }

  // Find all changes from creation year to target year (inclusive)
  // Now that we store changes for creation year, include them
  const applicableChanges = Array.from(regionChanges.entries())
    .filter(([year]) => year >= region.creationYear && year <= targetYear)
    .sort(([a], [b]) => a - b); // Sort by year ascending for proper application order

  if (applicableChanges.length === 0) {
    return region;
  }

  // Check if element was deleted before or at target year
  const latestChange = applicableChanges[applicableChanges.length - 1];
  if (latestChange[1]._deleted) {
    return null; // Element was deleted
  }

  // Start with the base region and apply modifications chronologically
  let reconstructedRegion = { ...region };
  
  applicableChanges.forEach(([year, changes]) => {
    if (!changes._deleted) {
      reconstructedRegion = {
        ...reconstructedRegion,
        ...changes
      };
    }
  });

  return reconstructedRegion;
}

/**
 * Calculate the difference between two objects (only changed fields)
 */
export function diffObjects<T extends Record<string, any>>(
  oldObj: T | undefined,
  newObj: T
): Partial<T> {
  if (!oldObj) return newObj;

  const changes: Partial<T> = {};
  let hasChanges = false;

  for (const key in newObj) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    // Deep comparison for objects and arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = newValue;
        hasChanges = true;
      }
    } else if (typeof oldValue === 'object' && oldValue !== null && 
               typeof newValue === 'object' && newValue !== null) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = newValue;
        hasChanges = true;
      }
    } else if (oldValue !== newValue) {
      changes[key] = newValue;
      hasChanges = true;
    }
  }

  return hasChanges ? changes : {};
}

/**
 * Create a timeline change record
 */
export function createTimelineChange(
  year: number,
  elementId: string,
  elementType: 'location' | 'region',
  changeType: 'updated' | 'deleted',
  changes: Partial<Location | Region>
): TimelineChange {
  return {
    year,
    elementId,
    elementType,
    changeType,
    changes
  };
} 