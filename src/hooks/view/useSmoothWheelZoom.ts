import { useEffect } from "react";
import L from "leaflet";

export function useSmoothWheelZoom(mapRef: React.RefObject<L.Map | null>, sensitivity = 2) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Check if smoothWheelZoom plugin exists and is properly initialized
    const smoothWheelZoom = (map as any).smoothWheelZoom;
    if (!smoothWheelZoom) {
      console.warn('SmoothWheelZoom plugin not found on map instance');
      return;
    }

    try {
      // Check if enable method exists
      if (typeof smoothWheelZoom.enable === 'function') {
        smoothWheelZoom.enable();
      } else {
        console.warn('SmoothWheelZoom.enable method not found');
      }

      // Check if setSensitivity method exists
      if (typeof smoothWheelZoom.setSensitivity === 'function') {
        smoothWheelZoom.setSensitivity(sensitivity);
      } else {
        console.warn('SmoothWheelZoom.setSensitivity method not found');
      }
    } catch (error) {
      console.warn('Error initializing SmoothWheelZoom:', error);
    }
  }, [mapRef, sensitivity]);
} 