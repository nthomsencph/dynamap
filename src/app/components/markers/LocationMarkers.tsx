import React, { useCallback, useEffect, useState } from 'react';
import { Marker, useMap } from "react-leaflet";
import L from 'leaflet';
import type { Location } from "@/types/locations";
import type { Region } from "@/types/regions";
import { createLocationIcon, createLocationLabelDivIcon } from '@/app/utils/map-icons';
import { findContainingRegions } from '@/app/utils/containment';
import { ElementMarkers, MarkerErrorBoundary } from './ElementMarkers';
import type { PanelEntry } from '@/hooks/ui/usePanelStack';

interface LocationMarkersProps {
  locations: Location[];
  regions: Region[];
  fitZoom: number;
  onContextMenu: (e: L.LeafletMouseEvent, type: 'map' | 'marker', location?: Location) => void;
  onElementClick?: (element: Location | Region) => void;
  currentPanel?: PanelEntry | null;
  panelWidth?: number;
}

function LocationMarkersComponent({ 
  locations, 
  regions,
  fitZoom,
  onContextMenu,
  onElementClick,
  currentPanel,
  panelWidth = 450
}: LocationMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => {
      const newZoom = map.getZoom();
      setZoom(newZoom);
    };
    map.on('zoom', onZoom);
    setZoom(map.getZoom());
    return () => {
      map.off('zoom', onZoom);
    };
  }, [map]);

  const handleLocationClick = useCallback((location: Location) => {
    // Find all regions containing this location
    const allContainingRegions = findContainingRegions(location.position, regions);
    
    console.log('🔍 Location click debug:', {
      locationId: location.id,
      locationName: location.name,
      locationPosition: location.position,
      allContainingRegionsCount: allContainingRegions.length,
      allContainingRegions: allContainingRegions.map(r => ({
        id: r.id,
        name: r.name,
        area: r.area,
        type: r.type
      }))
    });
    
    if (onElementClick) {
      onElementClick(location);
    }
  }, [onElementClick, regions]);

  const handleContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'marker' | 'map', location?: Location) => {
    onContextMenu(e, type, location);
  }, [onContextMenu]);

  // Render marker with label as a React element (not just in icon)
  const renderLocationMarker = useCallback((location: Location, opts: {
    onClick: () => void;
    onContextMenu: (e: L.LeafletMouseEvent) => void;
    markerRef: (marker: L.Marker | null) => void;
    currentZoom: number;
    type: string;
    isZooming: boolean;
  }) => {
    if (!Array.isArray(location.position) || location.position.length !== 2) {
      console.error('LocationMarkers: Invalid position for location:', location);
      return null;
    }

    const icon = createLocationIcon(location, opts.currentZoom);
    const labelHtml = location.label || location.name || '';
    const showLabel = location.showLabel !== false && labelHtml;

    return (
      <>
        <Marker
          key={location.id}
          position={location.position}
          icon={icon}
          zIndexOffset={1000}
          ref={opts.markerRef}
          eventHandlers={{
            contextmenu: opts.onContextMenu,
            click: opts.onClick,
          }}
        />
        {showLabel && (
          <Marker
            key={location.id + '-label'}
            position={location.position}
            icon={createLocationLabelDivIcon(location, opts.currentZoom)}
            interactive={false}
            zIndexOffset={2000}
          />
        )}
      </>
    );
  }, []);

  return (
    <ElementMarkers
      elements={locations}
      currentZoom={zoom}
      fitZoom={fitZoom}
      onContextMenu={handleContextMenu}
      panelWidth={panelWidth}
      currentPanel={currentPanel}
      onElementClick={handleLocationClick}
      renderMarker={renderLocationMarker}
    />
  );
}

// Export with error boundary
export function LocationMarkers(props: LocationMarkersProps) {
  return (
    <MarkerErrorBoundary componentName="LocationMarkers">
      <LocationMarkersComponent {...props} />
    </MarkerErrorBoundary>
  );
} 