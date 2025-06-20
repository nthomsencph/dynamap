import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TimelineData, TimelineEntry, TimelineChange } from '@/types/timeline';
import { createEmptyChanges, isEmptyChanges } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function POST(request: NextRequest) {
  try {
    const change: TimelineChange = await request.json();
    const { year, elementId, elementType, changeType, changes } = change;

    // Read current timeline
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline: TimelineData = JSON.parse(timelineData);

    // Find or create entry for the year
    let entryIndex = timeline.entries.findIndex(e => e.year === year);
    if (entryIndex === -1) {
      // Create new entry
      const newEntry: TimelineEntry = {
        year,
        changes: createEmptyChanges()
      };
      timeline.entries.push(newEntry);
      entryIndex = timeline.entries.length - 1;
      
      // Sort entries by year
      timeline.entries.sort((a, b) => a.year - b.year);
      entryIndex = timeline.entries.findIndex(e => e.year === year);
    }

    const entry = timeline.entries[entryIndex];
    
    // Initialize changes if not present
    if (!entry.changes) {
      entry.changes = createEmptyChanges();
    }

    // Record the change based on type
    switch (changeType) {
      case 'updated':
        if (elementType === 'location') {
          // Store the modification
          entry.changes.modified.locations[elementId] = changes as any;
        } else {
          // Store the modification
          entry.changes.modified.regions[elementId] = changes as any;
        }
        break;

      case 'deleted':
        if (elementType === 'location') {
          entry.changes.deleted.locations.push(elementId);
          // Remove from modified if present
          delete entry.changes.modified.locations[elementId];
        } else {
          entry.changes.deleted.regions.push(elementId);
          delete entry.changes.modified.regions[elementId];
        }
        break;
    }

    // Remove empty changes to keep the file clean
    if (isEmptyChanges(entry.changes)) {
      delete entry.changes;
    }

    // Save updated timeline
    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error recording timeline change:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 