import React, { useRef, useState, useEffect } from 'react';
import { useMapSettings } from '../panels/MapSettingsContext';
import L from 'leaflet';
import type { FogOfWarReveal } from './FogOverlay';

const DEFAULT_RADIUS = 80;

interface FogEditOverlayProps {
  map: L.Map;
  bounds: [[number, number], [number, number]]; // [[y0, x0], [y1, x1]]
}

export function FogEditOverlay({ map, bounds }: FogEditOverlayProps) {
  const { fogOfWarReveals, setFogOfWarReveals, mapImageRoundness } = useMapSettings();
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [painting, setPainting] = useState(false);
  const [isOverImage, setIsOverImage] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Convert map coordinates to image overlay coordinates
  function getMapCoords(latlng: L.LatLng) {
    const [boundsY0, boundsX0] = bounds[0];
    const [boundsY1, boundsX1] = bounds[1];
    
    // Convert latlng to map coordinates
    const x = latlng.lng;
    const y = latlng.lat;
    
    // Check if point is within image bounds
    if (x < boundsX0 || x > boundsX1 || y < boundsY0 || y > boundsY1) {
      return null;
    }
    
    return { x, y };
  }

  // Update cursor position
  const updateCursorPosition = () => {
    if (!cursor || !cursorRef.current || !map) return;

    // Find the image overlay element
    const imageOverlay = document.querySelector('.leaflet-image-layer') as HTMLElement;
    if (!imageOverlay) return;

    const rect = imageOverlay.getBoundingClientRect();
    const mapRect = map.getContainer().getBoundingClientRect();
    
    // Convert map coordinates to screen coordinates
    const [boundsY0, boundsX0] = bounds[0];
    const [boundsY1, boundsX1] = bounds[1];
    
    // Normalize coordinates to 0-1 range within the image bounds
    const normalizedX = (cursor.x - boundsX0) / (boundsX1 - boundsX0);
    const normalizedY = (cursor.y - boundsY0) / (boundsY1 - boundsY0);
    
    // Convert to screen coordinates
    const screenX = rect.left - mapRect.left + normalizedX * rect.width;
    const screenY = rect.top - mapRect.top + normalizedY * rect.height;
    
    // Position cursor preview
    cursorRef.current.style.left = `${screenX - DEFAULT_RADIUS}px`;
    cursorRef.current.style.top = `${screenY - DEFAULT_RADIUS}px`;
  };

  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const coords = getMapCoords(e.latlng);
      if (coords && isOverImage) {
        setPainting(true);
        setFogOfWarReveals([...fogOfWarReveals, { ...coords, radius: DEFAULT_RADIUS }]);
      }
    };

    const handleMapMove = (e: L.LeafletMouseEvent) => {
      const coords = getMapCoords(e.latlng);
      if (coords) {
        setIsOverImage(true);
        setCursor(coords);
        if (painting) {
          setFogOfWarReveals([...fogOfWarReveals, { ...coords, radius: DEFAULT_RADIUS }]);
        }
      } else {
        setIsOverImage(false);
        setCursor(null);
      }
    };

    const handleMapMouseUp = () => {
      setPainting(false);
    };

    // Add event listeners to the map
    map.on('click', handleMapClick);
    map.on('mousemove', handleMapMove);
    map.on('mouseup', handleMapMouseUp);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMapMove);
      map.off('mouseup', handleMapMouseUp);
    };
  }, [map, bounds, fogOfWarReveals, setFogOfWarReveals, painting, isOverImage]);

  // Update cursor position when cursor or map changes
  useEffect(() => {
    updateCursorPosition();
  }, [cursor, map]);

  // Update cursor position on map movement
  useEffect(() => {
    if (!map) return;

    const handleMapViewReset = () => {
      updateCursorPosition();
    };

    map.on('move', handleMapViewReset);
    map.on('zoom', handleMapViewReset);
    map.on('resize', handleMapViewReset);

    return () => {
      map.off('move', handleMapViewReset);
      map.off('zoom', handleMapViewReset);
      map.off('resize', handleMapViewReset);
    };
  }, [map, cursor]);

  return (
    <>
      {/* Cursor preview */}
      {cursor && isOverImage && (
        <div
          ref={cursorRef}
          style={{
            position: 'absolute',
            width: DEFAULT_RADIUS * 2,
            height: DEFAULT_RADIUS * 2,
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 0 24px 8px #000',
            pointerEvents: 'none',
            opacity: 0.7,
            background: 'radial-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0))',
            zIndex: 2000,
          }}
        />
      )}
    </>
  );
} 