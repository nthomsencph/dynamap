import React from 'react';
import { LocationDialog } from '../dialogs/LocationDialog';
import { RegionDialog } from '../dialogs/RegionDialog';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';
import { EpochDialog } from '../dialogs/EpochDialog';
import { NoteDialog } from '../dialogs/NoteDialog';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import type { TimelineNote, TimelineEpoch } from '@/types/timeline';

interface MapDialogsProps {
  // Element dialogs
  locationDialog: {
    open: boolean;
    mode: 'create' | 'edit';
    location: Partial<Location> | null;
  };
  regionDialog: {
    open: boolean;
    mode: 'create' | 'edit';
    region: Partial<Region> | null;
    position: [number, number][] | null;
  };

  // Save handlers
  onSaveLocation: (location: Location) => Promise<void>;
  onSaveRegion: (region: Region) => Promise<void>;
  onCloseLocation: () => void;
  onCloseRegion: () => void;
  onDeleteLocation: (location: Location) => void;
  onDeleteRegion: (region: Region) => void;

  // Preview states
  previewLocation: Partial<Location> | null;
  previewRegion: Partial<Region> | null;
  onPreviewLocationChange: (location: Partial<Location> | null) => void;
  onPreviewRegionChange: (region: Partial<Region> | null) => void;

  // Delete confirmation
  deleteConfirm: {
    open: boolean;
    type: 'location' | 'region';
    element: Location | Region | null;
    mode: 'normal' | 'timeline';
    warning?: string;
  };
  onDeleteElement: () => Promise<void>;
  onDeleteFromTimeline: () => Promise<void>;
  onDeleteCancel: () => void;

  // Timeline dialogs
  timelineEpochDialog: {
    open: boolean;
    epoch: TimelineEpoch | undefined;
  };
  timelineNoteDialog: {
    open: boolean;
    note: TimelineNote | undefined;
    year: number;
  };
  onCloseEpochDialog: () => void;
  onCloseNoteDialog: () => void;

  // Map reference for dialogs
  mapRef: React.RefObject<any>;
}

export function MapDialogs({
  locationDialog,
  regionDialog,
  onSaveLocation,
  onSaveRegion,
  onCloseLocation,
  onCloseRegion,
  onDeleteLocation,
  onDeleteRegion,
  onPreviewLocationChange,
  onPreviewRegionChange,
  deleteConfirm,
  onDeleteElement,
  onDeleteFromTimeline,
  onDeleteCancel,
  timelineEpochDialog,
  timelineNoteDialog,
  onCloseEpochDialog,
  onCloseNoteDialog,
  mapRef,
}: MapDialogsProps) {
  return (
    <>
      {/* Element Dialogs */}
      <LocationDialog
        open={locationDialog.open}
        mode={locationDialog.mode}
        location={locationDialog.location}
        onSave={onSaveLocation}
        onClose={onCloseLocation}
        onDelete={() => onDeleteLocation(locationDialog.location as Location)}
        mapRef={mapRef}
        onPreviewChange={onPreviewLocationChange}
      />

      <RegionDialog
        open={regionDialog.open}
        mode={regionDialog.mode}
        region={regionDialog.region as Region | undefined}
        position={regionDialog.position || undefined}
        map={mapRef.current!}
        onSave={onSaveRegion}
        onClose={onCloseRegion}
        onDelete={() => onDeleteRegion(regionDialog.region as Region)}
        onPreviewChange={onPreviewRegionChange}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title={`Delete ${deleteConfirm.type === 'location' ? 'Location' : 'Region'}`}
        message={`Are you sure you want to delete "${deleteConfirm.element?.name}"?`}
        onConfirm={onDeleteElement}
        onCancel={onDeleteCancel}
        onDeleteFromTimeline={onDeleteFromTimeline}
        showDeleteFromTimeline={true}
        warning={deleteConfirm.warning}
      />

      {/* Timeline Dialogs */}
      <EpochDialog
        isOpen={timelineEpochDialog.open}
        mode="edit"
        epoch={timelineEpochDialog.epoch}
        onClose={onCloseEpochDialog}
      />

      <NoteDialog
        noteId={timelineNoteDialog.note?.id || null}
        isOpen={timelineNoteDialog.open}
        onClose={onCloseNoteDialog}
      />
    </>
  );
}
