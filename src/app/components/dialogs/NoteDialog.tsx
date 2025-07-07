'use client';
import React, { useState, useEffect } from 'react';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import type { TimelineEntry, TimelineNote } from '@/types/timeline';
import { useMapElementsByYear } from '@/hooks/queries/useMapElements';
import { usePanelWidth } from '@/hooks/ui/usePanelWidth';
import {
  formatEpochDateRange,
  calculateDisplayYear,
} from '@/app/utils/timeline';
import DescriptionEditor from '@/app/components/editor/DescriptionEditor';
import '@/css/dialogs/base-dialog.css';
import '@/css/panels/sidepanel.css';

interface NoteDialogProps {
  noteId: string | null; // null for new note
  isOpen: boolean;
  onClose: () => void;
}

export function NoteDialog({ noteId, isOpen, onClose }: NoteDialogProps) {
  const {
    currentYear,
    currentEpoch,
    getEntryForYear,
    updateEntry,
    createEntry,
    fetchTimeline,
  } = useTimelineContext();
  const { locations, regions } = useMapElementsByYear(currentYear);
  const { width, handleMouseDown } = usePanelWidth();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Get the current entry for the selected year
  const currentEntry = getEntryForYear(currentYear);

  useEffect(() => {
    if (isOpen) {
      if (noteId && currentEntry?.notes) {
        // Edit mode: load existing note data
        const existingNote = currentEntry.notes.find(
          (note: TimelineNote) => note.id === noteId
        );
        if (existingNote) {
          setTitle(existingNote.title || '');
          setDescription(existingNote.description || '');
        } else {
          // Note not found, start fresh
          setTitle('');
          setDescription('');
        }
      } else {
        // Create mode: start fresh
        setTitle('');
        setDescription('');
      }
    }
  }, [isOpen, noteId, currentEntry?.notes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (noteId && currentEntry?.notes) {
        // Edit existing note
        const existingNoteIndex = currentEntry.notes.findIndex(
          (note: TimelineNote) => note.id === noteId
        );
        if (existingNoteIndex !== -1) {
          const updatedNotes = [...currentEntry.notes];
          updatedNotes[existingNoteIndex] = {
            ...updatedNotes[existingNoteIndex],
            title: title.trim() || 'Untitled',
            description: description.trim(),
            updatedAt: new Date().toISOString(),
          };

          const updatedEntry: TimelineEntry = {
            ...currentEntry,
            notes: updatedNotes,
          };

          console.log(
            'Updating existing note:',
            updatedNotes[existingNoteIndex]
          );
          await updateEntry(currentYear, updatedEntry);
        }
      } else {
        // Create new note
        const newNote: TimelineNote = {
          id: crypto.randomUUID(),
          title: title.trim() || 'Untitled',
          description: description.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('Creating new note:', newNote);

        if (currentEntry) {
          // Add note to existing entry
          const existingNotes = Array.isArray(currentEntry.notes)
            ? currentEntry.notes
            : [];
          const updatedEntry: TimelineEntry = {
            ...currentEntry,
            notes: [...existingNotes, newNote],
          };
          console.log('Updating entry with new note:', updatedEntry);
          await updateEntry(currentYear, updatedEntry);
        } else {
          // Create new entry with the note
          console.log('Creating new entry with note');
          await createEntry({
            year: currentYear,
            notes: [newNote],
          });
        }
      }

      await fetchTimeline();
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  };

  // Format year with epoch prefix/suffix
  const formatYear = (year: number) => {
    if (currentEpoch) {
      const displayYear = calculateDisplayYear(year, currentEpoch);
      return `${currentEpoch.yearPrefix || ''} ${displayYear} ${currentEpoch.yearSuffix || ''}`;
    }
    return `${year}`;
  };

  const isEditMode = !!noteId;
  const dialogTitle = isEditMode
    ? `Edit note in ${formatYear(currentYear)}`
    : `Create note in ${formatYear(currentYear)}`;

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
          background: 'transparent',
        }}
        onClick={onClose}
      />
      <div
        className="sidepanel"
        style={{
          width,
          background: 'rgba(0,0,0,0.9)', // Permanent hover background
          zIndex: 10016, // Higher than timeline notes (10006)
        }}
        data-testid="timeline-note-dialog"
        onClick={e => e.stopPropagation()}
      >
        <div className="sidepanel-drag-handle" onMouseDown={handleMouseDown} />
        <div className="sidepanel-header">
          <div className="flex-1">
            <h2 className="sidepanel-title text-lg font-semibold text-gray-100">
              {dialogTitle}
            </h2>
            {currentEpoch && (
              <p className="text-sm text-gray-400 mt-1">
                {currentEpoch.name} ({formatEpochDateRange(currentEpoch)})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-xl ml-4"
          >
            ×
          </button>
        </div>
        <div className="sidepanel-content flex-1 overflow-y-auto px-0 py-0 space-y-4">
          <div>
            <input
              type="text"
              className="w-full rounded bg-gray-800 text-gray-100 px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Note title..."
            />
          </div>
          <div>
            <DescriptionEditor
              value={description}
              onChange={setDescription}
              elements={[...locations, ...regions]}
              rows={8}
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1 rounded"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}
