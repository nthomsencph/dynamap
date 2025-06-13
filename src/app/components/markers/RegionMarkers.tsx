import React, { useCallback } from 'react';
import { Polygon, Marker, useMap } from "react-leaflet";
import L from 'leaflet';
import type { Region } from "@/types/regions";
import type { Location } from "@/types/locations";
import { shouldShowElement } from '@/app/utils/zoom';
import { findContainingRegions } from '@/app/utils/containment';
import { ElementMarkers, MarkerErrorBoundary } from './ElementMarkers';
import type { PanelEntry } from '@/hooks/ui/usePanelStack';
import { calculatePolygonCenter } from '@/app/utils/area';

// Import region label styles
import '@/css/markers/region-label.css';

// Cache for memoized region label icons
const regionLabelIconCache = new Map<string, L.DivIcon>();

function createRegionLabelDivIcon(region: Region) {
  // Create a cache key
  const cacheKey = `region-label-${region.id}-${region.label || ''}-${region.labelCollisionStrategy || 'None'}`;
  
  // Return cached icon if it exists
  if (regionLabelIconCache.has(cacheKey)) {
    return regionLabelIconCache.get(cacheKey)!;
  }

  const icon = L.divIcon({
    className: 'map-label-icon',
    html: `<div
      class="map-label region-label"
      id="${region.id}"
      data-collision-strategy="${region.labelCollisionStrategy || 'None'}"
      style="pointer-events: none;"
    >${region.label || ''}</div>`,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
  
  // Cache the icon
  regionLabelIconCache.set(cacheKey, icon);
  return icon;
}

interface RegionMarkersProps {
  regions: Region[];
  currentZoom: number;
  fitZoom: number;
  onContextMenu: (e: L.LeafletMouseEvent, type: 'map' | 'marker', region?: Region) => void;
  onElementClick?: (element: Location | Region) => void;
  currentPanel?: PanelEntry | null;
  panelWidth?: number;
}

function RegionMarkersComponent({ 
  regions, 
  currentZoom, 
  fitZoom, 
  onContextMenu,
  onElementClick,
  currentPanel,
  panelWidth = 450
}: RegionMarkersProps) {
  const map = useMap();

  const handleRegionClick = useCallback((region: Region) => {
    if (onElementClick) {
      onElementClick(region);
    }
  }, [onElementClick]);

  const handleContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'marker' | 'map', region?: Region) => {
    onContextMenu(e, type, region);
  }, [onContextMenu]);

  // Render marker function for ElementMarkers
  const renderRegionMarker = useCallback((region: Region, opts: {
    onClick: () => void;
    onContextMenu: (e: L.LeafletMouseEvent) => void;
    markerRef: (marker: L.Polygon | null) => void;
    currentZoom: number;
    type: string;
    isZooming: boolean;
  }) => {
    if (!Array.isArray(region.position) || region.position.length < 3) {
      console.error('RegionMarkers: Invalid position for region:', region);
      return null;
    }

    const showLabel = region.showLabel !== false && region.label;
    const centroid = calculatePolygonCenter(region.position);

    return (
      <>
        <Polygon
          key={region.id + '-polygon'}
          positions={region.position}
          pathOptions={{
            color: region.color,
            weight: region.showBorder ? 2 : 0,
            opacity: 0.8,
            fillOpacity: region.showHighlight !== false ? 0.2 : 0,
          }}
          ref={opts.markerRef}
          eventHandlers={{
            contextmenu: opts.onContextMenu,
            click: (e: L.LeafletMouseEvent) => {
              // Find all regions containing this click point
              const clickPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
              const allContainingRegions = findContainingRegions(clickPoint, regions);
              
              if (allContainingRegions.length > 0) {
                // Find the smallest containing region (first in the sorted list)
                const smallestContainingRegion = allContainingRegions[0];
                
                if (onElementClick) {
                  onElementClick(smallestContainingRegion);
                }
              } else {
                // No containing regions, click the region itself
                if (onElementClick) {
                  onElementClick(region);
                }
              }
            },
          }}
        />
        {showLabel && (
          <Marker
            key={region.id + '-label'}
            position={centroid}
            icon={createRegionLabelDivIcon(region)}
            interactive={false}
            zIndexOffset={2000}
          />
        )}
      </>
    );
  }, [regions, handleRegionClick]);

  return (
    <ElementMarkers
      elements={regions}
      currentZoom={currentZoom}
      fitZoom={fitZoom}
      onContextMenu={handleContextMenu}
      panelWidth={panelWidth}
      currentPanel={currentPanel}
      onElementClick={handleRegionClick}
      renderMarker={renderRegionMarker}
    />
  );
}

// Export with error boundary
export function RegionMarkers(props: RegionMarkersProps) {
  return (
    <MarkerErrorBoundary componentName="RegionMarkers">
      <RegionMarkersComponent {...props} />
    </MarkerErrorBoundary>
  );
} 