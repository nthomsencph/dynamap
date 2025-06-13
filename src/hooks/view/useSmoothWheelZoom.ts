import { useEffect } from "react";
import L from "leaflet";

export function useSmoothWheelZoom(mapRef: React.RefObject<L.Map | null>, sensitivity = 2) {
  useEffect(() => {
    const map = mapRef.current;
    if (map && (map as any).smoothWheelZoom) {
      (map as any).smoothWheelZoom.enable();
      (map as any).smoothWheelZoom.setSensitivity(sensitivity);
    }
  }, [sensitivity]);
} 