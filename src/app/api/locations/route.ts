import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Location } from '@/types/locations';

const locationsPath = path.join(process.cwd(), 'public', 'locations.json');

export async function GET() {
  try {
    const data = await fs.readFile(locationsPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
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

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
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

export async function PUT(req: NextRequest) {
  try {
    const updatedLocation: Location = await req.json();
    if (!updatedLocation.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const data = await fs.readFile(locationsPath, 'utf-8');
    let locations: Location[] = JSON.parse(data);
    const idx = locations.findIndex((p: Location) => p.id === updatedLocation.id);
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