"use client";
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { TimelineNote } from '@/types/timeline';
import '@/css/timeline/timeline-notes.css';

interface TimelineNotesProps {
  notes: TimelineNote[];
  year: number;
  isOpen: boolean;
  onClose: () => void;
  onNoteClick: (note: TimelineNote) => void;
  onNoteContextMenu?: (e: React.MouseEvent, note: TimelineNote) => void;
}

export function TimelineNotes({ notes, year, isOpen, onClose, onNoteClick, onNoteContextMenu }: TimelineNotesProps) {
  const [closedNotes, setClosedNotes] = useState<Set<string>>(new Set());

  if (!isOpen || notes.length === 0) return null;

  const handleNoteClick = (note: TimelineNote) => {
    // Close the note when clicked (notification behavior)
    setClosedNotes(prev => new Set([...prev, note.id]));
    
    // Call the original onNoteClick handler
    onNoteClick(note);
    
    // If all notes are closed, close the entire notes display
    if (closedNotes.size + 1 >= notes.length) {
      onClose();
      setClosedNotes(new Set()); // Reset for next time
    }
  };

  const handleNoteContextMenu = (e: React.MouseEvent, note: TimelineNote) => {
    e.preventDefault();
    e.stopPropagation();
    if (onNoteContextMenu) {
      onNoteContextMenu(e, note);
    }
  };

  const handleCloseNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClosedNotes(prev => new Set([...prev, noteId]));
    
    // If all notes are closed, close the entire notes display
    if (closedNotes.size + 1 >= notes.length) {
      onClose();
      setClosedNotes(new Set()); // Reset for next time
    }
  };

  const visibleNotes = notes.filter(note => !closedNotes.has(note.id));

  return (
    <div className="timeline-notes-container">
      {/* Individual note widgets */}
      {visibleNotes.map((note, index) => (
        <div
          key={note.id}
          className="timeline-note-widget"
          style={{ animationDelay: `${index * 0.1}s` }}
          onClick={() => handleNoteClick(note)}
          onContextMenu={(e) => handleNoteContextMenu(e, note)}
        >
          <div className="timeline-note-widget-header">
            <div className="timeline-note-widget-title">
              {note.title || 'Untitled'}
            </div>
            <button 
              onClick={(e) => handleCloseNote(note.id, e)} 
              className="timeline-note-widget-close"
            >
              <FaTimes size={12} />
            </button>
          </div>
          {note.description && (
            <div className="timeline-note-widget-description">
              {note.description.replace(/<[^>]*>/g, '')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 