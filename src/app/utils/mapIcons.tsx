import React from 'react';
import L from 'leaflet';
import { renderToStaticMarkup } from "react-dom/server";
import { ELEMENT_ICONS } from "@/types/elements";
import type { Location } from "@/types/locations";
import { DEFAULT_ICON_SIZE } from '@/types/locations';

// Minimum zoom level for scaling
const MIN_ZOOM = 0;

export function createLocationIcon(loc: Location, zoom: number = 0) {
  const IconComponent = ELEMENT_ICONS[loc.icon]?.icon || ELEMENT_ICONS.MdCastle.icon;
  const baseSize = loc.iconSize || DEFAULT_ICON_SIZE;

  // Scale icon size with map zoom so it appears the same size relative to the map
  const scale = Math.pow(2, zoom - MIN_ZOOM);
  const iconSize = baseSize * scale;

  const iconHtml = renderToStaticMarkup(
    <div className="custom-pin-label-wrapper" style={{ height: `${iconSize}px`, width: `${iconSize}px` }}>
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

export function createLocationLabelDivIcon(location: Location, zoom: number = 0) {
  const baseSize = location.iconSize || DEFAULT_ICON_SIZE;
  // Use the same scaling as in createLocationIcon
  const scale = Math.pow(2, zoom);
  const iconSize = baseSize * scale;
  
  const labelHtml = location.label || location.name || '';
  const labelId = location.id;
  
  // Offset the label by the icon's height so it appears above the icon
  return L.divIcon({
    className: 'map-label-icon',
    html: `<div
      class="map-label custom-pin-label"
      id="${labelId}"
      style="pointer-events: none;"
    >${labelHtml}</div>`,
    iconSize: [1, 1],
    iconAnchor: [0, iconSize], // Bottom center, offset by icon height
  });
} 