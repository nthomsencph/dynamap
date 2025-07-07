'use client';
import React, { useState } from 'react';
import { FaTimeline } from 'react-icons/fa6';
import { TimelineSlider } from './TimelineController';
import { EpochPanel } from '../panels/timeline/EpochPanel';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { useSettings } from '@/hooks/useSettings';
import type { TimelineEpoch, TimelineNote } from '@/types/timeline';
import '@/css/map-ui.css';

export function TimelineIcon({
  onOpenSettings,
  onContextMenu,
  onOpenEpochDialog,
  onOpenNoteDialog,
}: {
  onOpenSettings?: () => void;
  onContextMenu?: (
    e: React.MouseEvent,
    type: 'note' | 'epoch',
    element?: TimelineNote | TimelineEpoch
  ) => void;
  onOpenEpochDialog?: (epoch: TimelineEpoch) => void;
  onOpenNoteDialog?: (note: TimelineNote, year: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isEpochPanelOpen, setIsEpochPanelOpen] = useState(false);
  const [selectedEpoch, setSelectedEpoch] = useState<TimelineEpoch | null>(
    null
  );
  const { currentEpoch } = useTimelineContext();
  const { settings } = useSettings();
  const { showTimeline = true } = settings || {};

  const handleEpochClick = () => {
    if (currentEpoch) {
      setSelectedEpoch(currentEpoch);
      setIsEpochPanelOpen(true);
      setOpen(false); // Close the TimelineSlider
    }
  };

  const handleEpochPanelClose = () => {
    setIsEpochPanelOpen(false);
    setSelectedEpoch(null);
  };

  // Don't render if timeline is disabled
  if (!showTimeline) return null;

  return (
    <>
      {/* Floating Icon Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="timeline-fab"
        title="Timeline"
        aria-label="Open timeline"
      >
        <FaTimeline size={16} />
      </button>

      {/* Timeline Slider Panel */}
      {open && (
        <TimelineSlider
          onClose={() => setOpen(false)}
          onEpochClick={handleEpochClick}
          onOpenSettings={onOpenSettings}
          onContextMenu={onContextMenu}
          onOpenEpochDialog={onOpenEpochDialog}
          onOpenNoteDialog={onOpenNoteDialog}
        />
      )}

      {/* Epoch Panel */}
      {selectedEpoch && (
        <EpochPanel
          epoch={selectedEpoch}
          isOpen={isEpochPanelOpen}
          onClose={handleEpochPanelClose}
        />
      )}
    </>
  );
}
