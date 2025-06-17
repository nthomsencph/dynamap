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

export type DrawingTool = 'polygon' | 'circle' | 'rectangle' | 'polyline';

export interface DrawingResult {
  type: DrawingTool;
  points: [number, number][];
  center?: [number, number];
  radius?: number;
  bounds?: [[number, number], [number, number]];
}

export function usePolygonDraw(
  mapRef: React.RefObject<L.Map | null>,
  onComplete: (result: DrawingResult) => void
) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('polygon');
  
  // Use refs to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  const drawControlRef = useRef<DrawControl | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  
  onCompleteRef.current = onComplete;

  // Cleanup function - more Leaflet-native approach
  const cleanupDrawControl = useCallback(() => {
    console.log('cleanupDrawControl called');
    const map = mapRef.current;
    const drawControl = drawControlRef.current;
    const featureGroup = featureGroupRef.current;
    
    if (!map) return;

    // Remove draw control if it exists
    if (drawControl) {
      try {
        map.removeControl(drawControl);
      } catch (error) {
        console.warn('Error removing draw control:', error);
      }
      drawControlRef.current = null;
    }

    // Remove feature group if it exists
    if (featureGroup) {
      try {
        map.removeLayer(featureGroup);
      } catch (error) {
        console.warn('Error removing feature group:', error);
      }
      featureGroupRef.current = null;
    }

    setIsDrawing(false);
  }, [mapRef]);

  // Start drawing mode with all native tools enabled
  const startDrawing = useCallback(() => {
    console.log('startDrawing called, isDrawing:', isDrawing);
    const map = mapRef.current;
    if (!map) return;

    // Only cleanup if we're already drawing
    if (isDrawing) {
      cleanupDrawControl();
    }

    setTimeout(() => {
      // Create a feature group to store editable layers
      const featureGroup = new L.FeatureGroup();
      map.addLayer(featureGroup);
      featureGroupRef.current = featureGroup;

      // Enable all native Leaflet.Draw tools
      const shapeOptions = {
        color: '#2563eb',
        weight: 4,
        opacity: 0.9,
        fillOpacity: 0.3,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      };

      const drawOptions: any = {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e4e8',
            timeout: 2500
          },
          shapeOptions
        },
        polyline: { shapeOptions },
        rectangle: { shapeOptions },
        circle: { shapeOptions },
        marker: false,
        circlemarker: false
      };

      // Create draw control with all tools
      const drawControl = new (L.Control as any).Draw({
        position: 'topleft',
        draw: drawOptions,
        edit: {
          featureGroup,
          remove: false
        }
      }) as DrawControl;

      // Add draw control to map
      drawControl.addTo(map);
      drawControlRef.current = drawControl;
      setIsDrawing(true);
      setCurrentTool('polygon'); // Default for banner, but all tools are available

      // Set up event listeners for this drawing session
      console.log('Setting up draw event listeners');

      const handleDrawCreated = (e: L.LeafletEvent) => {
        console.log('draw:created event fired', e);
        const layer = (e as any).layer;
        const layerType = (e as any).layerType;
        
        console.log('Layer type:', layerType);
        console.log('Layer:', layer);
        
        // Only handle supported layer types
        if (!['polygon', 'circle', 'rectangle', 'polyline'].includes(layerType)) {
          console.log('Unsupported layer type, ignoring');
          return;
        }

        try {
          let result: DrawingResult;

          switch (layerType) {
            case 'polygon':
              const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
              const points = latlngs.map(latlng => [latlng.lat, latlng.lng] as [number, number]);
              result = { type: 'polygon', points };
              console.log('Polygon result:', result);
              break;
            case 'circle':
              const circle = layer as L.Circle;
              const center = [circle.getLatLng().lat, circle.getLatLng().lng] as [number, number];
              const radius = circle.getRadius();
              result = { type: 'circle', points: [center], center, radius };
              console.log('Circle result:', result);
              break;
            case 'rectangle':
              const rectangle = layer as L.Rectangle;
              const bounds = rectangle.getBounds();
              const rectPoints: [number, number][] = [
                [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
                [bounds.getNorthEast().lat, bounds.getNorthEast().lng]
              ];
              result = { type: 'rectangle', points: rectPoints, bounds: [rectPoints[0], rectPoints[1]] };
              console.log('Rectangle result:', result);
              break;
            case 'polyline':
              const polyline = layer as L.Polyline;
              const polylineLatlngs = polyline.getLatLngs() as L.LatLng[];
              const polylinePoints = polylineLatlngs.map(latlng => [latlng.lat, latlng.lng] as [number, number]);
              result = { type: 'polyline', points: polylinePoints };
              console.log('Polyline result:', result);
              break;
            default:
              console.log('Unknown layer type, returning');
              return;
          }
          
          // Remove the drawn layer from the feature group
          const featureGroup = featureGroupRef.current;
          if (featureGroup) {
            console.log('Removing layer from feature group');
            featureGroup.removeLayer(layer);
          }
          
          console.log('Calling onComplete with result:', result);
          // Call onComplete with the result - this should open the RegionDialog
          onCompleteRef.current(result);
          
          console.log('Cleaning up draw control');
          // Clean up the drawing mode after calling onComplete
          cleanupDrawControl();
        } catch (error) {
          console.error('Error handling draw created event:', error);
          // Only cleanup on error
          cleanupDrawControl();
        }
      };

      const handleDrawStop = () => {
        console.log('draw:drawstop event fired');
        // No-op: do not call stopDrawing here, as it causes drawing mode to close immediately after starting
      };

      // Add event listeners
      map.on('draw:created', handleDrawCreated);
      map.on('draw:drawstop', handleDrawStop);

      // Store the event handlers for cleanup
      (map as any)._drawEventHandlers = { handleDrawCreated, handleDrawStop };
    }, 0);
  }, [mapRef, cleanupDrawControl, isDrawing]);

  // Stop drawing mode
  const stopDrawing = useCallback(() => {
    console.log('[DRAWING_MODE] stopDrawing called');
    const map = mapRef.current;
    
    // Remove event listeners if they exist
    if (map && (map as any)._drawEventHandlers) {
      const { handleDrawCreated, handleDrawStop } = (map as any)._drawEventHandlers;
      map.off('draw:created', handleDrawCreated);
      map.off('draw:drawstop', handleDrawStop);
      delete (map as any)._drawEventHandlers;
    }
    
    cleanupDrawControl();
  }, [cleanupDrawControl]);

  return {
    isDrawing,
    currentTool,
    startDrawing,
    stopDrawing,
  };
} 