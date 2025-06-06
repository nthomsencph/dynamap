import React, { useCallback, useEffect } from 'react';
import { Polygon, Marker } from "react-leaflet";
import L from 'leaflet';
import type { Region } from "@/types/regions";
import type { Location } from "@/types/locations";
import type { MapElement } from '@/types/elements';
import { shouldShowElement } from '@/app/utils/zoom';
import { RegionPanel } from '@/app/components/panels/RegionPanel';
import { renderToStaticMarkup } from "react-dom/server";
import { calculatePolygonCenter } from '@/app/utils/area';
import { ElementMarkers, type NavEntry } from '@/app/components/markers/ElementMarkers';

// Import region label styles
import '@/css/markers/region-label.css';

// Helper function to create a region label icon
function createRegionLabelIcon(region: Region) {
  const labelHtml = region.label || region.name || '';
  
  const iconHtml = renderToStaticMarkup(
    <div className="region-label-wrapper">
      {(region.showLabel !== false) && labelHtml && (
        <span 
          className="region-label" 
          dangerouslySetInnerHTML={{ __html: labelHtml }}
        />
      )}
    </div>
  );
  return L.divIcon({
    className: 'region-label-icon',
    html: iconHtml,
    iconSize: [1, 1], // Minimal size since we only need the label
    iconAnchor: [0, 0], // No offset needed
  });
}

interface RegionMarkersProps {
  regions: Region[];
  currentZoom: number;
  fitZoom: number;
  onContextMenu: (e: L.LeafletMouseEvent, type: 'marker' | 'map', region?: Region) => void;
  panelWidth?: number;
}

function RegionMarkersComponent({ 
  regions, 
  currentZoom, 
  fitZoom, 
  onContextMenu,
  panelWidth = 450 
}: RegionMarkersProps) {
  // Add logging for props
  useEffect(() => {
  }, [regions, currentZoom, fitZoom]);

  // Use regions directly
  const renderMarker = useCallback((region: Region, opts: {
    onClick: () => void;
    onContextMenu: (e: L.LeafletMouseEvent) => void;
    markerRef: (marker: L.Marker | null) => void;
    currentZoom: number;
    type: string;
    isZooming: boolean;
  }) => {

    const center = calculatePolygonCenter(region.position);
    return (
      <React.Fragment key={region.id}>
        {/* Only render polygon when not zooming */}
        {!opts.isZooming && (
          <Polygon
            positions={region.position}
            pathOptions={{
              color: region.color,
              weight: region.showBorder ? 2 : 0,
              opacity: 0.8,
              fillOpacity: region.showHighlight !== false ? 0.2 : 0,
            }}
            eventHandlers={{
              click: opts.onClick,
              contextmenu: (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
                opts.onContextMenu(e);
              },
            }}
          />
        )}
        {/* Always render label */}
        {region.showLabel !== false && region.label && (
          <Marker
            position={center}
            icon={createRegionLabelIcon(region)}
            interactive={false}
            zIndexOffset={1000}
            ref={opts.markerRef}
          />
        )}
      </React.Fragment>
    );
  }, []);

  // Memoized panel renderer
  const renderPanel = useCallback((entry: NavEntry<Region>, opts: {
    onClose: () => void;
    onBack?: () => void;
    onElementClick?: (entry: NavEntry<Region | (Location & MapElement)>) => void;
  }) => {
    if (!entry.value) {
      console.error('RegionMarkers: Attempted to render panel with null region');
      return null;
    }

    return (
      <RegionPanel
        region={entry.value}
        onClose={opts.onClose}
        onBack={opts.onBack}
        onLocationClick={(location) => {
          if (!location) {
            console.error('RegionMarkers: Null location clicked in panel');
            return;
          }
          if (opts.onElementClick) {
            opts.onElementClick({ 
              elementType: 'location',
              value: location
            });
          }
        }}
      />
    );
  }, []);

  // Memoized callbacks
  const handleContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'marker' | 'map', region: Region) => {
    if (type === 'marker') {
      onContextMenu(e, 'marker', region);
    } else {
      onContextMenu(e, 'map');
    }
  }, [onContextMenu]);

  const getId = useCallback((region: Region) => region.id, []);
  const getPosition = useCallback((region: Region) => calculatePolygonCenter(region.position), []);
  const shouldShow = useCallback((region: Region, currentZoom: number, fitZoom: number) => 
    shouldShowElement(region.prominence, currentZoom, fitZoom)
  , [fitZoom]);

  return (
    <ElementMarkers<Region, Location & MapElement>
      elements={regions}
      currentZoom={currentZoom}
      fitZoom={fitZoom}
      onContextMenu={handleContextMenu}
      getId={getId}
      shouldShow={shouldShow}
      getPosition={getPosition}
      renderMarker={renderMarker}
      renderPanel={renderPanel}
      panelWidth={panelWidth}
    />
  );
}

// Export wrapped component with error boundary
class RegionMarkersErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RegionMarkers error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <p>Error loading map markers. Please try refreshing the page.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre>{this.state.error?.toString()}</pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export function RegionMarkers(props: RegionMarkersProps) {
  return (
    <RegionMarkersErrorBoundary>
      <RegionMarkersComponent {...props} />
    </RegionMarkersErrorBoundary>
  );
} 