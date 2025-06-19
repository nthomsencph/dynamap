import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TimelineData, TimelineEntry, TimelineChanges } from '@/types/timeline';
import { isEmptyChanges } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function GET() {
  try {
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);
    
    return NextResponse.json(timeline.entries || []);
  } catch (error) {
    console.error('Error reading timeline entries:', error);
    return NextResponse.json({ error: 'Failed to read timeline entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, age, notes, changes } = body;

    if (year === undefined) {
      return NextResponse.json({ error: 'Year is required' }, { status: 400 });
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

    // Create new entry - only include changes if they exist and are not empty
    const entry: TimelineEntry = {
      year,
      age,
      notes
    };

    // Only add changes if they exist and are not empty
    if (changes && !isEmptyChanges(changes)) {
      entry.changes = changes;
    }

    // Add entry to timeline
    timeline.entries.push(entry);
    
    // Sort entries by year
    timeline.entries.sort((a, b) => a.year - b.year);

    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error creating timeline entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 