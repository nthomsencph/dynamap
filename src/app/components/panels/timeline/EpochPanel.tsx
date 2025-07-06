"use client";
import React from 'react';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { NotePanel } from './NotePanel';
import { formatEpochDates } from '@/app/utils/timeline';
import type { TimelineEpoch, TimelineNote } from '@/types/timeline';
import { usePanelWidth } from '@/hooks/ui/usePanelWidth';
import '@/css/panels/sidepanel.css';

interface EpochPanelProps {
  epoch: TimelineEpoch;
  isOpen: boolean;
  onClose: () => void;
}

export function EpochPanel({ epoch, isOpen, onClose }: EpochPanelProps) {
  const { entries } = useTimelineContext();
  const [selectedNote, setSelectedNote] = React.useState<{ note: TimelineNote; year: number } | null>(null);
  const [isNotePanelOpen, setIsNotePanelOpen] = React.useState(false);
  const { width, handleMouseDown } = usePanelWidth();

  // Get all notes for this epoch
  const epochNotes = React.useMemo(() => {
    const notes: Array<{ note: TimelineNote; year: number }> = [];
    
    entries.forEach(entry => {
      if (entry.year >= epoch.startYear && entry.year <= epoch.endYear) {
        if (entry.notes && entry.notes.length > 0) {
          entry.notes.forEach((note: TimelineNote) => {
            notes.push({ note, year: entry.year });
          });
        }
      }
    });
    
    return notes.sort((a, b) => a.year - b.year);
  }, [entries, epoch]);

  const handleNoteClick = (note: TimelineNote, year: number) => {
    setSelectedNote({ note, year });
    setIsNotePanelOpen(true);
  };

  if (!isOpen) return null;

  // Format the year span with prefix and suffix
  const formatYearSpan = () => {
    return formatEpochDates(epoch);
  };

  return (
    <>
      <div 
        className="sidepanel-backdrop" 
        onClick={onClose}
      >
        <div 
          className="sidepanel epoch-panel" 
          onClick={e => e.stopPropagation()}
          style={{ width: `${width}px` }}
        >
          {/* Draggable handle */}
          <div 
            className="sidepanel-drag-handle"
            onMouseDown={handleMouseDown}
            style={{ cursor: 'col-resize' }}
          />
          
          <div className="sidepanel-content">
            <div className="sidepanel-header-section">
              <h2 className="sidepanel-title">{epoch.name}</h2>
              <div className="sidepanel-type">{formatYearSpan()}</div>
            </div>

            {epoch.description && (
              <div className="sidepanel-description rich-text-content">
                <div 
                  className="panel-description"
                  dangerouslySetInnerHTML={{ __html: epoch.description }}
                />
              </div>
            )}

            {/* Notes Section */}
            <div className="epoch-panel-notes-section">
              
              {epochNotes.length > 0 ? (
                <div className="epoch-panel-notes-list">
                  {epochNotes.map(({ note, year }) => (
                    <div
                      key={`${year}-${note.id}`}
                      className="epoch-panel-note-item"
                      onClick={() => handleNoteClick(note, year)}
                    >
                      <div className="epoch-panel-note-header">
                        <div className="epoch-panel-note-title">
                          {note.title || 'Untitled'}
                        </div>
                        <div className="epoch-panel-note-year">
                          {year}
                        </div>
                      </div>
                      {note.description && (
                        <div className="epoch-panel-note-preview">
                          {note.description.replace(/<[^>]*>/g, '')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="epoch-panel-no-notes">
                  No notes found for this epoch
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Note Panel for viewing individual notes */}
      {selectedNote && (
        <NotePanel
          note={selectedNote.note}
          year={selectedNote.year}
          isOpen={isNotePanelOpen}
          onClose={() => {
            setIsNotePanelOpen(false);
            setSelectedNote(null);
          }}
        />
      )}
    </>
  );
} 