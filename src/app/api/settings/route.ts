import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const settingsPath = path.join(process.cwd(), 'public', 'settings.json');

export async function GET() {
  const data = await fs.readFile(settingsPath, 'utf-8');
  return NextResponse.json(JSON.parse(data));
}

export async function POST(req: NextRequest) {
  const updates = await req.json();
  const data = await fs.readFile(settingsPath, 'utf-8');
  const current = JSON.parse(data);
  const merged = { ...current, ...updates };
  await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2));
  return NextResponse.json(merged);
} 