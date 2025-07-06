import React from 'react';
import { useMap } from 'react-leaflet';
import '@/css/ui/scale-bar.css';
import { useSettings } from '@/hooks/useSettings';
import { useUIStore } from '@/stores/uiStore';
import { useMapEvents } from '@/hooks/ui/useMapEvents';

const BASE_PIXELS = 115;
const BASE_ZOOM = -1;

export const ScaleBar: React.FC = () => {
  const map = useMap();
  const { currentZoom, setCurrentZoom } = useUIStore();
  const { settings } = useSettings();
  const { mapScale = 17.4 } = settings || {};

  // Use the new map events hook instead of useEffect
  useMapEvents(map, {
    onZoom: setCurrentZoom,
  });

  // mapScale is km per pixel at BASE_ZOOM
  const km = mapScale * BASE_PIXELS / Math.pow(2, currentZoom - BASE_ZOOM);

  return (
    <div className="custom-scale-bar-container">
      <div className="custom-scale-bar" style={{ width: BASE_PIXELS }} />
      <div className="custom-scale-label">{Math.round(km).toLocaleString()} km</div>
    </div>
  );
}; 