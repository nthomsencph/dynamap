import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import type { Region } from '@/types/regions';

// Extend the Leaflet Control type to include our draw control
type DrawControl = L.Control & {
  remove: () => L.Control;
};

interface DrawCreatedEvent extends L.LeafletEvent {
  layer: L.Layer;
  layerType: string;
}

export function usePolygonDraw(
  mapRef: React.RefObject<L.Map | null>,
  onComplete: (points: [number, number][]) => void
) {
  const [drawControl, setDrawControl] = useState<DrawControl | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [wasDrawingBeforeZoom, setWasDrawingBeforeZoom] = useState(false);

  // Use refs to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Cleanup function to remove draw control
  const cleanupDrawControl = useCallback(() => {
    if (!mapRef.current || !drawControl || isCompleting) return;

    const map = mapRef.current;
    try {
      // Use setTimeout to ensure we don't interfere with Leaflet Draw's event handling
      setTimeout(() => {
        if (map && drawControl) {
          try {
            map.removeControl(drawControl);
          } catch (error) {
            console.warn('[DEBUG] Error removing control:', error);
          }
        }
      }, 0);
    } catch (error) {
      console.warn('[DEBUG] Error during cleanup:', {
        error,
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });
    } finally {
      // Always update our state
      setDrawControl(null);
      setIsDrawing(false);
    }
  }, [mapRef, drawControl, isCompleting]);

  // Start drawing mode
  const startDrawing = useCallback(() => {
    if (!mapRef.current) return;

    // Clean up any existing draw control first
    cleanupDrawControl();

    // Create a feature group to store editable layers
    const editableLayers = new L.FeatureGroup();
    mapRef.current.addLayer(editableLayers);

    // Create draw control
    const draw = new (L.Control as any).Draw({
      position: 'topleft',
      draw: {
        polyline: false,
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e4e8',
            timeout: 2500
          },
          shapeOptions: {
            color: '#2563eb',
            weight: 4,
            opacity: 0.9,
            fillOpacity: 0.3,
            dashArray: '8, 8',
            lineCap: 'round',
            lineJoin: 'round',
          }
        },
        circle: false,
        rectangle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: editableLayers,
        remove: false
      }
    }) as DrawControl;

    // Add draw control to map
    draw.addTo(mapRef.current);
    setDrawControl(draw);
    setIsDrawing(true);
  }, [mapRef, cleanupDrawControl]);

  // Stop drawing mode
  const stopDrawing = useCallback(() => {
    cleanupDrawControl();
  }, [cleanupDrawControl]);

  // Main effect for event handling - simplified dependencies
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleDrawCreated = (e: L.LeafletEvent) => {
      const drawEvent = e as unknown as DrawCreatedEvent;
      if (drawEvent.layerType !== 'polygon') return;

      setIsCompleting(true);
      try {
        const layer = drawEvent.layer;
        const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
        const points = latlngs.map(latlng => [latlng.lat, latlng.lng] as [number, number]);
        
        // Remove the drawn layer first
        map.removeLayer(layer);
        
        // Call onComplete with the points using ref
        onCompleteRef.current(points);
      } finally {
        // Clean up after the event is processed
        cleanupDrawControl();
        setIsCompleting(false);
      }
    };

    const handleDrawStop = () => {
      // Only stop if we're not in the process of completing a draw
      if (!isCompleting) {
        stopDrawing();
      }
    };

    const handleZoomStart = () => {
      // Remember if we were drawing before zoom started
      setWasDrawingBeforeZoom(isDrawing);
    };

    const handleZoomEnd = () => {
      // If we were drawing before zoom started, restart drawing
      if (wasDrawingBeforeZoom && !drawControl) {
        startDrawing();
      }
      setWasDrawingBeforeZoom(false);
    };

    // Add event listeners
    map.on('draw:created', handleDrawCreated);
    map.on('draw:drawstop', handleDrawStop);
    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);

    return () => {
      // Remove event listeners
      map.off('draw:created', handleDrawCreated);
      map.off('draw:drawstop', handleDrawStop);
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
      
      // Clean up on unmount
      cleanupDrawControl();
    };
  }, [drawControl, isCompleting, isDrawing, wasDrawingBeforeZoom, cleanupDrawControl, stopDrawing, startDrawing]);

  return {
    isDrawing,
    startDrawing,
    stopDrawing,
  };
} 