import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TimelineData } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function GET() {
  try {
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(timelineData);
    
    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error reading timeline:', error);
    return NextResponse.json({ error: 'Failed to read timeline' }, { status: 500 });
  }
} 