import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TimelineEpoch } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);

    const epochIndex = (timeline.epochs || []).findIndex((e: TimelineEpoch) => e.id === params.id);
    if (epochIndex === -1) {
      return NextResponse.json({ error: 'Epoch not found' }, { status: 404 });
    }

    const existingEpoch = timeline.epochs[epochIndex];
    
    // Merge updates with existing epoch data
    const mergedEpoch = {
      ...existingEpoch,
      ...updates,
      // Ensure required fields are present
      name: updates.name || existingEpoch.name,
      startYear: updates.startYear !== undefined ? updates.startYear : existingEpoch.startYear,
      endYear: updates.endYear !== undefined ? updates.endYear : existingEpoch.endYear,
      // Handle optional fields with defaults
      description: updates.description !== undefined ? updates.description : existingEpoch.description,
      color: updates.color || existingEpoch.color || '#3B82F6',
      yearPrefix: updates.yearPrefix !== undefined ? updates.yearPrefix : existingEpoch.yearPrefix,
      yearSuffix: updates.yearSuffix !== undefined ? updates.yearSuffix : existingEpoch.yearSuffix,
      restartAtZero: updates.restartAtZero !== undefined ? !!updates.restartAtZero : existingEpoch.restartAtZero,
      showEndDate: updates.showEndDate !== undefined ? updates.showEndDate : existingEpoch.showEndDate
    };

    // Validate the merged data
    if (!mergedEpoch.name || mergedEpoch.startYear === undefined || mergedEpoch.endYear === undefined) {
      return NextResponse.json({ error: 'Name, startYear, and endYear are required' }, { status: 400 });
    }

    if (mergedEpoch.startYear >= mergedEpoch.endYear) {
      return NextResponse.json({ error: 'Start year must be before end year' }, { status: 400 });
    }

    // Check for overlapping epochs (excluding the current one)
    const overlapping = (timeline.epochs || []).some((epoch: TimelineEpoch, index: number) => 
      index !== epochIndex && (mergedEpoch.startYear <= epoch.endYear && mergedEpoch.endYear >= epoch.startYear)
    );

    if (overlapping) {
      return NextResponse.json({ error: 'Epoch overlaps with existing epoch' }, { status: 400 });
    }

    timeline.epochs[epochIndex] = mergedEpoch;
    
    // Sort epochs by start year
    timeline.epochs.sort((a: TimelineEpoch, b: TimelineEpoch) => a.startYear - b.startYear);

    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));
    return NextResponse.json(mergedEpoch);
  } catch (error) {
    console.error('Error updating epoch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);

    const epochIndex = (timeline.epochs || []).findIndex((e: TimelineEpoch) => e.id === params.id);
    if (epochIndex === -1) {
      return NextResponse.json({ error: 'Epoch not found' }, { status: 404 });
    }

    const deleted = timeline.epochs.splice(epochIndex, 1)[0];
    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting epoch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 