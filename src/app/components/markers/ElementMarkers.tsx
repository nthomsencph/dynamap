import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { flyToLocationWithPanel, getMapCenter } from '@/app/utils/fly';
import { MapElement } from '@/types/elements';
import { calculatePolygonCenter } from '@/app/utils/area';

// Navigation type for panels
export type ElementType = 'location' | 'region';

// Navigation entry with discriminated union
export interface NavEntry<T extends MapElement> {
  elementType: ElementType;  // For navigation (location/region)
  value: T | null;          // The actual element with its type property
}

// Type for handling navigation between different element types
export type ElementClickHandler<T extends MapElement, U extends MapElement = T> = 
  (entry: NavEntry<T | U>) => void;

interface ElementMarkersProps<T extends MapElement, U extends MapElement = T> {
  elements: T[];
  currentZoom: number;
  fitZoom: number;
  onContextMenu: (e: L.LeafletMouseEvent, type: 'marker' | 'map', element: T) => void;
  getId: (element: T) => string;
  shouldShow: (element: T, currentZoom: number, fitZoom: number) => boolean;
  getPosition: (element: T) => [number, number];
  renderMarker: (element: T, opts: {
    onClick: () => void;
    onContextMenu: (e: L.LeafletMouseEvent) => void;
    markerRef: (marker: L.Marker | null) => void;
    currentZoom: number;
    type: string;
    isZooming: boolean;
  }) => React.ReactNode;
  renderPanel: (entry: NavEntry<T>, opts: {
    onClose: () => void;
    onBack?: () => void;
    onElementClick?: ElementClickHandler<T, U>;
  }) => React.ReactNode;
  panelWidth?: number;
  onOtherElementClick?: ElementClickHandler<U>;
}

export function ElementMarkers<T extends MapElement, U extends MapElement = T>({
  elements,
  currentZoom,
  fitZoom,
  onContextMenu,
  getId,
  shouldShow,
  getPosition,
  renderMarker,
  renderPanel,
  panelWidth = 450,
  onOtherElementClick,
}: ElementMarkersProps<T, U>) {
  // Add logging for props
  useEffect(() => {
  }, [elements, currentZoom, fitZoom]);

  // Stack of open panels (each with elementType and value)
  const [panelStack, setPanelStack] = useState<NavEntry<T | U>[]>([]);
  const panelStackRef = useRef<NavEntry<T | U>[]>([]);
  const [previousMapCenter, setPreviousMapCenter] = useState<[number, number] | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [lastStableZoom, setLastStableZoom] = useState(currentZoom);
  const map = useMap();
  const markersRef = useRef<{ [key: string]: any }>({});

  // Keep ref in sync with state
  useEffect(() => {
    panelStackRef.current = panelStack;
  }, [panelStack]);

  // Update panel stack when elements change
  useEffect(() => {
    if (panelStack.length === 0) return;
    
    // Update the panel stack with the latest element data
    setPanelStack(prev => {
      return prev.map(entry => {
        const updatedElement = elements.find(el => getId(el) === getId(entry.value as T));
        if (updatedElement) {
          return { ...entry, value: updatedElement };
        }
        return entry;
      });
    });
  }, [elements, getId, panelStack.length]);

  // Track zoom animation state
  useEffect(() => {
    if (!map) return;

    const handleZoomStart = () => {
      setIsZooming(true);
    };

    const handleZoomEnd = () => {
      setIsZooming(false);
      setLastStableZoom(map.getZoom());
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
    if (!map) return;
    const top = panelStack[panelStack.length - 1];
    if (top) {
      if (!previousMapCenter) {
        setPreviousMapCenter(getMapCenter(map));
      }
      // Get position based on element type
      const position = top.elementType === 'region'
        ? calculatePolygonCenter((top.value as any).position)
        : (top.value as any).position;
      flyToLocationWithPanel(map, position, panelWidth);
    }
  }, [panelStack, map, panelWidth]);

  // Restore previous center only when no panel is open
  useEffect(() => {
    if (!map) return;
    if (panelStack.length === 0 && previousMapCenter) {
      flyToLocationWithPanel(map, previousMapCenter, 0);
      setPreviousMapCenter(null);
    }
  }, [panelStack, previousMapCenter, map]);

  // Update handleElementClick to use elementType
  const handleElementClick = useCallback((element: T, elementType: ElementType) => {
    console.log('[ElementMarkers] Element clicked:', {
      id: element.id,
      name: element.name,
      type: elementType,
      position: element.position
    });
    setPanelStack(prev => [...prev, { elementType, value: element }]);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setPanelStack(prev => prev.slice(0, -1));
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    setPanelStack([]);
  }, []);

  // Open a panel for an element (from the map, not from another panel)
  const openPanel = useCallback((el: T) => {
    const elementType: ElementType = Array.isArray((el as any).position[0]) ? 'region' : 'location';
    setPanelStack([{ elementType, value: el }]);
  }, []);

  // Handle clicks on other element types
  const handleOtherElementClick = useCallback((entry: NavEntry<U>) => {
    if (onOtherElementClick) {
      onOtherElementClick(entry);
    }
  }, [onOtherElementClick]);

  return (
    <>
      {elements.map(el => {
        if (!shouldShow(el, lastStableZoom, fitZoom)) return null;
        return renderMarker(el, {
          onClick: () => openPanel(el),
          onContextMenu: (e: L.LeafletMouseEvent) => onContextMenu(e, 'marker', el),
          markerRef: (marker: any) => {
            if (marker) {
              markersRef.current[getId(el)] = marker;
            } else {
              delete markersRef.current[getId(el)];
            }
          },
          currentZoom: lastStableZoom,
          type: el.type,
          isZooming,
        });
      })}
      {panelStack.map((entry, index) => {
        if (!entry.value) return null;
        return (
          <React.Fragment key={getId(entry.value as T)}>
            {renderPanel(entry as NavEntry<T>, {
              onClose: handleClose,
              onBack: index > 0 ? handleBack : undefined,
              onElementClick: (entry: NavEntry<T | U>) => {
                if (!entry.value) return;
                const elementType: ElementType = Array.isArray((entry.value as any).position[0]) ? 'region' : 'location';
                handleElementClick(entry.value as T, elementType);
              }
            })}
          </React.Fragment>
        );
      })}
    </>
  );
} 