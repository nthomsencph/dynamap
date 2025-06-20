import React from 'react';
import { TimelineNote } from '@/types/timeline';
import { useTimelineContext } from '@/contexts/TimelineContext';
import { usePanelWidth } from '@/hooks/ui/usePanelWidth';
import { formatEpochDateRange, calculateDisplayYear } from '@/app/utils/timeline';
import '@/css/panels/sidepanel.css';

interface NotePanelProps {
  note: TimelineNote;
  year: number;
  isOpen: boolean;
  onClose: () => void;
}

export function NotePanel({ note, year, isOpen, onClose }: NotePanelProps) {
  const { currentEpoch } = useTimelineContext();
  const { width, handleMouseDown } = usePanelWidth();

  // Format year with epoch prefix/suffix
  const formatYear = (year: number) => {
    if (currentEpoch) {
      const displayYear = calculateDisplayYear(year, currentEpoch);
      return `${currentEpoch.yearPrefix || ''} ${displayYear} ${currentEpoch.yearSuffix || ''}`;
    }
    return `${year}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to prevent clicks from reaching TimelineSlider */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10015,
          background: 'transparent'
        }}
        onClick={onClose}
      />
      <div
        className="sidepanel"
        style={{ 
          width,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 10016 // Higher than timeline notes (10006)
        }}
        data-testid="timeline-note-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sidepanel-drag-handle" onMouseDown={handleMouseDown} />
        <div className="sidepanel-header">
          <div className="flex-1">
            <h2 className="sidepanel-title">
              {note.title || 'Untitled Note'}
            </h2>
            <p className="sidepanel-type">
              {formatYear(year)}
            </p>
            {currentEpoch && (
              <p className="text-sm text-gray-400 mt-1">
                {currentEpoch.name} ({formatEpochDateRange(currentEpoch)})
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl ml-4">×</button>
        </div>
        
        <div className="sidepanel-content">
          {note.description && (
            <div 
              className="sidepanel-description rich-text-content"
              dangerouslySetInnerHTML={{ __html: note.description }}
            />
          )}
          {!note.description && (
            <p className="text-gray-500 italic">No description available</p>
          )}
        </div>
      </div>
    </>
  );
} 