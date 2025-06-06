import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Region } from '@/types/regions';

const regionsPath = path.join(process.cwd(), 'public', 'regions.json');

export async function GET() {
  try {
    const data = await fs.readFile(regionsPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    return NextResponse.json([], { status: 200 }); // Return empty array if file doesn't exist
  }
}

export async function POST(req: NextRequest) {
  try {
    const newRegion: Region = await req.json();
    if (!newRegion.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    let regions: Region[] = [];
    try {
      const data = await fs.readFile(regionsPath, 'utf-8');
      regions = JSON.parse(data);
    } catch {}
    regions.push(newRegion);
    await fs.writeFile(regionsPath, JSON.stringify(regions, null, 2), 'utf-8');
    return NextResponse.json(newRegion);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save region' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updatedRegion: Region = await req.json();
    if (!updatedRegion.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const data = await fs.readFile(regionsPath, 'utf-8');
    let regions: Region[] = JSON.parse(data);
    const idx = regions.findIndex((r: Region) => r.id === updatedRegion.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }
    regions[idx] = updatedRegion;
    await fs.writeFile(regionsPath, JSON.stringify(regions, null, 2), 'utf-8');
    return NextResponse.json(updatedRegion);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update region' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const data = await fs.readFile(regionsPath, 'utf-8');
    let regions: Region[] = JSON.parse(data);
    const newRegions = regions.filter((r: Region) => r.id !== id);
    await fs.writeFile(regionsPath, JSON.stringify(newRegions, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 });
  }
} 