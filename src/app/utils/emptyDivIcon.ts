import L from 'leaflet';

export const emptyDivIcon = L.divIcon({
  className: '', // No class, no icon
  html: '',      // No HTML
  iconSize: [1, 1], // Smallest possible
  iconAnchor: [0, 0],
}); 