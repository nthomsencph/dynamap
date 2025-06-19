import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const settingsPath = path.join(process.cwd(), 'public', 'settings.json');

// Single source of truth for default settings
const DEFAULT_SETTINGS = {
  mapImageRoundness: 100,
  mapScale: 17.4,
  mapImage: '/media/map.jpg',
  mapImageSettings: {
    size: 'contain' as const,
    position: 'center' as const,
    customWidth: 4000,
    customHeight: 3000,
    lockAspectRatio: true,
    showBorder: false,
    borderColor: '#000000'
  },
  mapNameSettings: {
    content: '',
    show: false,
    position: 'center' as const
  },
  backgroundImage: '/media/parchment.jpeg',
  backgroundColor: '#000000',
  imageGallery: [
    '/media/map.jpg',
    '/media/parchment.jpeg',
    '/media/404.jpeg',
  ],
  editMode: true,
  startYear: 2024
};

export async function GET() {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    console.log('API: Raw settings file content:', data);
    
    if (!data.trim()) {
      console.log('API: Settings file is empty, returning default settings');
      return NextResponse.json(DEFAULT_SETTINGS);
    }
    
    const parsed = JSON.parse(data);
    console.log('API: Parsed settings:', parsed);
    
    // Merge with defaults to ensure all required fields exist
    const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed };
    return NextResponse.json(mergedSettings);
  } catch (error) {
    console.error('API: Error reading settings file:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    console.log('API: Received updates:', updates);
    
    // Load current settings (with defaults as fallback)
    let current = DEFAULT_SETTINGS;
    try {
      const data = await fs.readFile(settingsPath, 'utf-8');
      if (data.trim()) {
        const parsed = JSON.parse(data);
        current = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (readError) {
      console.log('API: Could not read existing settings, using defaults');
    }
    
    // Merge updates with current settings
    const merged = { ...current, ...updates };
    console.log('API: Saving merged settings:', merged);
    
    await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2));
    return NextResponse.json(merged);
  } catch (error) {
    console.error('API: Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
} 