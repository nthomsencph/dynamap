import { useState, useCallback } from 'react';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import type { TimelineNote, TimelineEpoch } from '@/types/timeline';
import { useLocationDialog } from '@/hooks/dialogs/useLocationDialog';
import { useRegionDialog } from '@/hooks/dialogs/useRegionDialog';
import { useUIStore } from '@/stores/uiStore';

export function useDialogManager(
  currentYear: number,
  mutationHandlers?: {
    updateLocation: (location: Location) => Promise<any>;
    addLocation: (location: Location) => Promise<any>;
    updateRegion: (region: Region) => Promise<any>;
    addRegion: (region: Region) => Promise<any>;
  },
  onDeleteLocation?: (location: Location) => void,
  onDeleteRegion?: (region: Region) => void
) {
  // Dialog hooks
  const locationDialog = useLocationDialog(currentYear);
  const regionDialog = useRegionDialog(currentYear);

  // UI store for dialog management
  const { openDialog, closeDialog } = useUIStore();

  // Settings dialog state
  const [showSettings, setShowSettings] = useState(false);

  // Timeline dialog states
  const [timelineEpochDialog, setTimelineEpochDialog] = useState<{
    open: boolean;
    epoch: TimelineEpoch | undefined;
  }>({ open: false, epoch: undefined });

  const [timelineNoteDialog, setTimelineNoteDialog] = useState<{
    open: boolean;
    note: TimelineNote | undefined;
    year: number;
  }>({ open: false, note: undefined, year: 0 });

  // Preview states for immediate visual feedback
  const [previewLocation, setPreviewLocation] =
    useState<Partial<Location> | null>(null);
  const [previewRegion, setPreviewRegion] = useState<Partial<Region> | null>(
    null
  );

  // Settings handlers
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
    openDialog('settings');
  }, [openDialog]);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
    closeDialog('settings');
  }, [closeDialog]);

  // Timeline dialog handlers
  const handleOpenEpochDialog = useCallback((epoch: TimelineEpoch) => {
    setTimelineEpochDialog({ open: true, epoch });
  }, []);

  const handleCloseEpochDialog = useCallback(() => {
    setTimelineEpochDialog({ open: false, epoch: undefined });
  }, []);

  const handleOpenNoteDialog = useCallback(
    (note: TimelineNote, year: number) => {
      setTimelineNoteDialog({ open: true, note, year });
    },
    []
  );

  const handleCloseNoteDialog = useCallback(() => {
    setTimelineNoteDialog({ open: false, note: undefined, year: 0 });
  }, []);

  // Location dialog handlers
  const handleSaveLocation = useCallback(
    async (location: Location) => {
      if (mutationHandlers) {
        if (locationDialog.mode === 'edit') {
          await mutationHandlers.updateLocation(location);
        } else {
          await mutationHandlers.addLocation(location);
        }
        locationDialog.close();
      }
    },
    [mutationHandlers, locationDialog]
  );

  const handleCloseLocation = useCallback(() => {
    locationDialog.close();
    setPreviewLocation(null);
  }, [locationDialog]);

  // Region dialog handlers
  const handleSaveRegion = useCallback(
    async (region: Region) => {
      if (mutationHandlers) {
        if (regionDialog.mode === 'edit') {
          await mutationHandlers.updateRegion(region);
        } else {
          await mutationHandlers.addRegion(region);
        }
        regionDialog.close();
      }
    },
    [mutationHandlers, regionDialog]
  );

  const handleCloseRegion = useCallback(() => {
    regionDialog.close();
    setPreviewRegion(null);
  }, [regionDialog]);

  // Dialog delete handlers
  const handleLocationDelete = useCallback(() => {
    if (onDeleteLocation && locationDialog.location) {
      onDeleteLocation(locationDialog.location as Location);
    }
  }, [onDeleteLocation, locationDialog.location]);

  const handleRegionDelete = useCallback(() => {
    if (onDeleteRegion && regionDialog.region) {
      onDeleteRegion(regionDialog.region as Region);
    }
  }, [onDeleteRegion, regionDialog.region]);

  return {
    // Dialog states
    locationDialog,
    regionDialog,
    showSettings,
    timelineEpochDialog,
    timelineNoteDialog,
    previewLocation,
    previewRegion,

    // Settings handlers
    handleOpenSettings,
    handleCloseSettings,

    // Timeline dialog handlers
    handleOpenEpochDialog,
    handleCloseEpochDialog,
    handleOpenNoteDialog,
    handleCloseNoteDialog,

    // Element dialog handlers
    handleSaveLocation,
    handleCloseLocation,
    handleSaveRegion,
    handleCloseRegion,
    handleLocationDelete,
    handleRegionDelete,

    // Preview handlers
    setPreviewLocation,
    setPreviewRegion,
  };
}
