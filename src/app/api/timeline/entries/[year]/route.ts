import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TimelineData, TimelineEntry, TimelineChanges } from '@/types/timeline';
import { isEmptyChanges } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function PUT(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    const body = await request.json();
    const { age, notes, changes } = body;
    const year = parseInt(params.year);

    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
    }

    // Validate notes structure if provided - now expects an array of notes
    if (notes && (!Array.isArray(notes) || !notes.every(note => 
      typeof note === 'object' && note.title && note.description
    ))) {
      return NextResponse.json({ 
        error: 'Notes must be an array of objects with title and description fields' 
      }, { status: 400 });
    }

    // Read current timeline
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline: TimelineData = JSON.parse(timelineData);

    // Find and update the entry
    const entryIndex = timeline.entries.findIndex(e => e.year === year);
    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Timeline entry not found' }, { status: 404 });
    }

    const updatedEntry: TimelineEntry = {
      year,
      age,
      notes
    };

    // Only include changes if they exist and are not empty
    if (changes && !isEmptyChanges(changes)) {
      updatedEntry.changes = changes;
    }

    timeline.entries[entryIndex] = updatedEntry;

    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error updating timeline entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    const year = parseInt(params.year);

    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
    }

    // Read current timeline
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline: TimelineData = JSON.parse(timelineData);

    // Remove the entry
    const initialLength = timeline.entries.length;
    timeline.entries = timeline.entries.filter(e => e.year !== year);

    if (timeline.entries.length === initialLength) {
      return NextResponse.json({ error: 'Timeline entry not found' }, { status: 404 });
    }

    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting timeline entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 