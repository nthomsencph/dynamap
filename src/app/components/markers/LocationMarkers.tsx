import React, { useCallback, useEffect, useState } from 'react';
import { Marker, useMap } from "react-leaflet";
import L from 'leaflet';
import type { Location } from "@/types/locations";
import type { Region } from "@/types/regions";
import { createLocationIcon, createLocationLabelDivIcon } from '@/app/utils/mapIcons';
import { ElementMarkers, MarkerErrorBoundary } from './ElementMarkers';
import type { PanelEntry } from '@/app/contexts/PanelStackContext';
import { calculateLabelOffset, applyLabelOffset } from '@/app/utils/labelAlignment';

interface LocationMarkersProps {
  locations: Location[];
  regions: Region[];
  fitZoom: number;
  onContextMenu: (e: L.LeafletMouseEvent, type: 'map' | 'marker', location?: Location) => void;
  onElementClick?: (element: Location | Region) => void;
  currentPanel?: PanelEntry | null;
  panelWidth?: number;
  previewLocationId?: string | null;
}

function LocationMarkersComponent({ 
  locations, 
  regions,
  fitZoom,
  onContextMenu,
  onElementClick,
  currentPanel,
  panelWidth = 450,
  previewLocationId,
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
    labelRef: (node: HTMLDivElement | null) => void;
  }) => {

    const isPreview = previewLocationId === location.id;
    
    // Create icon with preview styling if needed
    const icon = createLocationIcon(location, opts.currentZoom);
    if (isPreview) {
      icon.options.className = (icon.options.className || '') + ' preview';
    }
    
    const showLabel = location.showLabel !== false && (location.label || location.name);

    // Calculate label position based on alignment
    let labelPosition = location.position;
    if (showLabel && location.labelPosition && location.labelPosition.direction !== 'Center') {
      // Use default size for label positioning calculations
      const defaultLabelSize = { width: 50, height: 32 };
      // Calculate the offset based on label position settings
      const offset = calculateLabelOffset(location, defaultLabelSize.width, defaultLabelSize.height);
      labelPosition = applyLabelOffset(location.position, offset);
    }

    // Create label icon with preview styling if needed
    const labelIcon = showLabel ? createLocationLabelDivIcon(location, opts.currentZoom) : null;
    if (isPreview && labelIcon) {
      labelIcon.options.className = (labelIcon.options.className || '') + ' preview';
    }

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
        {showLabel && labelIcon && (
          <Marker
            key={location.id + '-label'}
            position={labelPosition}
            icon={labelIcon}
            interactive={false}
            zIndexOffset={2000}
          />
        )}
      </>
    );
  }, [map]);

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

export function LocationMarkers(props: LocationMarkersProps) {
  return (
    <MarkerErrorBoundary componentName="LocationMarkers">
      <LocationMarkersComponent {...props} />
    </MarkerErrorBoundary>
  );
} 