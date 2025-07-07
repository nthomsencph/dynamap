import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { flyToLocationWithPanel, getMapCenter } from '@/app/utils/fly';
import { MapElement } from '@/types/elements';
import { calculatePolygonCenter } from '@/app/utils/geometry';
import { shouldShowElementInYear } from '@/app/utils/zoom';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import type { PanelEntry } from '@/app/contexts/PanelStackContext';

// Navigation type for panels
export type ElementType = 'location' | 'region';

// Navigation entry with discriminated union
export interface NavEntry<T extends MapElement> {
  elementType: ElementType; // For navigation (location/region)
  value: T | null; // The actual element with its type property
}

// Type for handling navigation between different element types
export type ElementClickHandler<
  T extends MapElement,
  U extends MapElement = T,
> = (entry: NavEntry<T | U>) => void;

// Base props that all marker components should have
export interface BaseMarkerProps<T extends MapElement> {
  elements: T[];
  currentZoom: number;
  fitZoom: number;
  onContextMenu: (
    e: L.LeafletMouseEvent,
    type: 'marker' | 'map',
    element?: T
  ) => void;
  panelWidth?: number;
}

// Extended props for ElementMarkers
interface ElementMarkersProps<T extends MapElement, U extends MapElement = T>
  extends BaseMarkerProps<T> {
  // External panel state
  currentPanel?: PanelEntry | null;
  getId?: (element: T) => string;
  shouldShow?: (element: T, currentZoom: number, fitZoom: number) => boolean;
  getPosition?: (element: T) => [number, number];
  onElementClick?: (element: T) => void;
  // Required props that must be provided
  renderMarker: (
    element: T,
    opts: {
      onClick: () => void;
      onContextMenu: (e: L.LeafletMouseEvent) => void;
      markerRef: (marker: any) => void;
      currentZoom: number;
      type: string;
      isZooming: boolean;
      labelRef: (node: HTMLDivElement | null) => void;
    }
  ) => React.ReactNode;
  onOtherElementClick?: ElementClickHandler<U>;
}

// Error boundary for marker components
export class MarkerErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`${this.props.componentName} error:`, error, errorInfo);
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

export function ElementMarkers<T extends MapElement, U extends MapElement = T>(
  props: ElementMarkersProps<T, U>
) {
  const {
    elements,
    currentZoom,
    fitZoom,
    onContextMenu,
    panelWidth = 450,
    currentPanel,
    getId = (element: T) => element.id,
    shouldShow = (element: T, currentZoom: number, fitZoom: number) =>
      shouldShowElementInYear(element, currentZoom, fitZoom, currentYear),
    getPosition = (element: T) => {
      const pos = (element as any).geom;
      return Array.isArray(pos[0])
        ? calculatePolygonCenter(pos as [number, number][])
        : (pos as [number, number]);
    },
    onElementClick,
    renderMarker,
    onOtherElementClick,
  } = props;

  const { currentYear } = useTimelineContext();

  const [isZooming, setIsZooming] = useState(false);
  const map = useMap();
  const markersRef = useRef<{ [key: string]: any }>({});
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Refs to track if we've already handled certain operations
  const hasInitializedRef = useRef(false);

  // Track zoom animation state
  useEffect(() => {
    if (!map) return;

    const handleZoomStart = () => {
      setIsZooming(true);
    };

    const handleZoomEnd = () => {
      setIsZooming(false);
    };

    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // Fly to element when a panel is opened
  useEffect(() => {
    // Skip if no map or if we haven't initialized yet
    if (!map || !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    if (currentPanel && currentPanel.element) {
      const position = getPosition(currentPanel.element as unknown as T);

      // Add a small delay to ensure the panel is fully rendered before flying
      setTimeout(() => {
        flyToLocationWithPanel(map, position, panelWidth);
      }, 50);
    }
  }, [map, currentPanel, panelWidth, getPosition]);

  // Update handleElementClick to use elementType
  const handleElementClick = useCallback(
    (element: T, elementType: ElementType) => {
      if (onElementClick) {
        onElementClick(element);
      }
    },
    [onElementClick]
  );

  // Memoized context menu handler
  const handleContextMenu = useCallback(
    (e: L.LeafletMouseEvent, element: T) => {
      onContextMenu(e, 'marker', element);
    },
    [onContextMenu]
  );

  return (
    <>
      {elements
        .filter(el => shouldShow(el, currentZoom, fitZoom))
        .map(el => (
          <React.Fragment key={getId(el)}>
            {renderMarker(el, {
              onClick: () => {
                handleElementClick(el, el.elementType);
              },
              onContextMenu: (e: L.LeafletMouseEvent) =>
                handleContextMenu(e, el),
              markerRef: (marker: any) => {
                if (marker) {
                  markersRef.current[getId(el)] = marker;
                } else {
                  delete markersRef.current[getId(el)];
                }
              },
              currentZoom: currentZoom,
              type: el.type,
              isZooming,
              labelRef: (node: HTMLDivElement | null) => {
                labelRefs.current[el.id] = node;
              },
            })}
          </React.Fragment>
        ))}
    </>
  );
}
