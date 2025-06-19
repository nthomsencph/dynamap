import type { TimelineEpoch } from '@/types/timeline';

/**
 * Format epoch date range based on showEndDate setting
 */
export function formatEpochDates(epoch: TimelineEpoch): string {
  if (epoch.showEndDate === false) {
    // Only show start date
    const startYear = epoch.restartAtZero ? 1 : epoch.startYear;
    return `${epoch.yearPrefix || ''}${startYear}${epoch.yearSuffix || ''}`;
  } else {
    // Show both start and end dates (default behavior)
    const startYear = epoch.restartAtZero ? 1 : epoch.startYear;
    const endYear = epoch.restartAtZero ? (epoch.endYear - epoch.startYear + 1) : epoch.endYear;
    return `${epoch.yearPrefix || ''}${startYear} - ${endYear}${epoch.yearSuffix || ''}`;
  }
}

/**
 * Format epoch date range for display in headers and panels
 */
export function formatEpochDateRange(epoch: TimelineEpoch): string {
  if (epoch.showEndDate === false) {
    // Only show start date
    return `${epoch.startYear}`;
  } else {
    // Show both start and end dates (default behavior)
    return `${epoch.startYear} - ${epoch.endYear}`;
  }
} 