import L from 'leaflet';

/**
 * Fly the map to a given [lat, lng] position.
 * @param map Leaflet map instance
 * @param position [lat, lng] array
 * @param zoom Optional zoom level
 */
export function flyToLocation(map: L.Map, position: [number, number], zoom?: number) {
  if (!map) return;
  map.flyTo(L.latLng(position[0], position[1]), zoom ?? map.getZoom(), {
    animate: true,
    duration: 0.7,
  });
}

/**
 * Get the current center of the map as [lat, lng].
 * @param map Leaflet map instance
 * @returns [lat, lng] array
 */
export function getMapCenter(map: L.Map): [number, number] {
  const center = map.getCenter();
  return [center.lat, center.lng];
}

/**
 * Fly to a location, offsetting the map center so the location appears centered in the visible area (accounting for a side panel).
 * @param map Leaflet map instance
 * @param position [lat, lng] array
 * @param panelWidthPx Width of the side panel in pixels
 * @param zoom Optional zoom level
 */
export function flyToLocationWithPanel(map: L.Map, position: [number, number], panelWidthPx: number, zoom?: number) {
  if (!map) return;
  const mapSize = map.getSize();
  const point = map.latLngToContainerPoint(L.latLng(position[0], position[1]));
  // The visual center is at (panelWidth/2 + (mapWidth - panelWidth)/2, mapHeight/2)
  const visualCenterX = panelWidthPx + (mapSize.x - panelWidthPx) / 2;
  const visualCenterY = mapSize.y / 2;
  // Calculate the offset between the current center and the visual center
  const mapCenter = map.latLngToContainerPoint(map.getCenter());
  const offsetX = visualCenterX - mapCenter.x;
  const offsetY = visualCenterY - mapCenter.y;
  // Move the location's point by this offset
  const newPoint = L.point(point.x + offsetX, point.y + offsetY);
  const newLatLng = map.containerPointToLatLng(newPoint);
  map.flyTo(newLatLng, zoom ?? map.getZoom(), {
    animate: true,
    duration: 0.7,
  });
} 