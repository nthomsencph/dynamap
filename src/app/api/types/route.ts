import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_LOCATION_TYPES } from '@/types/locations';
import { DEFAULT_REGION_TYPES } from '@/types/regions';

const typesPath = path.join(process.cwd(), 'public', 'types.json');

type Category = 'locations' | 'regions';

// Define a mutable version of the types
interface Types {
  locations: string[];
  regions: string[];
}

// Convert readonly arrays to mutable arrays
const DEFAULT_TYPES_MUTABLE: Types = {
  locations: [...DEFAULT_LOCATION_TYPES],
  regions: [...DEFAULT_REGION_TYPES]
};

export async function GET() {
  try {
    const data = await fs.readFile(typesPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    // If file doesn't exist, return default types
    return NextResponse.json(DEFAULT_TYPES_MUTABLE);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { category, type } = await req.json() as { category: Category; type: string };
    if (!category || !type || !['locations', 'regions'].includes(category)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let types: Types;
    try {
      const data = await fs.readFile(typesPath, 'utf-8');
      types = JSON.parse(data);
    } catch {
      types = { ...DEFAULT_TYPES_MUTABLE };
    }

    // Don't add duplicate types
    if (types[category].includes(type)) {
      return NextResponse.json({ error: 'Type already exists' }, { status: 400 });
    }

    // Create a new array with the new type
    types[category] = [...types[category], type];
    await fs.writeFile(typesPath, JSON.stringify(types, null, 2), 'utf-8');
    return NextResponse.json(types);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save type' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { category, type } = await req.json() as { category: Category; type: string };
    if (!category || !type || !['locations', 'regions'].includes(category)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const data = await fs.readFile(typesPath, 'utf-8');
    const types: Types = JSON.parse(data);

    // Don't allow deleting default types
    if (DEFAULT_TYPES_MUTABLE[category].includes(type)) {
      return NextResponse.json({ error: 'Cannot delete default type' }, { status: 400 });
    }

    types[category] = types[category].filter(t => t !== type);
    await fs.writeFile(typesPath, JSON.stringify(types, null, 2), 'utf-8');
    return NextResponse.json(types);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete type' }, { status: 500 });
  }
} 