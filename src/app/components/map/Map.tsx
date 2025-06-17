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

// Hooks
import { useFitZoom } from "@/hooks/view/useFitZoom";
import { useSmoothWheelZoom } from "@/hooks/view/useSmoothWheelZoom";
import { useSearchPanelZoom } from "@/hooks/view/useSearchPanelZoom";
import { useMoveLocation } from "@/hooks/elements/useMoveLocation";
import { useLocationDialog } from "@/hooks/dialogs/useLocationDialog";
import { useRegionDialog } from "@/hooks/dialogs/useRegionDialog";
import { useLocations } from "@/hooks/elements/useLocations";
import { useRegions } from "@/hooks/elements/useRegions";
import { useContextMenu } from "@/hooks/ui/useContextMenu";
import { usePolygonDraw, type DrawingTool, type DrawingResult } from "@/hooks/elements/usePolygonDraw";
import { usePanelStack, type PanelEntry } from "@/hooks/ui/usePanelStack";

// Components
import { ContextMenu } from "../ui/ContextMenu";
import { ScaleBar } from '../ui/ScaleBar';
import { ProminenceLevel } from '../ui/ProminenceLevel';
import { DrawingModeBanner } from '../ui/DrawingModeBanner';
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
        let points: [number, number][] = result.points;
        if (result.type === 'rectangle' && result.bounds) {
            // Rectangle: convert bounds to 4 corners (SW, NW, NE, SE, SW)
            const [[swLat, swLng], [neLat, neLng]] = result.bounds;
            points = [
                [swLat, swLng], // SW
                [neLat, swLng], // NW
                [neLat, neLng], // NE
                [swLat, neLng], // SE
                [swLat, swLng], // Close polygon
            ];
        } else if (result.type === 'circle' && result.center && result.radius) {
            // Circle: approximate as 32-point polygon
            const numPoints = 32;
            const [centerLat, centerLng] = result.center;
            const radius = result.radius;
            points = Array.from({ length: numPoints }, (_, i) => {
                const angle = (2 * Math.PI * i) / numPoints;
                // Approximate: 1 deg lat ~ 111km, 1 deg lng ~ 111km * cos(lat)
                // But here, just use radius in degrees for simplicity (works for small circles)
                const dLat = (radius / 111000) * Math.cos(angle); // meters to degrees
                const dLng = (radius / (111000 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
                return [centerLat + dLat, centerLng + dLng] as [number, number];
            });
            // Close polygon
            points.push(points[0]);
        }
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
    }>({
        open: false,
        type: 'location',
        element: null
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
        regions: regions,
    }), [
        handleAddLocation,
        handleEditLocation,
        handleMoveLocation,
        handleDeleteLocation,
        handleAddRegion,
        handleEditRegion,
        handleDeleteRegion,
        startDrawing,
        regions
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
            {/* Drawing Mode Banner */}
            <DrawingModeBanner
                isVisible={isDrawing}
                currentTool={currentTool}
                onCancel={handleDrawingCancel}
            />

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
            />
        </div>
    );
}
  