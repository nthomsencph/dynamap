// External dependencies
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import '@luomus/leaflet-smooth-wheel-zoom';
import React from "react";

// Types
import type { Location } from "@/types/locations";
import type { Region } from "@/types/regions";

// Constants
import { MAP_CENTER } from '@/constants/map';

// Utils
import { shouldShowElement } from '@/app/utils/zoom';

// Hooks
import { useFitZoom } from "@/hooks/view/useFitZoom";
import { useSmoothWheelZoom } from "@/hooks/view/useSmoothWheelZoom";
import { useMoveLocation } from "@/hooks/elements/useMoveLocation";
import { useLocationDialog } from "@/hooks/dialogs/useLocationDialog";
import { useRegionDialog } from "@/hooks/dialogs/useRegionDialog";
import { useLocations } from "@/hooks/elements/useLocations";
import { useRegions } from "@/hooks/elements/useRegions";
import { useContextMenu } from "@/hooks/ui/useContextMenu";
import { usePolygonDraw } from "@/hooks/elements/usePolygonDraw";
import { usePanelStack, type PanelEntry } from "@/hooks/ui/usePanelStack";
import { useLabelCollisionHandling } from "@/hooks/ui/useLabelCollisionHandling";

// Components
import { ContextMenu } from "../ui/ContextMenu";
import { ScaleBar } from '../ui/ScaleBar';
import { ProminenceLevel } from '../ui/ProminenceLevel';
import { LocationDialog } from "../dialogs/LocationDialog";
import { RegionDialog } from "../dialogs/RegionDialog";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { MapImage } from "./MapImage";
import { LocationMarkers } from "../markers/LocationMarkers";
import { RegionMarkers } from "../markers/RegionMarkers";
import { UnifiedPanel } from "../panels/UnifiedPanel";

// Styles
import '@/css/markers/location-label.css';
import '@/css/ui/move-mode.css';

export default function Map() {
    const mapRef = useRef<L.Map | null>(null);
    const fitZoom = useFitZoom();
    useSmoothWheelZoom(mapRef, 2);

    // Hooks for locations and regions
    const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
    const { regions, addRegion, updateRegion, deleteRegion } = useRegions();
    const locationDialog = useLocationDialog();
    const regionDialog = useRegionDialog();
    
    // Unified panel stack
    const { currentPanel, pushPanel, popPanel, clearStack, canGoBack } = usePanelStack();
    
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
    const handlePolygonComplete = useCallback((points: [number, number][]) => {
        // When polygon drawing is complete, open the region dialog
        regionDialog.openCreate(points);
    }, [regionDialog.openCreate]);

    // Polygon drawing hook
    const { startDrawing } = usePolygonDraw(
        mapRef as React.RefObject<L.Map>,
        handlePolygonComplete
    );

    // State for delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ 
        open: boolean; 
        type: 'location' | 'region';
        element: Location | Region | null;
    }>({
        open: false,
        type: 'location',
        element: null
    });

    // Panel navigation handlers
    const handleElementClick = useCallback((element: Location | Region) => {
        const elementType = Array.isArray(element.position[0]) ? 'region' : 'location';
        const entry: PanelEntry = {
            id: element.id,
            elementType,
            element,
            metadata: elementType === 'region' ? {
                containingRegions: (element as any).containingRegions,
                regionToDisplay: (element as any).regionToDisplay
            } : {
                containingRegions: (element as any).containingRegions
            }
        };
        pushPanel(entry);
    }, [pushPanel]);

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
        startDrawing();
    }, [startDrawing]);

    const handleEditLocation = useCallback((location: Location) => {
        locationDialog.openEdit(location);
    }, [locationDialog.openEdit]);

    const handleEditRegion = useCallback((region: Region) => {
        regionDialog.openEdit(region);
    }, [regionDialog.openEdit]);

    const handleDeleteLocation = useCallback((location: Location) => {
        setDeleteConfirm({ open: true, type: 'location', element: location });
    }, []);

    const handleDeleteRegion = useCallback((region: Region) => {
        setDeleteConfirm({ open: true, type: 'region', element: region });
    }, []);

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
    }), [
        handleAddLocation,
        handleEditLocation,
        handleMoveLocation,
        handleDeleteLocation,
        handleAddRegion,
        handleEditRegion,
        handleDeleteRegion,
        startDrawing
    ]);

    // Context menu state and handlers
    const { menu, handleContextMenu, handleLocationContextMenu, handleRegionContextMenu, closeMenu, getMenuItems } = useContextMenu(contextMenuProps);

    // Memoized context menu handlers for markers
    const handleLocationMarkersContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'map' | 'marker', location?: Location) => {
        return type === 'marker' && location ? handleLocationContextMenu(e, location) : handleContextMenu(e);
    }, [handleLocationContextMenu, handleContextMenu]);

    const handleRegionMarkersContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'map' | 'marker', region?: Region) => {
        return type === 'marker' && region ? handleRegionContextMenu(e, region) : handleContextMenu(e);
    }, [handleRegionContextMenu, handleContextMenu]);

    // Zoom state - use debounced updates to prevent excessive re-renders
    const [currentZoom, setCurrentZoom] = useState(fitZoom);
    const [isZooming, setIsZooming] = useState(false);
    const zoomTimeoutRef = useRef<number | undefined>(undefined);

    // Get elements that have collision strategies (for collision detection)
    const visibleElements = useMemo(() => {
        const elementsWithStrategies = [...locations, ...regions].filter(el => 
            el.labelCollisionStrategy && el.labelCollisionStrategy !== 'None'
        );
        return elementsWithStrategies;
    }, [locations, regions]);

    // Unified collision handling for all elements (only when map is available)
    useLabelCollisionHandling(visibleElements, mapRef.current!, isZooming);

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
        setDeleteConfirm({ open: false, type: 'location', element: null });
    }, [deleteConfirm.element, deleteConfirm.type, deleteLocation, deleteRegion]);

    // Memoize dialog delete handlers
    const handleLocationDelete = useCallback(() => {
        if (locationDialog.location) {
            setDeleteConfirm({ 
                open: true, 
                type: 'location', 
                element: locationDialog.location as Location 
            });
        }
    }, [locationDialog.location]);

    const handleRegionDelete = useCallback(() => {
        if (regionDialog.region) {
            setDeleteConfirm({ 
                open: true, 
                type: 'region', 
                element: regionDialog.region as Region 
            });
        }
    }, [regionDialog.region]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirm({ open: false, type: 'location', element: null });
    }, []);

    // Zoom effect - debounced to prevent excessive re-renders
    useEffect(() => {
        const map = mapRef.current;
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
        };

        const onMove = () => {
            const center = map.getCenter();
        };

        const onMoveStart = () => {
        };

        const onMoveEnd = () => {
            const center = map.getCenter();
        };

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
    }, []);

    return (
        <div 
            style={{ width: '100vw', height: '100vh', position: 'relative' }} 
            onContextMenu={handleContextMenu}
        >
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
            >
                <ScaleBar />
                <ProminenceLevel />
                <MapImage />
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
            />
        </div>
    );
}
  