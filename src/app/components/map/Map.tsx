// External dependencies
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import '@luomus/leaflet-smooth-wheel-zoom';
import React from "react";
import { FaCog } from 'react-icons/fa';

// Types
import type { Location } from "@/types/locations";
import type { Region } from "@/types/regions";
import type { TimelineNote, TimelineEpoch } from "@/types/timeline";

// Constants
import { MAP_CENTER } from '@/constants/map';

// Hooks
import { useFitZoom } from "@/hooks/view/useFitZoom";
import { useSmoothWheelZoom } from "@/hooks/view/useSmoothWheelZoom";
import { useSearchPanelZoom } from "@/hooks/view/useSearchPanelZoom";
import { useMoveLocation } from "@/hooks/elements/useMoveLocation";
import { useLocationDialog } from "@/hooks/dialogs/useLocationDialog";
import { useRegionDialog } from "@/hooks/dialogs/useRegionDialog";
import { useLocations } from "@/hooks/elements/useLocations";
import { useRegions } from "@/hooks/elements/useRegions";
import { useTimelineContext } from "@/contexts/TimelineContext";
import { useContextMenu } from "@/hooks/ui/useContextMenu";
import { usePolygonDraw, type DrawingTool, type DrawingResult } from "@/hooks/elements/usePolygonDraw";
import { usePanelStack, type PanelEntry } from "@/hooks/ui/usePanelStack";
import { useMapSettings } from './MapSettingsContext';
import { convertDrawingToPolygonPoints } from "@/app/utils/draw";
import { useImageBounds } from '@/hooks/ui/useImageBounds';
import { shouldShowElementInYear } from '@/app/utils/zoom';
import { getFutureChangesForElement } from '@/app/utils/timeline-changes';

// Components
import { ContextMenu } from "../ui/ContextMenu";
import { ScaleBar } from '../ui/ScaleBar';
import { ProminenceLevel } from '../ui/ProminenceLevel';
import { DrawingModeBanner } from '../ui/DrawingModeBanner';
import { LocationDialog } from "../dialogs/LocationDialog";
import { RegionDialog } from "../dialogs/RegionDialog";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { MapImage } from "./MapImage";
import { MapName } from "../ui/MapName";
import { LocationMarkers } from "../markers/LocationMarkers";
import { RegionMarkers } from "../markers/RegionMarkers";
import { UnifiedPanel } from "../panels/UnifiedPanel";
import { GeneralSettingsDialog } from '../dialogs/SettingsDialog';
import { TimelineIcon } from '../timeline/TimelineIcon';
import { EpochDialog } from '../dialogs/EpochDialog';
import { NoteDialog } from '../dialogs/NoteDialog';

// Styles
import '@/css/markers/location-label.css';
import '@/css/ui/move-mode.css';
import '@/css/ui/timeline-slider.css';
import '@/css/map-ui.css';

export default function Map() {
    const mapRef = useRef<L.Map | null>(null);
    const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
    const fitZoom = useFitZoom();
    useSmoothWheelZoom(mapRef, 2);

    // Timeline hook for current year
    const { currentYear, entries, epochs } = useTimelineContext();

    // Hooks for locations and regions
    const { locations, addLocation, updateLocation, deleteLocation, deleteLocationFromTimeline } = useLocations(currentYear);
    const { regions, addRegion, updateRegion, deleteRegion, deleteRegionFromTimeline } = useRegions(currentYear);

    // hooks for dialogs
    const locationDialog = useLocationDialog(currentYear);
    const regionDialog = useRegionDialog(currentYear);
    
    // Map settings
    const { editMode, mapImageRoundness, mapImage, mapImageSettings, showTimelineWhenZoomed, showSettingsWhenZoomed } = useMapSettings();
    
    // Unified panel stack
    const { currentPanel, pushPanel, popPanel, clearStack, canGoBack } = usePanelStack();
    
    // Search panel zoom functionality
    const { handleSearchElementClick } = useSearchPanelZoom({ 
        mapRef, 
        fitZoom, 
        pushPanel 
    });
    
    // Memoize the move location handlers to prevent re-renders
    const moveLocationHandlers = useMemo(() => ({
        updateLocation,
        addLocation
    }), [updateLocation, addLocation]);
    
    const { moveMode, handleMoveLocation, resetMoveMode } = useMoveLocation(
        mapRef as React.RefObject<L.Map>,
        moveLocationHandlers.updateLocation,
        moveLocationHandlers.addLocation
    );

    // Memoize the polygon draw callback to prevent re-renders
    const handlePolygonComplete = useCallback((result: DrawingResult) => {
        const points = convertDrawingToPolygonPoints(result);
        // When drawing is complete, open the region dialog with the polygon points
        regionDialog.openCreate(points);
    }, [regionDialog.openCreate]);

    // Polygon drawing hook
    const { isDrawing, currentTool, startDrawing, stopDrawing } = usePolygonDraw(
        mapRef as React.RefObject<L.Map>,
        handlePolygonComplete
    );

    // State for delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ 
        open: boolean; 
        type: 'location' | 'region';
        element: Location | Region | null;
        mode: 'normal' | 'timeline';
        warning?: string;
    }>({
        open: false,
        type: 'location',
        element: null,
        mode: 'normal'
    });

    // Panel navigation handlers
    const handleElementClick = useCallback((element: Location | Region) => {
        const entry: PanelEntry = {
            id: element.id,
            elementType: element.elementType,
            element,
            metadata: element.elementType === 'region' ? {
                containingRegions: (element as any).containingRegions,
                regionToDisplay: (element as any).regionToDisplay
            } : {
                containingRegions: (element as any).containingRegions
            }
        };
        pushPanel(entry);
    }, [pushPanel]);

    // Handle opening search panel
    const handleOpenSearch = useCallback(() => {
        const searchEntry: PanelEntry = {
            id: 'search-panel',
            elementType: 'search',
            metadata: {
                searchQuery: ''
            }
        };
        pushPanel(searchEntry);
    }, [pushPanel]);

    // Handle keyboard shortcuts for search panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for CMD+F (Mac) or CTRL+F (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault(); // Prevent browser's find functionality
                e.stopPropagation();
                handleOpenSearch();
            }
        };

        // Add event listener with capture to ensure we catch it before the browser
        document.addEventListener('keydown', handleKeyDown, true);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [handleOpenSearch]);

    const handlePanelClose = useCallback(() => {
        clearStack();
    }, [clearStack]);

    const handlePanelBack = useCallback(() => {
        popPanel();
    }, [popPanel]);

    // Context menu handlers - memoized to prevent re-renders
    const handleAddLocation = useCallback((position: [number, number]) => {
        // Center the map and open location dialog
        if (mapRef.current) {
            mapRef.current.setView(position, mapRef.current.getZoom());
        }
        locationDialog.openCreate(position);
    }, [locationDialog.openCreate]);

    const handleAddRegion = useCallback((position: [number, number]) => {
        // Center the map and start drawing
        if (mapRef.current) {
            mapRef.current.setView(position, mapRef.current.getZoom());
        }
        startDrawing(); // No argument
    }, [startDrawing]);

    // Handle drawing cancellation
    const handleDrawingCancel = useCallback(() => {
        stopDrawing();
    }, [stopDrawing]);

    const handleEditLocation = useCallback((location: Location) => {
        locationDialog.openEdit(location);
    }, [locationDialog.openEdit]);

    const handleEditRegion = useCallback((region: Region) => {
        regionDialog.openEdit(region);
    }, [regionDialog.openEdit]);

    const handleDeleteLocation = useCallback((location: Location) => {
        const { hasChanges, years } = getFutureChangesForElement(
            location.id,
            'location',
            currentYear,
            entries,
            epochs
        );
        
        const warning = hasChanges 
            ? `This element has changes later in the timeline: (${years.join(', ')})`
            : undefined;

        setDeleteConfirm({ 
            open: true, 
            type: 'location', 
            element: location,
            mode: 'normal',
            warning
        });
    }, [currentYear, entries, epochs]);

    const handleDeleteRegion = useCallback((region: Region) => {
        const { hasChanges, years } = getFutureChangesForElement(
            region.id,
            'region',
            currentYear,
            entries,
            epochs
        );
        
        const warning = hasChanges 
            ? `This element has changes later in the timeline: (${years.join(', ')})`
            : undefined;

        setDeleteConfirm({ 
            open: true, 
            type: 'region', 
            element: region,
            mode: 'normal',
            warning
        });
    }, [currentYear, entries, epochs]);

    // Memoize context menu props to prevent re-renders
    const contextMenuProps = useMemo(() => ({
        mapRef: mapRef as React.RefObject<L.Map>,
        onAddLocation: handleAddLocation,
        onEditLocation: handleEditLocation,
        onMoveLocation: handleMoveLocation,
        onDeleteLocation: handleDeleteLocation,
        onAddRegion: handleAddRegion,
        onEditRegion: handleEditRegion,
        onDeleteRegion: handleDeleteRegion,
        startDrawing: startDrawing,
        regions: regions,
        editMode: editMode,
        onOpenSettings: () => setShowSettings(true),
        // Timeline-specific handlers
        onEditNote: (note: TimelineNote, year: number) => {
            setTimelineNoteDialog({ open: true, note, year });
        },
        onDeleteNote: (noteId: string) => {
            // This would need to be implemented to delete the note
            console.log('Delete note:', noteId);
        },
        onEditEpoch: (epoch: TimelineEpoch) => {
            setTimelineEpochDialog({ open: true, epoch });
        },
        onDeleteEpoch: (epochId: string) => {
            // This would need to be implemented to delete the epoch
            console.log('Delete epoch:', epochId);
        },
    }), [
        handleAddLocation,
        handleEditLocation,
        handleMoveLocation,
        handleDeleteLocation,
        handleAddRegion,
        handleEditRegion,
        handleDeleteRegion,
        startDrawing,
        regions,
        editMode
    ]);

    // Context menu state and handlers
    const { menu, handleContextMenu, handleLocationContextMenu, handleRegionContextMenu, handleNoteContextMenu, handleEpochContextMenu, closeMenu, getMenuItems } = useContextMenu(contextMenuProps);

    // Memoized context menu handlers for markers
    const handleLocationMarkersContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'map' | 'marker', location?: Location) => {
        return type === 'marker' && location ? handleLocationContextMenu(e, location) : handleContextMenu(e);
    }, [handleLocationContextMenu, handleContextMenu]);

    const handleRegionMarkersContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'map' | 'marker', region?: Region) => {
        return type === 'marker' && region ? handleRegionContextMenu(e, region) : handleContextMenu(e);
    }, [handleRegionContextMenu, handleContextMenu]);

    // Timeline context menu handler
    const handleTimelineContextMenu = useCallback((e: React.MouseEvent, type: 'note' | 'epoch', element?: TimelineNote | TimelineEpoch) => {
        e.preventDefault();
        e.stopPropagation();
        
        // If edit mode is disabled, show helpful message
        if (!editMode) {
            // Create a synthetic event that handleContextMenu can use
            const syntheticEvent = {
                clientX: e.clientX,
                clientY: e.clientY,
                preventDefault: () => {},
                stopPropagation: () => {}
            } as React.MouseEvent;
            handleContextMenu(syntheticEvent);
            return;
        }
        
        // Use the appropriate timeline-specific handler
        if (type === 'note' && element) {
            handleNoteContextMenu(e, element as TimelineNote);
        } else if (type === 'epoch' && element) {
            handleEpochContextMenu(e, element as TimelineEpoch);
        } else {
            // Fallback to general context menu
            handleContextMenu(e);
        }
    }, [editMode, handleContextMenu, handleNoteContextMenu, handleEpochContextMenu]);

    // Zoom state - use debounced updates to prevent excessive re-renders
    const [currentZoom, setCurrentZoom] = useState(fitZoom);
    const [isZooming, setIsZooming] = useState(false);
    const zoomTimeoutRef = useRef<number | undefined>(undefined);

    // Save handlers for dialogs - memoized to prevent re-renders
    const handleSaveLocation = useCallback(async (location: Location) => {
        if (locationDialog.mode === 'edit') {
            await updateLocation(location);
        } else {
            await addLocation(location);
        }
        locationDialog.close();
    }, [locationDialog.mode, locationDialog.close, updateLocation, addLocation]);

    const handleSaveRegion = useCallback(async (region: Region) => {
        if (regionDialog.mode === 'edit') {
            await updateRegion(region);
        } else {
            await addRegion(region);
        }
        regionDialog.close();
    }, [regionDialog.mode, regionDialog.close, updateRegion, addRegion]);

    // Handle delete element - memoized to prevent re-renders
    const handleDeleteElement = useCallback(async () => {
        if (!deleteConfirm.element) return;

        if (deleteConfirm.type === 'location') {
            await deleteLocation(deleteConfirm.element.id);
        } else {
            await deleteRegion(deleteConfirm.element.id);
        }
        setDeleteConfirm({ open: false, type: 'location', element: null, mode: 'normal' });
    }, [deleteConfirm.element, deleteConfirm.type, deleteLocation, deleteRegion]);

    // Handle delete element from timeline - memoized to prevent re-renders
    const handleDeleteFromTimeline = useCallback(async () => {
        if (!deleteConfirm.element) return;

        if (deleteConfirm.type === 'location') {
            await deleteLocationFromTimeline(deleteConfirm.element.id);
        } else {
            await deleteRegionFromTimeline(deleteConfirm.element.id);
        }
        setDeleteConfirm({ open: false, type: 'location', element: null, mode: 'normal' });
    }, [deleteConfirm.element, deleteConfirm.type, deleteLocationFromTimeline, deleteRegionFromTimeline]);

    // Memoize dialog delete handlers
    const handleLocationDelete = useCallback(() => {
        const location = locationDialog.location;
        if (location?.id) {
            const { hasChanges, years } = getFutureChangesForElement(
                location.id,
                'location',
                currentYear,
                entries,
                epochs
            );
            
            const warning = hasChanges 
                ? `This element has changes later in the timeline: (${years.join(', ')})`
                : undefined;

            setDeleteConfirm({ 
                open: true, 
                type: 'location', 
                element: location as Location,
                mode: 'normal',
                warning
            });
        }
    }, [locationDialog.location, currentYear, entries, epochs]);

    const handleRegionDelete = useCallback(() => {
        const region = regionDialog.region;
        if (region?.id) {
            const { hasChanges, years } = getFutureChangesForElement(
                region.id,
                'region',
                currentYear,
                entries,
                epochs
            );
            
            const warning = hasChanges 
                ? `This element has changes later in the timeline: (${years.join(', ')})`
                : undefined;

            setDeleteConfirm({ 
                open: true, 
                type: 'region', 
                element: region as Region,
                mode: 'normal',
                warning
            });
        }
    }, [regionDialog.region, currentYear, entries, epochs]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirm({ open: false, type: 'location', element: null, mode: 'normal' });
    }, []);

    // Zoom effect - debounced to prevent excessive re-renders
    useEffect(() => {
        const map = leafletMap;
        if (!map) return;

        const onZoomStart = () => {
            setIsZooming(true);
        };

        const onZoom = () => {
            const newZoom = map.getZoom();
            // Clear existing timeout
            if (zoomTimeoutRef.current) {
                clearTimeout(zoomTimeoutRef.current);
            }
            // Debounce zoom updates
            zoomTimeoutRef.current = setTimeout(() => {
                setCurrentZoom(newZoom);
            }, 100) as unknown as number; // 100ms debounce
        };

        const onZoomEnd = () => {
            setIsZooming(false);
            // If at minimum zoom (within threshold), smoothly recenter to MAP_CENTER if not already there
            const zoomThreshold = 0.05;
            if (Math.abs(map.getZoom() - fitZoom) < zoomThreshold) {
                const threshold = 1e-6;
                if (
                    Math.abs(map.getCenter().lat - MAP_CENTER[0]) > threshold ||
                    Math.abs(map.getCenter().lng - MAP_CENTER[1]) > threshold
                ) {
                    map.flyTo(MAP_CENTER, fitZoom, { animate: true, duration: 1 });
                }
            }
        };

        const onMove = () => {
            const center = map.getCenter();
        };

        const onMoveStart = () => {};
        const onMoveEnd = () => {};

        map.on('zoomstart', onZoomStart);
        map.on('zoom', onZoom);
        map.on('zoomend', onZoomEnd);
        map.on('move', onMove);
        map.on('movestart', onMoveStart);
        map.on('moveend', onMoveEnd);
        // Set initial zoom
        setCurrentZoom(map.getZoom());

        return () => {
            map.off('zoomstart', onZoomStart);
            map.off('zoom', onZoom);
            map.off('zoomend', onZoomEnd);
            map.off('move', onMove);
            map.off('movestart', onMoveStart);
            map.off('moveend', onMoveEnd);
            // Clear timeout on cleanup
            if (zoomTimeoutRef.current) {
                clearTimeout(zoomTimeoutRef.current);
            }
        };
    }, [fitZoom, leafletMap]);

    const [showSettings, setShowSettings] = useState(false);

    // Timeline dialog state
    const [timelineEpochDialog, setTimelineEpochDialog] = useState<{
        open: boolean;
        epoch: TimelineEpoch | undefined;
    }>({ open: false, epoch: undefined });

    const [timelineNoteDialog, setTimelineNoteDialog] = useState<{
        open: boolean;
        note: TimelineNote | undefined;
        year: number;
    }>({ open: false, note: undefined, year: 0 });

    useEffect(() => {
        const percent = mapImageRoundness / 2;
        const style = document.createElement('style');
        style.id = 'dynamic-map-roundness';
        style.innerHTML = `.leaflet-image-layer { border-radius: ${percent}% !important; }`;
        const prev = document.getElementById('dynamic-map-roundness');
        if (prev) prev.remove();
        document.head.appendChild(style);
        return () => { style.remove(); };
    }, [mapImageRoundness]);

    return (
        <div 
            style={{ width: '100vw', height: '100vh', position: 'relative' }} 
            onContextMenu={handleContextMenu}
        >
            {/* Drawing Mode Banner */}
            <DrawingModeBanner
                isVisible={isDrawing}
                currentTool={currentTool}
                onCancel={handleDrawingCancel}
            />

            {/* Settings Icon Button - Show based on zoom settings */}
            {(currentZoom === fitZoom || showSettingsWhenZoomed) && (
                <button
                    className="settings-fab"
                    onClick={() => setShowSettings(true)}
                    title="General settings"
                >
                    <FaCog size={16} />
                </button>
            )}

            {/* Timeline Button - Show based on zoom settings */}
            {(currentZoom === fitZoom || showTimelineWhenZoomed) && (
                <TimelineIcon 
                    onOpenSettings={() => setShowSettings(true)} 
                    onContextMenu={handleTimelineContextMenu}
                    onOpenEpochDialog={(epoch) => setTimelineEpochDialog({ open: true, epoch })}
                    onOpenNoteDialog={(note, year) => setTimelineNoteDialog({ open: true, note, year })}
                />
            )}

            {showSettings && (
                <GeneralSettingsDialog onClose={() => setShowSettings(false)} />
            )}

            <MapContainer
                center={MAP_CENTER}
                zoom={fitZoom}
                minZoom={fitZoom}
                maxZoom={2}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef as React.RefObject<L.Map>}
                crs={L.CRS.Simple}
                zoomControl={true}
                preferCanvas={true}
                renderer={L.canvas()}
                scrollWheelZoom={false}
                whenReady={((event: { target: L.Map }) => setLeafletMap(event.target)) as any}
            >
                <ScaleBar />
                <ProminenceLevel />
                <MapImage />
                <MapName />
                <RegionMarkers
                    regions={regions}
                    currentZoom={currentZoom}
                    fitZoom={fitZoom}
                    onContextMenu={handleRegionMarkersContextMenu}
                    onElementClick={handleElementClick}
                    currentPanel={currentPanel}
                    panelWidth={450}
                />
                <LocationMarkers
                    locations={locations}
                    regions={regions}
                    fitZoom={fitZoom}
                    onContextMenu={handleLocationMarkersContextMenu}
                    onElementClick={handleElementClick}
                    currentPanel={currentPanel}
                    panelWidth={450}
                />
            </MapContainer>

            {/* Unified Panel */}
            {currentPanel && (
                <UnifiedPanel
                    entry={currentPanel}
                    onClose={handlePanelClose}
                    onBack={canGoBack ? handlePanelBack : undefined}
                    onElementClick={handleElementClick}
                    onSearchElementClick={handleSearchElementClick}
                    locations={locations}
                    regions={regions}
                />
            )}

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

            <LocationDialog
                open={locationDialog.open}
                mode={locationDialog.mode}
                location={locationDialog.location}
                onSave={handleSaveLocation}
                onClose={locationDialog.close}
                onDelete={handleLocationDelete}
            />

            <RegionDialog
                open={regionDialog.open}
                mode={regionDialog.mode}
                region={regionDialog.region as Region | undefined}
                position={regionDialog.position || undefined}
                map={mapRef.current!}
                onSave={handleSaveRegion}
                onClose={regionDialog.close}
                onDelete={handleRegionDelete}
            />

            <ConfirmDialog
                open={deleteConfirm.open}
                title={`Delete ${deleteConfirm.type === 'location' ? 'Location' : 'Region'}`}
                message={`Are you sure you want to delete "${deleteConfirm.element?.name}"?`}
                onConfirm={handleDeleteElement}
                onCancel={handleDeleteCancel}
                onDeleteFromTimeline={handleDeleteFromTimeline}
                showDeleteFromTimeline={true}
                warning={deleteConfirm.warning}
            />

            {/* Timeline Dialogs */}
            <EpochDialog
                isOpen={timelineEpochDialog.open}
                mode="edit"
                epoch={timelineEpochDialog.epoch}
                onClose={() => setTimelineEpochDialog({ open: false, epoch: undefined })}
            />

            <NoteDialog
                noteId={timelineNoteDialog.note?.id || null}
                isOpen={timelineNoteDialog.open}
                onClose={() => setTimelineNoteDialog({ open: false, note: undefined, year: 0 })}
            />
        </div>
    );
}
