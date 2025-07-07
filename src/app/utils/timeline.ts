import type { TimelineEpoch } from '@/types/timeline';

/**
 * Calculate the display year for a given year within an epoch
 */
export function calculateDisplayYear(
  year: number,
  epoch: TimelineEpoch
): number {
  if (epoch.reverseYears) {
    // For reverse years (like BC/AD), count backwards from the epoch end
    // Example: If epoch ends at year -1, then year -1 would be "1 BR", year -10 would be "10 BR"
    return epoch.endYear - year + 1;
  } else if (epoch.restartAtZero) {
    // Normal restart at zero behavior
    return year - epoch.startYear + 1;
  } else {
    // Normal year display
    return year;
  }
}

/**
 * Format epoch date range based on showEndDate setting
 */
export function formatEpochDates(epoch: TimelineEpoch): string {
  if (epoch.showEndDate === false) {
    // Only show start date
    const startYear = calculateDisplayYear(epoch.startYear, epoch);
    return `${epoch.yearPrefix || ''}${startYear}${epoch.yearSuffix || ''}`;
  } else {
    // Show both start and end dates (default behavior)
    const startYear = calculateDisplayYear(epoch.startYear, epoch);
    const endYear = calculateDisplayYear(epoch.endYear, epoch);
    return `${epoch.yearPrefix || ''}${startYear} - ${endYear}${epoch.yearSuffix || ''}`;
  }
}

/**
 * Format epoch date range for display in headers and panels
 */
export function formatEpochDateRange(epoch: TimelineEpoch): string {
  if (epoch.showEndDate === false) {
    // Only show one date - for reverse epochs, show the end year (more meaningful)
    // For normal epochs, show the start year
    const yearToShow = epoch.reverseYears ? epoch.endYear : epoch.startYear;
    const displayYear = calculateDisplayYear(yearToShow, epoch);
    const prefix = epoch.yearPrefix ? `${epoch.yearPrefix} ` : '';
    const suffix = epoch.yearSuffix ? ` ${epoch.yearSuffix}` : '';
    return `${prefix}${displayYear}${suffix}`;
  } else {
    // Show both start and end dates (default behavior)
    const startYear = calculateDisplayYear(epoch.startYear, epoch);
    const endYear = calculateDisplayYear(epoch.endYear, epoch);
    const prefix = epoch.yearPrefix ? `${epoch.yearPrefix} ` : '';
    const suffix = epoch.yearSuffix ? ` ${epoch.yearSuffix}` : '';
    return `${prefix}${startYear} - ${endYear}${suffix}`;
  }
}
