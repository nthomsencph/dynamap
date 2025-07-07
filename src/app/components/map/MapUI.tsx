import React from 'react';
import { FaCog } from 'react-icons/fa';
import { DrawingModeBanner } from '../ui/DrawingModeBanner';
import { TimelineIcon } from '../timeline/TimelineIcon';
import { GeneralSettingsDialog } from '../dialogs/SettingsDialog';
import type { TimelineNote, TimelineEpoch } from '@/types/timeline';
import type { DrawingTool } from '@/hooks/elements/usePolygonDraw';

interface MapUIProps {
  // Drawing mode
  isDrawing: boolean;
  currentTool: DrawingTool;
  onDrawingCancel: () => void;
  
  // Settings
  showSettings: boolean;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  
  // Timeline
  currentZoom: number;
  fitZoom: number;
  showTimelineWhenZoomed: boolean;
  showSettingsWhenZoomed: boolean;
  onTimelineContextMenu: (e: React.MouseEvent, type: 'note' | 'epoch', element?: TimelineNote | TimelineEpoch) => void;
  onOpenEpochDialog: (epoch: TimelineEpoch) => void;
  onOpenNoteDialog: (note: TimelineNote, year: number) => void;
}

export function MapUI({
  isDrawing,
  currentTool,
  onDrawingCancel,
  showSettings,
  onOpenSettings,
  onCloseSettings,
  currentZoom,
  fitZoom,
  showTimelineWhenZoomed,
  showSettingsWhenZoomed,
  onTimelineContextMenu,
  onOpenEpochDialog,
  onOpenNoteDialog
}: MapUIProps) {
  return (
    <>
      {/* Drawing Mode Banner */}
      <DrawingModeBanner
        isVisible={isDrawing}
        currentTool={currentTool}
        onCancel={onDrawingCancel}
      />

      {/* Settings Icon Button - Show based on zoom settings */}
      {(currentZoom === fitZoom || showSettingsWhenZoomed) && (
        <button
          className="settings-fab"
          onClick={onOpenSettings}
          title="General settings"
        >
          <FaCog size={16} />
        </button>
      )}

      {/* Timeline Button - Show based on zoom settings */}
      {(currentZoom === fitZoom || showTimelineWhenZoomed) && (
        <TimelineIcon 
          onOpenSettings={onOpenSettings} 
          onContextMenu={onTimelineContextMenu}
          onOpenEpochDialog={onOpenEpochDialog}
          onOpenNoteDialog={onOpenNoteDialog}
        />
      )}

      {/* Settings Dialog */}
      {showSettings && (
        <GeneralSettingsDialog onClose={onCloseSettings} />
      )}
    </>
  );
} 