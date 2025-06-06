import React, { useCallback } from 'react';
import { Marker } from "react-leaflet";
import L from 'leaflet';
import type { Location } from "@/types/locations";
import { shouldShowElement } from '@/app/utils/zoom';
import { createLocationIcon } from '@/app/utils/map-icons';
import { LocationPanel } from '@/app/components/panels/LocationPanel';
import { ElementMarkers, type NavEntry } from '@/app/components/markers/ElementMarkers';

// Error boundary for LocationMarkers
class LocationMarkersErrorBoundary extends React.Component<
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
    console.error('LocationMarkers error:', error, errorInfo);
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

interface LocationMarkersProps {
  locations: Location[];
  currentZoom: number;
  fitZoom: number;
  onContextMenu: (e: L.LeafletMouseEvent, type: 'marker', location: Location) => void;
  panelWidth?: number;
}

function LocationMarkersComponent({ 
  locations, 
  currentZoom, 
  fitZoom, 
  onContextMenu,
  panelWidth = 450 
}: LocationMarkersProps) {
  // Memoized marker renderer
  const renderMarker = useCallback((loc: Location, opts: {
    onClick: () => void;
    onContextMenu: (e: L.LeafletMouseEvent) => void;
    markerRef: (marker: L.Marker | null) => void;
    currentZoom: number;
    type: string;
    isZooming: boolean;
  }) => {
    if (!Array.isArray(loc.position) || loc.position.length !== 2) {
      console.error('LocationMarkers: Invalid position for location:', loc);
      return null;
    }

    return (
      <Marker
        key={loc.id}
        position={loc.position}
        icon={createLocationIcon(loc, currentZoom)}
        zIndexOffset={1000}
        ref={opts.markerRef}
        eventHandlers={{
          contextmenu: opts.onContextMenu,
          click: opts.onClick,
        }}
      />
    );
  }, [currentZoom]);

  // Memoized panel renderer
  const renderPanel = useCallback((entry: NavEntry<Location>, opts: {
    onClose: () => void;
    onBack?: () => void;
    onElementClick?: (entry: NavEntry<Location>) => void;
  }) => {
    if (!entry.value) {
      console.error('LocationMarkers: Attempted to render panel with null location');
      return null;
    }

    return (
      <LocationPanel
        location={entry.value}
        onClose={opts.onClose}
        onBack={opts.onBack}
        onLocationClick={(location) => {
          if (!location) {
            console.error('LocationMarkers: Null location clicked in panel');
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
  const handleContextMenu = useCallback((e: L.LeafletMouseEvent, type: 'marker' | 'map', location: Location) => {
    if (type === 'marker') {
      onContextMenu(e, 'marker', location);
    } else {
      console.debug('LocationMarkers: Map context menu event ignored');
    }
  }, [onContextMenu]);

  const getId = useCallback((loc: Location) => loc.id, []);
  const getPosition = useCallback((loc: Location) => loc.position, []);
  const shouldShow = useCallback((loc: Location, currentZoom: number, fitZoom: number) => 
    shouldShowElement(loc.prominence, currentZoom, fitZoom)
  , [fitZoom]);

  return (
    <ElementMarkers<Location>
      elements={locations}
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
export function LocationMarkers(props: LocationMarkersProps) {
  return (
    <LocationMarkersErrorBoundary>
      <LocationMarkersComponent {...props} />
    </LocationMarkersErrorBoundary>
  );
} 