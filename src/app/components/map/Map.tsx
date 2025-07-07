// External dependencies
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useCallback, useMemo } from 'react';
import '@luomus/leaflet-smooth-wheel-zoom';
import React from 'react';

// Types
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import type { TimelineNote, TimelineEpoch } from '@/types/timeline';

// Constants
import { MAP_CENTER } from '@/constants/map';

// Custom hooks
import { useMapController } from '@/hooks/map/useMapController';
import { useElementManager } from '@/hooks/map/useElementManager';
import { useDialogManager } from '@/hooks/map/useDialogManager';
import { useMoveLocation } from '@/hooks/elements/useMoveLocation';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { useContextMenu } from '@/hooks/ui/useContextMenu';
import {
  usePolygonDraw,
  type DrawingResult,
} from '@/hooks/elements/usePolygonDraw';
import {
  usePanelStack,
  type PanelEntry,
} from '@/app/contexts/PanelStackContext';
import { useSettings } from '@/hooks/useSettings';
import { convertDrawingToPolygonPoints } from '@/app/utils/draw';
import {
  calculateProminenceLevel,
  getOptimalZoomForElement,
} from '@/app/utils/zoom';
import { flyToLocation } from '@/app/utils/fly';
import { getElementCenter } from '@/app/utils/area';
import { useKeyboardShortcuts } from '@/hooks/ui/useKeyboardShortcuts';
import { useDynamicStyles } from '@/hooks/ui/useDynamicStyles';

// Components
import { ContextMenu } from '../ui/ContextMenu';
import { ScaleBar } from '../ui/ScaleBar';
import { ProminenceLevel } from '../ui/ProminenceLevel';
import { MapImage } from './MapImage';
import { MapName } from '../ui/MapName';
import { LocationMarkers } from '../markers/LocationMarkers';
import { RegionMarkers } from '../markers/RegionMarkers';
import { PanelRouter } from '../panels/PanelRouter';
import { MapUI } from './MapUI';
import { MapDialogs } from './MapDialogs';

// Styles
import '@/css/markers/location-label.css';
import '@/css/markers/preview-label.css';
import '@/css/ui/move-mode.css';
import '@/css/ui/timeline-slider.css';
import '@/css/map-ui.css';

export default function Map() {
  // Core map controller
  const { mapRef, setLeafletMap, fitZoom, currentZoom } = useMapController();

  // Element management
  const {
    locations,
    regions,
    mutationHandlers,
    deleteConfirm,
    handleDeleteLocation,
    handleDeleteRegion,
    handleDeleteElement,
    handleDeleteFromTimeline,
    handleDeleteCancel,
  } = useElementManager();

  // Dialog management
  const { currentYear } = useTimelineContext();

  const {
    locationDialog,
    regionDialog,
    showSettings,
    timelineEpochDialog,
    timelineNoteDialog,
    previewLocation,
    previewRegion,
    handleOpenSettings,
    handleCloseSettings,
    handleOpenEpochDialog,
    handleCloseEpochDialog,
    handleOpenNoteDialog,
    handleCloseNoteDialog,
    handleSaveLocation,
    handleCloseLocation,
    handleSaveRegion,
    handleCloseRegion,
    setPreviewLocation,
    setPreviewRegion,
  } = useDialogManager(currentYear, mutationHandlers);

  // Settings
  const { settings } = useSettings();
  const {
    editMode,
    mapImageRoundness,
    showTimelineWhenZoomed,
    showSettingsWhenZoomed,
  } = settings || {};

  // Panel stack
  const { currentPanel, pushPanel, popPanel, clearStack, canGoBack } =
    usePanelStack();

  // Move location functionality
  const { moveMode, handleMoveLocation, resetMoveMode } = useMoveLocation(
    mapRef as React.RefObject<L.Map>,
    mutationHandlers.updateLocation,
    mutationHandlers.addLocation
  );

  // Polygon drawing
  const { isDrawing, currentTool, startDrawing, stopDrawing } = usePolygonDraw(
    mapRef as React.RefObject<L.Map>,
    (result: DrawingResult) => {
      const points = convertDrawingToPolygonPoints(result);
      regionDialog.openCreate(points);
    }
  );

  useKeyboardShortcuts([
    {
      key: 'f',
      metaKey: true,
      action: () => {
        const searchEntry: PanelEntry = {
          id: 'search-panel',
          elementType: 'search',
          metadata: { searchQuery: '' },
        };
        pushPanel(searchEntry);
      },
    },
  ]);

  // Element click handler (inline for reuse)
  const handleElementClick = (element: Location | Region) => {
    const entry: PanelEntry = {
      id: element.id,
      elementType: element.elementType,
      element,
      metadata: {},
    };
    pushPanel(entry);

    if (mapRef.current) {
      const currentProminence = calculateProminenceLevel(
        mapRef.current.getZoom(),
        fitZoom
      );

      if (element.prominence.upper < currentProminence) {
        const targetPosition = getElementCenter(element);
        const targetZoom = getOptimalZoomForElement(
          element.prominence.upper,
          fitZoom
        );
        flyToLocation(mapRef.current, targetPosition, targetZoom);
      }
    }
  };

  // Context menu setup
  const contextMenuProps = useMemo(
    () => ({
      mapRef: mapRef as React.RefObject<L.Map>,
      onAddLocation: (position: [number, number]) => {
        if (mapRef.current) {
          mapRef.current.setView(position, mapRef.current.getZoom());
        }
        locationDialog.openCreate(position);
      },
      onEditLocation: locationDialog.openEdit,
      onMoveLocation: handleMoveLocation,
      onDeleteLocation: handleDeleteLocation,
      onAddRegion: (position: [number, number]) => {
        if (mapRef.current) {
          mapRef.current.setView(position, mapRef.current.getZoom());
        }
        startDrawing();
      },
      onEditRegion: regionDialog.openEdit,
      onDeleteRegion: handleDeleteRegion,
      startDrawing,
      onOpenSettings: handleOpenSettings,
      onEditNote: handleOpenNoteDialog,
      onDeleteNote: (noteId: string) => {
        // This will be handled by timeline context
      },
      onEditEpoch: handleOpenEpochDialog,
      onDeleteEpoch: (epochId: string) => {
        // This will be handled by timeline context
      },
      regions,
      editMode,
    }),
    [
      mapRef,
      locationDialog,
      locationDialog.openCreate,
      locationDialog.openEdit,
      handleMoveLocation,
      handleDeleteLocation,
      startDrawing,
      regionDialog,
      regionDialog.openEdit,
      // region openCreate handled by polygon draw
      handleDeleteRegion,
      regions,
      editMode,
      handleOpenSettings,
      handleOpenNoteDialog,
      handleOpenEpochDialog,
    ]
  );

  const {
    menu,
    handleContextMenu,
    handleLocationContextMenu,
    handleRegionContextMenu,
    closeMenu,
    getMenuItems,
  } = useContextMenu(contextMenuProps);

  const handleTimelineContextMenu = useCallback(
    (
      e: React.MouseEvent,
      type: 'note' | 'epoch',
      element?: TimelineNote | TimelineEpoch
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (!editMode) {
        const syntheticEvent = {
          clientX: e.clientX,
          clientY: e.clientY,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.MouseEvent;
        handleContextMenu(syntheticEvent);
        return;
      }

      if (type === 'note' && element) {
        handleOpenNoteDialog(element as TimelineNote, 0);
      } else if (type === 'epoch' && element) {
        handleOpenEpochDialog(element as TimelineEpoch);
      } else {
        handleContextMenu(e);
      }
    },
    [editMode, handleContextMenu, handleOpenNoteDialog, handleOpenEpochDialog]
  );

  // Dynamic styles
  useDynamicStyles([
    {
      id: 'dynamic-map-roundness',
      css: `.leaflet-image-layer { border-radius: ${mapImageRoundness / 2}% !important; }`,
    },
  ]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      onContextMenu={handleContextMenu}
    >
      {/* Map UI Overlay */}
      <MapUI
        isDrawing={isDrawing}
        currentTool={currentTool}
        onDrawingCancel={stopDrawing}
        showSettings={showSettings}
        onOpenSettings={handleOpenSettings}
        onCloseSettings={handleCloseSettings}
        currentZoom={currentZoom}
        fitZoom={fitZoom}
        showTimelineWhenZoomed={showTimelineWhenZoomed}
        showSettingsWhenZoomed={showSettingsWhenZoomed}
        onTimelineContextMenu={handleTimelineContextMenu}
        onOpenEpochDialog={handleOpenEpochDialog}
        onOpenNoteDialog={handleOpenNoteDialog}
      />

      {/* Map Container */}
      <MapContainer
        center={MAP_CENTER}
        zoom={fitZoom}
        minZoom={fitZoom}
        maxZoom={2}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef as React.RefObject<L.Map>}
        crs={L.CRS.Simple}
        zoomControl={true}
        preferCanvas={true}
        renderer={L.canvas()}
        scrollWheelZoom={false}
        whenReady={
          ((event: { target: L.Map }) => setLeafletMap(event.target)) as any
        }
      >
        <ScaleBar />
        <ProminenceLevel />
        <MapImage />
        <MapName />
        <RegionMarkers
          regions={regions}
          currentZoom={currentZoom}
          fitZoom={fitZoom}
          onContextMenu={(e, type, region) =>
            type === 'marker' && region
              ? handleRegionContextMenu(e, region)
              : handleContextMenu(e)
          }
          onElementClick={handleElementClick}
          currentPanel={currentPanel}
          panelWidth={450}
          previewRegionId={previewRegion?.id || null}
        />
        <LocationMarkers
          locations={locations}
          regions={regions}
          fitZoom={fitZoom}
          onContextMenu={(e, type, location) =>
            type === 'marker' && location
              ? handleLocationContextMenu(e, location)
              : handleContextMenu(e)
          }
          onElementClick={handleElementClick}
          currentPanel={currentPanel}
          panelWidth={450}
          previewLocationId={previewLocation?.id || null}
        />
      </MapContainer>

      {/* Panel Router */}
      {currentPanel && (
        <PanelRouter
          entry={currentPanel}
          onClose={clearStack}
          onBack={canGoBack ? popPanel : undefined}
          onElementClick={handleElementClick}
        />
      )}

      {/* Context Menu */}
      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        onClose={() => {
          closeMenu();
          if (moveMode && menu.type !== 'marker') {
            resetMoveMode();
          }
        }}
        items={getMenuItems()}
      />

      {/* All Dialogs */}
      <MapDialogs
        locationDialog={locationDialog}
        regionDialog={regionDialog}
        onSaveLocation={handleSaveLocation}
        onSaveRegion={handleSaveRegion}
        onCloseLocation={handleCloseLocation}
        onCloseRegion={handleCloseRegion}
        onDeleteLocation={handleDeleteLocation}
        onDeleteRegion={handleDeleteRegion}
        previewLocation={previewLocation}
        previewRegion={previewRegion}
        onPreviewLocationChange={setPreviewLocation}
        onPreviewRegionChange={setPreviewRegion}
        deleteConfirm={deleteConfirm}
        onDeleteElement={handleDeleteElement}
        onDeleteFromTimeline={handleDeleteFromTimeline}
        onDeleteCancel={handleDeleteCancel}
        timelineEpochDialog={timelineEpochDialog}
        timelineNoteDialog={timelineNoteDialog}
        onCloseEpochDialog={handleCloseEpochDialog}
        onCloseNoteDialog={handleCloseNoteDialog}
        mapRef={mapRef}
      />
    </div>
  );
}
