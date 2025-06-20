import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { TimelineData, TimelineEntry } from '@/types/timeline';

const TIMELINE_FILE = path.join(process.cwd(), 'public', 'timeline.json');

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const afterYearParam = searchParams.get('afterYear');
    const elementType = searchParams.get('elementType'); // 'location' or 'region'
    
    // afterYear is optional - if not provided, delete ALL changes for the element
    const afterYear = afterYearParam ? parseInt(afterYearParam) : -1;
    
    if (afterYearParam && isNaN(afterYear)) {
      return NextResponse.json({ error: 'Invalid afterYear parameter' }, { status: 400 });
    }
    
    if (!elementType || !['location', 'region'].includes(elementType)) {
      return NextResponse.json({ error: 'Invalid elementType parameter' }, { status: 400 });
    }

    // Read current timeline
    const timelineData = await fs.readFile(TIMELINE_FILE, 'utf-8');
    const timeline: TimelineData = JSON.parse(timelineData);

    let updatedEntries = 0;

    // Find and update entries that contain changes for this element
    for (const entry of timeline.entries) {
      // If afterYear is specified, only process entries after that year
      // If afterYear is -1 (not provided), process all entries
      if (afterYear !== -1 && entry.year <= afterYear) continue;
      
      const changes = entry.changes;
      if (!changes) continue;
      
      let hasChanges = false;
      
      // Remove from modified changes
      if (changes.modified) {
        const elementChanges = changes.modified[`${elementType}s` as keyof typeof changes.modified];
        if (elementChanges && typeof elementChanges === 'object' && params.id in elementChanges) {
          delete (elementChanges as any)[params.id];
          hasChanges = true;
          
          // Clean up empty modified object
          if (Object.keys(elementChanges).length === 0) {
            delete (changes.modified as any)[`${elementType}s`];
          }
          if (Object.keys(changes.modified).length === 0) {
            delete (entry.changes as any).modified;
          }
        }
      }
      
      // Remove from deleted changes
      if (changes.deleted) {
        const deletedElements = changes.deleted[`${elementType}s` as keyof typeof changes.deleted];
        if (Array.isArray(deletedElements)) {
          const index = deletedElements.indexOf(params.id);
          if (index !== -1) {
            deletedElements.splice(index, 1);
            hasChanges = true;
            
            // Clean up empty deleted array
            if (deletedElements.length === 0) {
              delete (changes.deleted as any)[`${elementType}s`];
            }
            if (Object.keys(changes.deleted).length === 0) {
              delete (entry.changes as any).deleted;
            }
          }
        }
      }
      
      // Clean up empty changes object
      if (hasChanges && (!changes.modified || Object.keys(changes.modified).length === 0) &&
          (!changes.deleted || Object.keys(changes.deleted).length === 0)) {
        delete (entry as any).changes;
      }
      
      if (hasChanges) {
        updatedEntries++;
      }
    }

    // Save updated timeline
    await fs.writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));

    const message = afterYear === -1 
      ? `Removed all changes for ${elementType} ${params.id} from ${updatedEntries} timeline entries`
      : `Removed changes for ${elementType} ${params.id} from ${updatedEntries} timeline entries after year ${afterYear}`;

    return NextResponse.json({ 
      success: true, 
      updatedEntries,
      message
    });
  } catch (error) {
    console.error('Error deleting timeline changes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 