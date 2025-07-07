import type { TimelineEntry, TimelineChange, ChangeMap, TimelineEpoch } from '@/types/timeline';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import { calculateDisplayYear } from '@/app/utils/timeline';

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
 * Get the state of an element (location or region) for a specific year
 */
export function getElementStateForYear<T extends { id: string; creationYear: number }>(
  element: T,
  targetYear: number,
  changeMap: ChangeMap,
  elementType: 'location' | 'region'
): T | null {
  // If the element was created after the target year, it doesn't exist yet
  if (element.creationYear > targetYear) {
    return null;
  }

  const elementChanges = changeMap[elementType === 'location' ? 'locations' : 'regions'].get(element.id);
  if (!elementChanges) {
    // No changes recorded, return the base element
    return element;
  }

  // Find all changes from creation year to target year (inclusive)
  // Now that we store changes for creation year, include them
  const applicableChanges = Array.from(elementChanges.entries())
    .filter(([year]) => year >= element.creationYear && year <= targetYear)
    .sort(([a], [b]) => a - b); // Sort by year ascending for proper application order

  if (applicableChanges.length === 0) {
    return element;
  }

  // Check if element was deleted before or at target year
  const latestChange = applicableChanges[applicableChanges.length - 1];
  if (latestChange[1]._deleted) {
    return null; // Element was deleted
  }

  // Start with the base element and apply modifications chronologically
  let reconstructedElement = { ...element };
  
  applicableChanges.forEach(([year, changes]) => {
    if (!changes._deleted) {
      reconstructedElement = {
        ...reconstructedElement,
        ...changes
      };
    }
  });

  return reconstructedElement;
}

/**
 * Get the state of a location for a specific year
 */
export function getLocationStateForYear(
  location: Location,
  targetYear: number,
  changeMap: ChangeMap
): Location | null {
  return getElementStateForYear(location, targetYear, changeMap, 'location') as Location | null;
}

/**
 * Get the state of a region for a specific year
 */
export function getRegionStateForYear(
  region: Region,
  targetYear: number,
  changeMap: ChangeMap
): Region | null {
  return getElementStateForYear(region, targetYear, changeMap, 'region') as Region | null;
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

/**
 * Check if an element has changes in future years and return those years in display format
 */
export function getFutureChangesForElement(
  elementId: string,
  elementType: 'location' | 'region',
  currentYear: number,
  entries: TimelineEntry[],
  epochs: TimelineEpoch[]
): { hasChanges: boolean; years: string[] } {
  const futureEntries = entries.filter(entry => entry.year > currentYear);
  const yearsWithChanges: number[] = [];

  for (const entry of futureEntries) {
    if (!entry.changes) continue;

    let foundChangeInYear = false;

    // Check modified changes
    if (entry.changes.modified) {
      const elementChanges = entry.changes.modified[`${elementType}s` as keyof typeof entry.changes.modified];
      if (elementChanges && typeof elementChanges === 'object' && elementId in elementChanges) {
        yearsWithChanges.push(entry.year);
        foundChangeInYear = true;
      }
    }

    // Check deleted changes
    if (!foundChangeInYear && entry.changes.deleted) {
      const deletedElements = entry.changes.deleted[`${elementType}s` as keyof typeof entry.changes.deleted];
      if (Array.isArray(deletedElements) && deletedElements.includes(elementId)) {
        yearsWithChanges.push(entry.year);
      }
    }
  }

  if (yearsWithChanges.length === 0) {
    return { hasChanges: false, years: [] };
  }

  // Convert years to display format using epoch information
  const displayYears = yearsWithChanges.map(year => {
    const epoch = epochs.find(e => year >= e.startYear && year <= e.endYear);
    if (epoch) {
      const displayYear = calculateDisplayYear(year, epoch);
      const prefix = epoch.yearPrefix ? `${epoch.yearPrefix} ` : '';
      const suffix = epoch.yearSuffix ? ` ${epoch.yearSuffix}` : '';
      return `${prefix}${displayYear}${suffix}`;
    }
    return `${year}`;
  });

  return { hasChanges: true, years: displayYears };
} 