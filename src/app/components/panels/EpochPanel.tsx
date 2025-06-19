"use client";
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { useTimelineContext } from '@/contexts/TimelineContext';
import { NotePanel } from '../panels/NotePanel';
import { formatEpochDates } from '@/app/utils/timeline';
import type { TimelineEpoch, TimelineNote } from '@/types/timeline';
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
      <div className="sidepanel-backdrop" onClick={onClose} />
      <div className="sidepanel" style={{ width: '450px' }}>
        {/* Drag handle */}
        <div className="sidepanel-drag-handle" />
        
        {/* Header */}
        <div className="sidepanel-header" style={{ justifyContent: 'space-between', gap: 0 }}>
          <div className="sidepanel-header-section">
            <h2 className="sidepanel-title">{epoch.name}</h2>
            <p className="sidepanel-type">{formatYearSpan()}</p>
          </div>
          <button className="sidepanel-back-button" onClick={onClose}>
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="sidepanel-content">
          {/* Epoch Info */}
          <div>
            {epoch.description && (
              <div 
                className="sidepanel-description rich-text-content"
                dangerouslySetInnerHTML={{ __html: epoch.description }}
              />
            )}
          </div>

          {/* Notes Section */}
          <div>
            <h3 style={{ 
              fontSize: '1.2em', 
              fontWeight: '600', 
              color: '#fff', 
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '8px'
            }}>
              Notes ({epochNotes.length})
            </h3>
            
            {epochNotes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {epochNotes.map(({ note, year }) => (
                  <div
                    key={`${year}-${note.id}`}
                    style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onClick={() => handleNoteClick(note, year)}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#e5e7eb' 
                      }}>
                        {note.title || 'Untitled'}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#fff',
                        fontWeight: '500'
                      }}>
                        {year}
                      </div>
                    </div>
                    {note.description && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#9ca3af', 
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {note.description.replace(/<[^>]*>/g, '')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                fontStyle: 'italic', 
                textAlign: 'center', 
                padding: '32px' 
              }}>
                No notes found for this epoch
              </div>
            )}
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