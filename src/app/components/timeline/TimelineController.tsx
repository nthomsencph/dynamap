"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaEdit, FaSave, FaTimes, FaPlus, FaCalendar } from 'react-icons/fa';
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
import { ContextMenu } from '../ui/ContextMenu';
import { formatEpochDateRange } from '@/app/utils/timeline';
import type { TimelineEntry, TimelineNote, TimelineEpoch } from '@/types/timeline';
import '@/css/timeline/timeline-slider.css';

export function TimelineSlider({ 
  onClose, 
  onEpochClick 
}: { 
  onClose?: () => void;
  onEpochClick?: () => void;
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
    updateEpoch
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
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    type: 'note' | 'epoch';
    note?: TimelineNote;
    epoch?: TimelineEpoch;
  }>({
    open: false,
    x: 0,
    y: 0,
    type: 'note'
  });

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
    
    handleNavigateToYear(prevEntry.year);
  }, [currentEntry, entries, handleNavigateToYear]);

  // Navigate to next year
  const handleNextYear = useCallback(() => {
    const nextYear = currentYear + 1;
    handleNavigateToYear(nextYear);
  }, [currentYear, handleNavigateToYear]);

  // Navigate to previous year
  const handlePrevYear = useCallback(() => {
    const prevYear = currentYear - 1;
    handleNavigateToYear(prevYear);
  }, [currentYear, handleNavigateToYear]);

  // Handle slider change
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value);
    handleNavigateToYear(year);
  }, [handleNavigateToYear]);

  // Context menu handlers
  const handleNoteContextMenu = useCallback((e: React.MouseEvent, note: TimelineNote) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      type: 'note',
      note
    });
  }, []);

  const handleEpochContextMenu = useCallback((e: React.MouseEvent, epoch: TimelineEpoch) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      type: 'epoch',
      epoch
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  const getContextMenuItems = useCallback(() => {
    if (contextMenu.type === 'note' && contextMenu.note) {
      return [
        {
          label: 'Edit note',
          onClick: () => {
            // Open note dialog in edit mode
            setSelectedNote({ note: contextMenu.note!, year: currentYear });
            setIsNoteDialogOpen(true);
            closeContextMenu();
          }
        }
      ];
    } else if (contextMenu.type === 'epoch' && contextMenu.epoch) {
      return [
        {
          label: 'Edit epoch',
          onClick: () => {
            setEpochDialogMode('edit');
            setSelectedEpoch(contextMenu.epoch);
            setIsEpochDialogOpen(true);
            closeContextMenu();
          }
        }
      ];
    }
    return [];
  }, [contextMenu, currentYear, closeContextMenu]);

  const handleAddNote = () => {
    setIsNoteDialogOpen(true);
  };

  const handleNoteClick = (note: TimelineNote, year: number) => {
    setSelectedNote({ note, year });
    setIsNotePanelOpen(true);
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

  const displayYear = currentEpoch && currentEpoch.restartAtZero
    ? (currentYear - currentEpoch.startYear + 1)
    : currentYear;
  const yearLabel = `${currentEpoch?.yearPrefix || ''} ${displayYear} ${currentEpoch?.yearSuffix || ''}`;

  // Debug logging
  console.log('TimelineController: Current year:', currentYear, 'Display year:', displayYear, 'Year label:', yearLabel);
  console.log('TimelineController: Current epoch:', currentEpoch?.name, 'Entries:', entries.length);

  // Auto-show notes when TimelineSlider opens and there are notes
  useEffect(() => {
    if (currentEntry?.notes && currentEntry.notes.length > 0) {
      setIsTimelineNotesOpen(true);
    }
  }, [currentEntry?.notes]);

  return (
    <>
      {/* Backdrop for closing on outside click - only covers area around TimelineSlider */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100px',
          height: '100vh',
          zIndex: 10001,
          background: 'transparent'
        }}
        onMouseDown={(e) => {
          // Only handle left-click events (button 0)
          if (e.button === 0 && onClose) {
            onClose();
          }
        }}
      />
      
      {/* Timeline Slider */}
      <div 
        className="timeline-slider"
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
              <div className="timeline-epoch-name">{currentEpoch.name}</div>
              <div className="timeline-epoch-years">
                {formatEpochDateRange(currentEpoch)}
              </div>
            </div>
          </div>
        )}

        {/* Year Navigation - Minimalistic Single Line with Entry Navigation */}
        <div className="timeline-year-nav">
          <button
            onClick={handlePrevEntry}
            disabled={isNavigating || entries.length === 0}
            className="timeline-nav-button"
            title="Previous entry"
          >
            <FaStepBackward size={12} />
          </button>
          
          <button
            onClick={handlePrevYear}
            disabled={isNavigating}
            className="timeline-nav-button"
            title="Previous year"
          >
            <FaStepBackward size={10} />
          </button>
          
          <div style={{ 
            flex: 1, 
            height: 32, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#222',
            border: '1px solid #444',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {yearLabel}
          </div>
          
          <button
            onClick={handleNextYear}
            disabled={isNavigating}
            className="timeline-nav-button"
            title="Next year"
          >
            <FaStepForward size={10} />
          </button>
          
          <button
            onClick={handleNextEntry}
            disabled={isNavigating || entries.length === 0}
            className="timeline-nav-button"
            title="Next entry"
          >
            <FaStepForward size={12} />
          </button>
        </div>

        {/* Action Buttons Row */}
        {editMode && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddNote}
              className="timeline-action-button primary"
              style={{ flex: 1, marginBottom: 0 }}
            >
              <FaPlus size={12} />
              <span>Note</span>
            </button>

            <button
              onClick={handleCreateEpoch}
              className="timeline-action-button secondary"
              style={{ flex: 1, marginBottom: 0 }}
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

      {/* Context Menu */}
      <ContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        items={getContextMenuItems()}
        onClose={closeContextMenu}
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