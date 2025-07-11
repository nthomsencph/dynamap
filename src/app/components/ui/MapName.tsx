'use client';

import React from 'react';
import { useMap } from 'react-leaflet';
import { useSettings } from '@/hooks/useSettings';
import { useUIStore } from '@/stores/uiStore';
import { useFitZoom } from '@/hooks/view/useFitZoom';
import { useMapEvents } from '@/hooks/ui/useMapEvents';
import '@/css/ui/map-name.css';

export function MapName() {
  const map = useMap();
  const { settings } = useSettings();
  const { mapNameSettings } = settings || {};
  const { currentZoom, setCurrentZoom } = useUIStore();
  const fitZoom = useFitZoom();

  // Use the new map events hook instead of useEffect
  useMapEvents(map, {
    onZoom: setCurrentZoom,
  });

  if (!mapNameSettings.show || !mapNameSettings.content.trim()) {
    return null;
  }

  // Calculate opacity for center position
  const getOpacity = () => {
    if (mapNameSettings.position !== 'center') return 1;

    // Fade out quickly as zoom increases from fitZoom
    const fadeStartZoom = fitZoom + 0.1; // Start fading very soon after fitZoom
    const fadeEndZoom = fitZoom + 0.3; // End fading quickly (0.2 zoom levels later)

    if (currentZoom <= fadeStartZoom) return 1;
    if (currentZoom >= fadeEndZoom) return 0;

    const fadeRange = fadeEndZoom - fadeStartZoom;
    const currentFade = currentZoom - fadeStartZoom;
    return 1 - currentFade / fadeRange;
  };

  const opacity = getOpacity();

  // Don't render if completely transparent
  if (opacity <= 0) return null;

  const getPositionClass = () => {
    switch (mapNameSettings.position) {
      case 'center':
        return 'map-name-center';
      case 'top-left':
        return 'map-name-top-left';
      case 'top-right':
        return 'map-name-top-right';
      case 'bottom-right':
        return 'map-name-bottom-right';
      case 'bottom-left':
        return 'map-name-bottom-left';
      default:
        return 'map-name-center';
    }
  };

  return (
    <div
      className={`map-name ${getPositionClass()}`}
      style={{ opacity }}
      dangerouslySetInnerHTML={{ __html: mapNameSettings.content }}
    />
  );
}
