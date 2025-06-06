import { ImageOverlay } from "react-leaflet";
import { MAP_BOUNDS } from '@/constants/map';

export function MapImage() {
  return (
    <ImageOverlay
      url="/media/map.jpg"
      bounds={MAP_BOUNDS}
      zIndex={1}
      className="rounded-map"
      crossOrigin="anonymous"
      opacity={1}
      interactive={false}
      pane="tilePane"
    />
  );
} 