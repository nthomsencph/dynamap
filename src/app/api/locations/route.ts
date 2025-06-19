import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Location } from '@/types/locations';
import { buildChangeMap, getLocationStateForYear } from '@/app/utils/timeline-changes';
import type { TimelineData } from '@/types/timeline';

const locationsPath = path.join(process.cwd(), 'public', 'locations.json');
const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    
    const data = await fs.readFile(locationsPath, 'utf-8');
    const allLocations: Location[] = JSON.parse(data);
    
    // If no year parameter, return all locations as-is
    if (!yearParam) {
      return NextResponse.json(allLocations);
    }
    
    const targetYear = parseInt(yearParam);
    if (isNaN(targetYear)) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
    }
    
    // Read timeline data for reconstruction
    let timelineData: TimelineData;
    try {
      const timelineFile = await fs.readFile(TIMELINE_FILE, 'utf-8');
      timelineData = JSON.parse(timelineFile);
    } catch (err) {
      // If no timeline file, return all locations as-is
      return NextResponse.json(allLocations);
    }
    
    // If no timeline entries, return all locations as-is
    if (!timelineData.entries || timelineData.entries.length === 0) {
      return NextResponse.json(allLocations);
    }
    
    // Build change map for efficient lookup
    const changeMap = buildChangeMap(timelineData.entries);
    
    // Reconstruct locations for target year
    const reconstructedLocations = allLocations
      .map(location => getLocationStateForYear(location, targetYear, changeMap))
      .filter((location): location is Location => location !== null);
    
    // If reconstruction resulted in no locations, fall back to current state
    if (reconstructedLocations.length === 0 && allLocations.length > 0) {
      return NextResponse.json(allLocations);
    }
    
    return NextResponse.json(reconstructedLocations);
  } catch (err) {
    return NextResponse.json([], { status: 200 }); // Return empty array if file doesn't exist
  }
}

export async function POST(req: NextRequest) {
  try {
    const newLocation: Location = await req.json();
    if (!newLocation.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    let locations: Location[] = [];
    try {
      const data = await fs.readFile(locationsPath, 'utf-8');
      locations = JSON.parse(data);
    } catch {}
    locations.push(newLocation);
    await fs.writeFile(locationsPath, JSON.stringify(locations, null, 2), 'utf-8');
    return NextResponse.json(newLocation);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save location' }, { status: 500 });
  }
} 