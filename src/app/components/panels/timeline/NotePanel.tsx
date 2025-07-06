import React from 'react';
import { TimelineNote } from '@/types/timeline';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { formatEpochDateRange, calculateDisplayYear } from '@/app/utils/timeline';
import { BasePanel } from '../BasePanel';
import type { MapElement } from '@/types/elements';

interface NotePanelProps {
  note: TimelineNote;
  year: number;
  isOpen: boolean;
  onClose: () => void;
}

export function NotePanel({ note, year, isOpen, onClose }: NotePanelProps) {
  const { currentEpoch } = useTimelineContext();

  // Format year with epoch prefix/suffix
  const formatYear = (year: number) => {
    if (currentEpoch) {
      const displayYear = calculateDisplayYear(year, currentEpoch);
      return `${currentEpoch.yearPrefix || ''} ${displayYear} ${currentEpoch.yearSuffix || ''}`;
    }
    return `${year}`;
  };

  if (!isOpen) return null;

  // Create a dummy element for BasePanel
  const noteElement: MapElement = {
    id: note.id,
    name: note.title || 'Untitled Note',
    type: formatYear(year),
    elementType: 'location', // Doesn't matter for notes
    position: [0, 0],
    color: '#ffffff',
    prominence: { lower: 0, upper: 10 },
    icon: 'MdPlace',
    fields: {},
    creationYear: year,
    description: note.description
  };

  return (
    <BasePanel
      element={noteElement}
      onClose={onClose}
      className="note-panel"
    >
      {/* Epoch info if available */}
      {currentEpoch && (
        <div className="note-panel-epoch-info">
          <p className="text-sm text-gray-400">
            {currentEpoch.name} ({formatEpochDateRange(currentEpoch)})
          </p>
        </div>
      )}
      
      {/* Note content */}
      {!note.description && (
        <p className="text-gray-500 italic">No description available</p>
      )}
    </BasePanel>
  );
} 