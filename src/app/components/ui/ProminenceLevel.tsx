import React from 'react';
import { useFitZoom } from '@/hooks/view/useFitZoom';
import { calculateProminenceLevel } from '@/app/utils/zoom';
import { useMap } from 'react-leaflet';
import '@/css/ui/prominence-level.css';

export function ProminenceLevel() {
  const map = useMap();
  const fitZoom = useFitZoom();
  const [currentZoom, setCurrentZoom] = React.useState(map.getZoom());

  // Update current zoom when map zoom changes
  React.useEffect(() => {
    const onZoom = () => setCurrentZoom(map.getZoom());
    map.on('zoom', onZoom);
    // Set initial zoom
    setCurrentZoom(map.getZoom());
    return () => {
      map.off('zoom', onZoom);
    };
  }, []); // Removed map dependency to prevent infinite loop

  const prominenceLevel = calculateProminenceLevel(currentZoom, fitZoom);

  return (
    <div className="prominence-level">
      Prominence level: {prominenceLevel.toFixed(2)}
    </div>
  );
} 