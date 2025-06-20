import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Polygon, Marker, useMap } from "react-leaflet";
import L from 'leaflet';
import type { Region } from "@/types/regions";
import type { Location } from "@/types/locations";
import { shouldShowElement } from '@/app/utils/zoom';
import { findContainingRegions } from '@/app/utils/containment';
import { ElementMarkers, MarkerErrorBoundary } from './ElementMarkers';
import type { PanelEntry } from '@/hooks/ui/usePanelStack';
import { calculatePolygonCenter } from '@/app/utils/area';
import { calculateLabelOffset, applyLabelOffset } from '@/app/utils/labelAlignment';

// Import region label styles
import '@/css/markers/region-label.css';

// Cache for memoized region label icons
const regionLabelIconCache = new Map<string, L.DivIcon>();

function createRegionLabelDivIcon(region: Region) {
  // Create a cache key
  const cacheKey = `region-label-${region.id}-${region.label || ''}`;
  
  // Return cached icon if it exists
  if (regionLabelIconCache.has(cacheKey)) {
    return regionLabelIconCache.get(cacheKey)!;
  }

  const icon = L.divIcon({
    className: 'map-label-icon',
    html: `<div
      class="map-label region-label"
      id="${region.id}"
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
  fitZoom, 
  onContextMenu,
  onElementClick,
  currentPanel,
  panelWidth = 450,
}: RegionMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [fadeInRegions, setFadeInRegions] = useState<Set<string>>(new Set());
  const [regionOpacities, setRegionOpacities] = useState<Record<string, number>>({});
  const polygonRefs = useRef<Record<string, L.Polygon | null>>({});

  // Initial fade-in for all regions on mount
  useEffect(() => {
    if (regions.length > 0 && fadeInRegions.size === 0) {
      // Add all regions to fade-in set
      const allRegionIds = new Set(regions.map(r => r.id));
      setFadeInRegions(allRegionIds);
      
      // Initialize all regions with 0 opacity
      const initialOpacities: Record<string, number> = {};
      regions.forEach(region => {
        initialOpacities[region.id] = 0;
      });
      setRegionOpacities(initialOpacities);

      // Animate each region
      regions.forEach(region => {
        const fadeDuration = region.areaFadeDuration ?? 800;
        const steps = 10;
        const stepDuration = fadeDuration / steps;
        const opacityStep = 0.8 / steps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
          currentStep++;
          const currentOpacity = Math.min(currentStep * opacityStep, 0.8);
          
          setRegionOpacities(prev => ({
            ...prev,
            [region.id]: currentOpacity
          }));

          if (currentStep >= steps) {
            clearInterval(fadeInterval);
          }
        }, stepDuration);
      });
    }
  }, [regions, fadeInRegions.size]);

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

  // Handle fade-in effect when zoom ends
  useEffect(() => {
    const handleZoomStart = () => {
      // Clear fade-in state when zoom starts
      setFadeInRegions(new Set());
      setRegionOpacities({});
    };

    const handleZoomEnd = () => {
      // Start fade-in animation for all visible regions
      const visibleRegionIds = new Set(regions.map(r => r.id));
      setFadeInRegions(visibleRegionIds);
      
      // Initialize all regions with 0 opacity
      const initialOpacities: Record<string, number> = {};
      regions.forEach(region => {
        initialOpacities[region.id] = 0;
      });
      setRegionOpacities(initialOpacities);

      // Animate each region with its individual fade duration
      regions.forEach(region => {
        const fadeDuration = region.areaFadeDuration ?? 800;
        const steps = 10;
        const stepDuration = fadeDuration / steps;
        const opacityStep = 0.8 / steps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
          currentStep++;
          const currentOpacity = Math.min(currentStep * opacityStep, 0.8);
          
          setRegionOpacities(prev => ({
            ...prev,
            [region.id]: currentOpacity
          }));

          if (currentStep >= steps) {
            clearInterval(fadeInterval);
          }
        }, stepDuration);
      });
    };

    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, regions]);

  // Handle fade-in for newly created regions
  useEffect(() => {
    
    // Find regions that are not in fadeInRegions (newly added)
    const newRegionIds = regions.filter(region => !fadeInRegions.has(region.id)).map(r => r.id);
    
    if (newRegionIds.length > 0) {
      // Add new regions to fade-in set
      setFadeInRegions(prev => new Set([...prev, ...newRegionIds]));
      
      // Initialize new regions with 0 opacity
      setRegionOpacities(prev => {
        const newOpacities = { ...prev };
        newRegionIds.forEach(id => {
          if (newOpacities[id] === undefined) {
            newOpacities[id] = 0;
          }
        });
        return newOpacities;
      });

      // Animate each new region
      newRegionIds.forEach(regionId => {
        const region = regions.find(r => r.id === regionId);
        if (!region) return;

        const fadeDuration = region.areaFadeDuration as number;
        const steps = 10;
        const stepDuration = fadeDuration / steps;
        const opacityStep = 0.8 / steps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
          currentStep++;
          const currentOpacity = Math.min(currentStep * opacityStep, 0.8);
          
          setRegionOpacities(prev => ({
            ...prev,
            [regionId]: currentOpacity
          }));

          if (currentStep >= steps) {
            clearInterval(fadeInterval);
          }
        }, stepDuration);
      });
    }
  }, [regions, fadeInRegions]);

  const handleRegionClick = useCallback((region: Region) => {    
    if (onElementClick) {
      onElementClick(region);
    }
  }, [onElementClick, regions]);

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
    labelRef: (node: HTMLDivElement | null) => void;
  }) => {
    
    // Always render labels if they have content and showLabel is not false
    const showLabel = region.showLabel !== false && region.label;
    const centroid = calculatePolygonCenter(region.position);
    const shouldFadeIn = fadeInRegions.has(region.id);
    const currentOpacity = regionOpacities[region.id] ?? (shouldFadeIn ? 0 : 0.8);

    // Calculate label position based on alignment
    let labelPosition = centroid;
    if (showLabel && region.labelPosition && region.labelPosition.direction !== 'Center') {
      // Use default size for label positioning calculations
      const defaultLabelSize = { width: 50, height: 32 };
      // Calculate the offset based on label position settings
      const offset = calculateLabelOffset(region, defaultLabelSize.width, defaultLabelSize.height);
      // Apply the offset to the centroid
      labelPosition = applyLabelOffset(centroid, offset);
    }

    return (
      <>
        {!opts.isZooming && (
        <Polygon
          key={region.id + '-polygon'}
          positions={region.position}
          pathOptions={{
            color: region.color,
            weight: region.showBorder ? 2 : 0,
              opacity: currentOpacity,
              fillOpacity: region.showHighlight !== false ? (shouldFadeIn ? currentOpacity * 0.25 : 0.2) : 0,
          }}
            ref={(ref) => {
              polygonRefs.current[region.id] = ref;
              opts.markerRef(ref);
            }}
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
        )}
        {showLabel && (
          <Marker
            key={region.id + '-label'}
            position={labelPosition}
            icon={createRegionLabelDivIcon(region)}
            interactive={false}
            zIndexOffset={2000}
          />
        )}
      </>
    );
  }, [regions, handleRegionClick, fadeInRegions, regionOpacities]);

  return (
    <ElementMarkers
      elements={regions}
      currentZoom={zoom}
      fitZoom={fitZoom}
      onContextMenu={handleContextMenu}
      panelWidth={panelWidth}
      currentPanel={currentPanel}
      onElementClick={handleRegionClick}
      renderMarker={renderRegionMarker}
    />
  );
}

export function RegionMarkers(props: RegionMarkersProps) {
  return (
    <MarkerErrorBoundary componentName="RegionMarkers">
      <RegionMarkersComponent {...props} />
    </MarkerErrorBoundary>
  );
} 