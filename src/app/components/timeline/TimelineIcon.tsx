"use client";
import React, { useState } from 'react';
import { FaTimeline } from 'react-icons/fa6';
import { TimelineSlider } from './TimelineController';
import { EpochPanel } from '../panels/EpochPanel';
import { useTimeline } from '@/hooks/elements/useTimeline';
import { useMapSettings } from '@/app/components/map/MapSettingsContext';
import type { TimelineEpoch } from '@/types/timeline';

export function TimelineIcon() {
  const [open, setOpen] = useState(false);
  const [isEpochPanelOpen, setIsEpochPanelOpen] = useState(false);
  const [selectedEpoch, setSelectedEpoch] = useState<TimelineEpoch | null>(null);
  const { currentEpoch } = useTimeline();
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
        style={{
          position: 'fixed',
          bottom: 24,
          right: 72, // Position to the left of settings button (24 + 32 + 16 gap)
          zIndex: 10000,
          background: '#222',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
        }}
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