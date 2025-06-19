import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TimelineData } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function POST(request: NextRequest) {
  try {
    const { elementId, elementType } = await request.json();

    if (!elementId || !elementType) {
      return NextResponse.json({ error: 'Missing elementId or elementType' }, { status: 400 });
    }

    // Read current timeline
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline: TimelineData = JSON.parse(timelineData);

    // Purge all timeline data for this element
    timeline.entries = timeline.entries.map(entry => {
      if (entry.changes) {
        // Remove from modified objects
        if (elementType === 'location') {
          delete entry.changes.modified.locations[elementId];
        } else {
          delete entry.changes.modified.regions[elementId];
        }

        // Remove from deleted lists
        if (elementType === 'location') {
          entry.changes.deleted.locations = entry.changes.deleted.locations.filter(id => id !== elementId);
        } else {
          entry.changes.deleted.regions = entry.changes.deleted.regions.filter(id => id !== elementId);
        }
      }
      return entry;
    });

    // Remove entries that have no changes left
    timeline.entries = timeline.entries.filter(entry => {
      if (!entry.changes) return true;
      
      const hasChanges = 
        Object.keys(entry.changes.modified.locations).length > 0 ||
        Object.keys(entry.changes.modified.regions).length > 0 ||
        entry.changes.deleted.locations.length > 0 ||
        entry.changes.deleted.regions.length > 0;
      
      return hasChanges;
    });

    // Save updated timeline
    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error purging timeline data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 