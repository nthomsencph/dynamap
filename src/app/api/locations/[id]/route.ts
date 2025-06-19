import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Location } from '@/types/locations';

const locationsPath = path.join(process.cwd(), 'public', 'locations.json');

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    const data = await fs.readFile(locationsPath, 'utf-8');
    let locations: Location[] = JSON.parse(data);
    const newLocations = locations.filter((p: Location) => p.id !== id);
    await fs.writeFile(locationsPath, JSON.stringify(newLocations, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updatedLocation: Location = await request.json();
    
    if (!id || updatedLocation.id !== id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
    }
    
    const data = await fs.readFile(locationsPath, 'utf-8');
    let locations: Location[] = JSON.parse(data);
    const idx = locations.findIndex((p: Location) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    locations[idx] = updatedLocation;
    await fs.writeFile(locationsPath, JSON.stringify(locations, null, 2), 'utf-8');
    return NextResponse.json(updatedLocation);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    const data = await fs.readFile(locationsPath, 'utf-8');
    const locations: Location[] = JSON.parse(data);
    const location = locations.find((p: Location) => p.id === id);
    
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json(location);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get location' }, { status: 500 });
  }
} 