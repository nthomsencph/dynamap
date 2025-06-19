import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import '@/css/ui/scale-bar.css';
import { useMapSettings } from '../map/MapSettingsContext';

const BASE_PIXELS = 115;
const BASE_ZOOM = -1;

export const ScaleBar: React.FC = () => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const { mapScale } = useMapSettings();

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoom', onZoom);
    return () => {
      map.off('zoom', onZoom);
    };
  }, []);

  // mapScale is km per pixel at BASE_ZOOM
  const km = mapScale * BASE_PIXELS / Math.pow(2, zoom - BASE_ZOOM);

  return (
    <div className="custom-scale-bar-container">
      <div className="custom-scale-bar" style={{ width: BASE_PIXELS }} />
      <div className="custom-scale-label">{Math.round(km).toLocaleString()} km</div>
    </div>
  );
}; 