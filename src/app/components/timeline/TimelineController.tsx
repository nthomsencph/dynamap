"use client";
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaPlus} from 'react-icons/fa';
import { useTimelineContext } from '@/contexts/TimelineContext';
import { useLocations } from '@/hooks/elements/useLocations';
import { useRegions } from '@/hooks/elements/useRegions';
import { useMapSettings } from '@/app/components/map/MapSettingsContext';
import { toast } from 'react-toastify';
import { NoteDialog } from '../dialogs/NoteDialog';
import { NotePanel } from '../panels/NotePanel';
import { EpochPanel } from '../panels/EpochPanel';
import { TimelineNotes } from './TimelineNotes';
import { EpochDialog } from '../dialogs/EpochDialog';
import { formatEpochDateRange, calculateDisplayYear } from '@/app/utils/timeline';
import type { TimelineNote, TimelineEpoch } from '@/types/timeline';
import '@/css/timeline/timeline-slider.css';

export function TimelineSlider({ 
  onClose, 
  onEpochClick,
  onOpenSettings,
  onContextMenu,
  onOpenEpochDialog,
  onOpenNoteDialog
}: { 
  onClose?: () => void;
  onEpochClick?: () => void;
  onOpenSettings?: () => void;
  onContextMenu?: (e: React.MouseEvent, type: 'note' | 'epoch', element?: TimelineNote | TimelineEpoch) => void;
  onOpenEpochDialog?: (epoch: TimelineEpoch) => void;
  onOpenNoteDialog?: (note: TimelineNote, year: number) => void;
}) {
  const {
    entries,
    epochs,
    currentEntry,
    currentEpoch,
    currentYear,
    yearRange,
    navigateToYear,
    createEntry,
    createEpoch,
    updateEpoch,
    fetchTimeline,
    updateEntry,
    deleteEpoch
  } = useTimelineContext();

  const { fetchLocations } = useLocations(currentYear);
  const { fetchRegions } = useRegions(currentYear);
  const { editMode } = useMapSettings();

  const [isNavigating, setIsNavigating] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isNotePanelOpen, setIsNotePanelOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{ note: TimelineNote; year: number } | null>(null);
  const [isEpochDialogOpen, setIsEpochDialogOpen] = useState(false);
  const [epochDialogMode, setEpochDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedEpoch, setSelectedEpoch] = useState<TimelineEpoch | undefined>(undefined);
  const [isTimelineNotesOpen, setIsTimelineNotesOpen] = useState(false);

  // Calculate the earliest year we can navigate to (earliest epoch start year)
  const earliestYear = useMemo(() => {
    if (epochs.length === 0) return -Infinity;
    return Math.min(...epochs.map(epoch => epoch.startYear));
  }, [epochs]);

  // Navigate to a specific year
  const handleNavigateToYear = useCallback(async (year: number) => {
    console.log('TimelineController: Navigating to year', year, 'current year is', currentYear);
    setIsNavigating(true);
    try {
      await navigateToYear(year);
      console.log('TimelineController: Navigation completed to year', year);
      // The hooks will automatically refresh with timeline-aware data
      // No need to manually fetch locations and regions
    } catch (err) {
      console.error('TimelineController: Navigation failed:', err);
      toast.error('Failed to navigate to year');
    } finally {
      setIsNavigating(false);
    }
  }, [navigateToYear, currentYear]);

  // Navigate to next entry
  const handleNextEntry = useCallback(() => {
    if (!currentEntry || entries.length === 0) return;

    const currentIndex = entries.findIndex(e => e.year === currentEntry.year);
    const nextIndex = (currentIndex + 1) % entries.length;
    const nextEntry = entries[nextIndex];
    
    handleNavigateToYear(nextEntry.year);
  }, [currentEntry, entries, handleNavigateToYear]);

  // Navigate to previous entry
  const handlePrevEntry = useCallback(() => {
    if (!currentEntry || entries.length === 0) return;

    const currentIndex = entries.findIndex(e => e.year === currentEntry.year);
    const prevIndex = currentIndex === 0 ? entries.length - 1 : currentIndex - 1;
    const prevEntry = entries[prevIndex];
    
    // Only navigate if the previous entry is not before the earliest year
    if (prevEntry.year >= earliestYear) {
      handleNavigateToYear(prevEntry.year);
    }
  }, [currentEntry, entries, handleNavigateToYear, earliestYear]);

  // Navigate to next year
  const handleNextYear = useCallback(() => {
    const nextYear = currentYear + 1;
    handleNavigateToYear(nextYear);
  }, [currentYear, handleNavigateToYear]);

  // Navigate to previous year
  const handlePrevYear = useCallback(() => {
    const prevYear = currentYear - 1;
    if (prevYear >= earliestYear) {
      handleNavigateToYear(prevYear);
    }
  }, [currentYear, handleNavigateToYear, earliestYear]);

  // Handle slider change
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value);
    if (year >= earliestYear) {
      handleNavigateToYear(year);
    }
  }, [handleNavigateToYear, earliestYear]);

  const handleDeleteNote = async (noteId: string) => {
    if (!currentEntry) return;

    try {
      // Remove the note from the current entry
      const updatedNotes = currentEntry.notes.filter((note: TimelineNote) => note.id !== noteId);
      
      const updatedEntry = {
        ...currentEntry,
        notes: updatedNotes
      };

      await updateEntry(currentYear, updatedEntry);
      await fetchTimeline();
      
      // Close any open note panels if the deleted note was being viewed
      if (selectedNote?.note.id === noteId) {
        setIsNotePanelOpen(false);
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleDeleteEpoch = async (epochId: string) => {
    try {
      await deleteEpoch(epochId);
      await fetchTimeline();
      
      // Close any open epoch dialogs if the deleted epoch was being edited
      if (selectedEpoch?.id === epochId) {
        setIsEpochDialogOpen(false);
        setSelectedEpoch(undefined);
      }
    } catch (error) {
      console.error('Failed to delete epoch:', error);
    }
  };

  const handleTimelineNoteClick = (note: TimelineNote) => {
    setSelectedNote({ note, year: currentYear });
    setIsNotePanelOpen(true);
  };

  const handleEpochClick = () => {
    if (currentEpoch) {
      if (onEpochClick) {
        onEpochClick();
      }
    }
  };

  const handleCreateEpoch = () => {
    setEpochDialogMode('create');
    setSelectedEpoch(undefined);
    setIsEpochDialogOpen(true);
  };

  // Context menu handlers - follow the same pattern as markers
  const handleNoteContextMenu = useCallback((e: React.MouseEvent, note: TimelineNote) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, 'note', note);
    }
  }, [onContextMenu]);

  const handleEpochContextMenu = useCallback((e: React.MouseEvent, epoch: TimelineEpoch) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, 'epoch', epoch);
    }
  }, [onContextMenu]);

  const displayYear = currentEpoch ? calculateDisplayYear(currentYear, currentEpoch) : currentYear;
  const yearLabel = `${currentEpoch?.yearPrefix || ''} ${displayYear} ${currentEpoch?.yearSuffix || ''}`;

  // Auto-show notes when TimelineSlider opens and there are notes
  useEffect(() => {
    if (currentEntry?.notes && currentEntry.notes.length > 0) {
      setIsTimelineNotesOpen(true);
    }
  }, [currentEntry?.notes]);

  const handleAddNote = () => {
    setIsNoteDialogOpen(true);
  };

  return (
    <>
      {/* Backdrop for closing on outside click - only covers area around TimelineSlider */}
      <div 
        className="timeline-backdrop"
        onMouseDown={(e) => {
          // Only handle left-click events (button 0)
          if (e.button === 0 && onClose) {
            onClose();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Timeline Slider */}
      <div 
        className={`timeline-slider ${isNavigating ? 'loading' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Current Epoch Display */}
        {currentEpoch && (
          <div 
            className="timeline-epoch" 
            style={{ borderLeftColor: currentEpoch.color }}
            onClick={handleEpochClick}
            onContextMenu={(e) => handleEpochContextMenu(e, currentEpoch)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="timeline-epoch-name">{currentEpoch.name}</div>
                <div className="timeline-epoch-years">
                  {formatEpochDateRange(currentEpoch)}
                </div>
              </div>
              {currentEntry?.notes && currentEntry.notes.length > 0 && (
                <div className="notes-counter">
                  {currentEntry.notes.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Year Navigation - Enhanced Design */}
        <div className="timeline-year-nav">
          <button
            onClick={handlePrevEntry}
            disabled={isNavigating || entries.length === 0 || currentYear <= earliestYear}
            className="timeline-nav-button"
            title="Previous entry"
          >
            <FaStepBackward size={14} />
          </button>
          
          <button
            onClick={handlePrevYear}
            disabled={isNavigating || currentYear <= earliestYear}
            className="timeline-nav-button"
            title="Previous year"
          >
            <FaStepBackward size={12} />
          </button>
          
          <div className="timeline-year-display">
            {yearLabel}
          </div>
          
          <button
            onClick={handleNextYear}
            disabled={isNavigating}
            className="timeline-nav-button"
            title="Next year"
          >
            <FaStepForward size={12} />
          </button>
          
          <button
            onClick={handleNextEntry}
            disabled={isNavigating || entries.length === 0}
            className="timeline-nav-button"
            title="Next entry"
          >
            <FaStepForward size={14} />
          </button>
        </div>

        {/* Action Buttons Row - Enhanced Design */}
        {editMode && (
          <div className="timeline-actions">
            <button
              onClick={handleAddNote}
              className="timeline-action-button primary"
            >
              <FaPlus size={12} />
              <span>Note</span>
            </button>

            <button
              onClick={handleCreateEpoch}
              className="timeline-action-button secondary"
            >
              <FaPlus size={12} />
              <span>Epoch</span>
            </button>
          </div>
        )}
      </div>

      {/* Note Dialog for creating/editing notes */}
      <NoteDialog
        noteId={selectedNote?.note.id || null}
        isOpen={isNoteDialogOpen}
        onClose={() => {
          setIsNoteDialogOpen(false);
          setSelectedNote(null);
        }}
      />

      {/* Note Panel for viewing notes */}
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

      {/* Epoch Dialog for creating/editing epochs */}
      <EpochDialog
        isOpen={isEpochDialogOpen}
        mode={epochDialogMode}
        epoch={selectedEpoch}
        onClose={() => {
          setIsEpochDialogOpen(false);
          setSelectedEpoch(undefined);
        }}
      />

      {/* Timeline Notes Notification Panel */}
      <TimelineNotes
        notes={currentEntry?.notes || []}
        year={currentYear}
        isOpen={isTimelineNotesOpen}
        onClose={() => setIsTimelineNotesOpen(false)}
        onNoteClick={handleTimelineNoteClick}
        onNoteContextMenu={handleNoteContextMenu}
      />
    </>
  );
} 