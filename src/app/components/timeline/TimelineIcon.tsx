"use client";
import React, { useState } from 'react';
import { FaTimeline } from 'react-icons/fa6';
import { TimelineSlider } from './TimelineController';
import { EpochPanel } from '../panels/EpochPanel';
import { useTimelineContext } from '@/contexts/TimelineContext';
import { useMapSettings } from '@/app/components/map/MapSettingsContext';
import type { TimelineEpoch } from '@/types/timeline';
import '@/css/map-ui.css';

export function TimelineIcon() {
  const [open, setOpen] = useState(false);
  const [isEpochPanelOpen, setIsEpochPanelOpen] = useState(false);
  const [selectedEpoch, setSelectedEpoch] = useState<TimelineEpoch | null>(null);
  const { currentEpoch } = useTimelineContext();
  const { showTimeline } = useMapSettings();

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
        onClick={() => setOpen((v) => !v)}
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