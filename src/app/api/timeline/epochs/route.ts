import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { TimelineEpoch } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function GET() {
  try {
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);
    
    return NextResponse.json(timeline.epochs || []);
  } catch (error) {
    console.error('Error reading epochs:', error);
    return NextResponse.json({ error: 'Failed to read epochs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, startYear, endYear, color, yearPrefix, yearSuffix, restartAtZero, showEndDate } = body;
    
    if (!name || startYear === undefined || endYear === undefined) {
      return NextResponse.json({ error: 'Name, startYear, and endYear are required' }, { status: 400 });
    }

    if (startYear >= endYear) {
      return NextResponse.json({ error: 'Start year must be before end year' }, { status: 400 });
    }

    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);

    // Check for overlapping epochs
    const overlapping = (timeline.epochs || []).some((epoch: TimelineEpoch) => 
      (startYear <= epoch.endYear && endYear >= epoch.startYear)
    );

    if (overlapping) {
      return NextResponse.json({ error: 'Epoch overlaps with existing epoch' }, { status: 400 });
    }

    const newEpoch: TimelineEpoch = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      startYear,
      endYear,
      color: color || '#3B82F6',
      yearPrefix: yearPrefix || '',
      yearSuffix: yearSuffix || '',
      restartAtZero: !!restartAtZero,
      showEndDate: showEndDate !== false // Default to true if not explicitly set to false
    };

    timeline.epochs = timeline.epochs || [];
    timeline.epochs.push(newEpoch);
    
    // Sort epochs by start year
    timeline.epochs.sort((a: TimelineEpoch, b: TimelineEpoch) => a.startYear - b.startYear);

    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));
    return NextResponse.json(newEpoch);
  } catch (error) {
    console.error('Error creating epoch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 