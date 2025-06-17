import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapSettings } from '../panels/MapSettingsContext';

export interface FogOfWarReveal {
  x: number;
  y: number;
  radius: number;
}

interface FogOverlayProps {
  reveals: FogOfWarReveal[];
  map: L.Map;
  bounds: [[number, number], [number, number]]; // [[y0, x0], [y1, x1]]
}

// Covers the map area (2000x2000 in map coordinates)
export function FogOverlay({ reveals, map, bounds }: FogOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mapImageRoundness } = useMapSettings();

  const updateFogOverlay = () => {
    if (!map) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find the image overlay element
    const imageOverlay = document.querySelector('.leaflet-image-layer') as HTMLElement;
    if (!imageOverlay) return;

    // Get the image overlay's position and size
    const rect = imageOverlay.getBoundingClientRect();
    const mapRect = map.getContainer().getBoundingClientRect();
    
    // Position canvas to match the image overlay exactly
    canvas.style.position = 'absolute';
    canvas.style.left = `${rect.left - mapRect.left}px`;
    canvas.style.top = `${rect.top - mapRect.top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Apply border radius to match the map image
    const borderRadius = (mapImageRoundness / 2) * (rect.width / 100); // Convert percentage to pixels
    canvas.style.borderRadius = `${borderRadius}px`;

    // Fill with fog
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw reveals
    for (const { x, y, radius } of reveals) {
      // Convert map coordinates to image overlay coordinates
      // Bounds format: [[y0, x0], [y1, x1]]
      const [boundsY0, boundsX0] = bounds[0]; // [y0, x0]
      const [boundsY1, boundsX1] = bounds[1]; // [y1, x1]
      
      // Normalize coordinates to 0-1 range within the image bounds
      const normalizedX = (x - boundsX0) / (boundsX1 - boundsX0);
      const normalizedY = (y - boundsY0) / (boundsY1 - boundsY0);
      
      // Convert to canvas coordinates
      const cx = normalizedX * rect.width;
      const cy = normalizedY * rect.height;
      
      // Scale radius to match the image overlay
      const scaledRadius = radius * (rect.width / (boundsX1 - boundsX0));
      
      // 1. Erase the center
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, scaledRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
      
      // 2. Feathered edge
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, scaledRadius);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.2)');
      gradient.addColorStop(0.85, 'rgba(0,0,0,0.5)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.beginPath();
      ctx.arc(cx, cy, scaledRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  useEffect(() => {
    if (!map) return;

    // Initial update
    updateFogOverlay();

    // Add event listeners for map movement
    map.on('move', updateFogOverlay);
    map.on('zoom', updateFogOverlay);
    map.on('resize', updateFogOverlay);

    return () => {
      map.off('move', updateFogOverlay);
      map.off('zoom', updateFogOverlay);
      map.off('resize', updateFogOverlay);
    };
  }, [map, bounds, reveals, mapImageRoundness]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
} 