import React from 'react';
import L from 'leaflet';
import { renderToStaticMarkup } from "react-dom/server";
import { ELEMENT_ICONS } from "@/types/elements";
import type { Location } from "@/types/locations";
import { DEFAULT_ICON_SIZE } from '@/types/locations';

// Minimum and maximum zoom levels for scaling
const MIN_ZOOM = 0;
const MAX_ZOOM = 2;
// Minimum and maximum icon sizes (adjusted for smaller starting size)
const MIN_ICON_SIZE = 16;
const MAX_ICON_SIZE = 48;

// Calculate icon size based on zoom level and base size
function calculateIconSize(zoom: number, baseSize: number): number {
  // Normalize zoom level between 0 and 1
  const normalizedZoom = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  // Use exponential scaling for smoother transitions
  const scale = Math.pow(2.5, normalizedZoom);
  // Calculate size between min and max
  const size = baseSize * scale;
  // Clamp between min and max sizes
  return Math.min(Math.max(size, MIN_ICON_SIZE), MAX_ICON_SIZE);
}

export function createLocationIcon(loc: Location, zoom: number = 0) {
  const IconComponent = ELEMENT_ICONS[loc.icon]?.icon || ELEMENT_ICONS.MdCastle.icon;
  const labelHtml = loc.label || loc.name || '';
  const baseSize = loc.iconSize || DEFAULT_ICON_SIZE;
  const iconSize = calculateIconSize(zoom, baseSize);
  
  const iconHtml = renderToStaticMarkup(
    <div className="custom-pin-label-wrapper" style={{ height: `${iconSize}px`, width: `${iconSize}px` }}>
      {(loc.showLabel !== false) && labelHtml && (
        <span className="custom-pin-label" dangerouslySetInnerHTML={{ __html: labelHtml }} />
      )}
      <IconComponent color={loc.color || "#2563eb"} size={iconSize} />
    </div>
  );
  
  return L.divIcon({
    className: 'custom-pin',
    html: iconHtml,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize],
  });
} 