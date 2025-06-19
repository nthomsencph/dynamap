import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Region } from '@/types/regions';

const regionsPath = path.join(process.cwd(), 'public', 'regions.json');

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updatedRegion: Region = await request.json();
    
    if (!id || updatedRegion.id !== id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
    }
    
    const data = await fs.readFile(regionsPath, 'utf-8');
    let regions: Region[] = JSON.parse(data);
    const idx = regions.findIndex((r: Region) => r.id === id);
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    const data = await fs.readFile(regionsPath, 'utf-8');
    const regions: Region[] = JSON.parse(data);
    const region = regions.find((r: Region) => r.id === id);
    
    if (!region) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }
    
    return NextResponse.json(region);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get region' }, { status: 500 });
  }
} 