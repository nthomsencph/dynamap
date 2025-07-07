import { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { useFitZoom } from "@/hooks/view/useFitZoom";
import { useSmoothWheelZoom } from "@/hooks/view/useSmoothWheelZoom";
import { useMapEvents } from "@/hooks/ui/useMapEvents";
import { useUIStore } from "@/stores/uiStore";
import { MAP_CENTER } from '@/constants/map';

export function useMapController() {
  const mapRef = useRef<L.Map | null>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const fitZoom = useFitZoom();
  
  // Zoom state management
  const { currentZoom, setCurrentZoom, isZooming, setIsZooming } = useUIStore();
  const zoomTimeoutRef = useRef<number | undefined>(undefined);

  // Initialize smooth wheel zoom
  useSmoothWheelZoom(mapRef, 50);

  // Map event handlers
  useMapEvents(leafletMap, {
    onZoomStart: () => setIsZooming(true),
    onZoom: (newZoom) => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      zoomTimeoutRef.current = setTimeout(() => {
        setCurrentZoom(newZoom);
      }, 100) as unknown as number;
    },
    onZoomEnd: (zoom) => {
      setIsZooming(false);
      const zoomThreshold = 0.2;
      if (Math.abs(zoom - fitZoom) < zoomThreshold && leafletMap) {
        const threshold = 1e-6;
        const center = leafletMap.getCenter();
        if (
          Math.abs(center.lat - MAP_CENTER[0]) > threshold ||
          Math.abs(center.lng - MAP_CENTER[1]) > threshold
        ) {
          leafletMap.flyTo(MAP_CENTER, fitZoom, { animate: true, duration: 1 });
        }
      }
    },
    onMove: () => {
      // Handle move events if needed
    }
  });

  // Cleanup zoom timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  return {
    mapRef,
    leafletMap,
    setLeafletMap,
    fitZoom,
    currentZoom,
    isZooming
  };
} 