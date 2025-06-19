import { ImageOverlay } from "react-leaflet";
import { useMapSettings } from './MapSettingsContext';
import { useEffect, useState } from 'react';

export function MapImage() {
  const { mapImage, mapImageSettings, mapImageRoundness } = useMapSettings();
  const [imageBounds, setImageBounds] = useState<[[number, number], [number, number]]>([[0, 0], [2000, 2000]]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Update CSS custom property for border color
  useEffect(() => {
    if (mapImageSettings.showBorder) {
      document.documentElement.style.setProperty('--map-border-color', mapImageSettings.borderColor);
    }
  }, [mapImageSettings.showBorder, mapImageSettings.borderColor]);

  // Calculate bounds based on settings
  useEffect(() => {
    if (!mapImage) return;

    const img = new Image();
    img.onload = () => {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      let bounds: [[number, number], [number, number]];
      
      switch (mapImageSettings.size) {
        case 'cover':
          // Cover the entire map area (2000x2000)
          bounds = [[0, 0], [2000, 2000]];
          break;
        case 'contain':
          // Fit within the map area while maintaining aspect ratio
          const mapAspect = 2000 / 2000; // 1:1
          const imgAspect = imgWidth / imgHeight;
          
          let fitWidth, fitHeight;
          if (imgAspect > mapAspect) {
            // Image is wider, fit to width
            fitWidth = 2000;
            fitHeight = 2000 / imgAspect;
          } else {
            // Image is taller, fit to height
            fitHeight = 2000;
            fitWidth = 2000 * imgAspect;
          }
          
          // Center the image
          const offsetX = (2000 - fitWidth) / 2;
          const offsetY = (2000 - fitHeight) / 2;
          bounds = [[offsetY, offsetX], [offsetY + fitHeight, offsetX + fitWidth]];
          break;
        case 'auto':
          // Use original image size, centered
          const offsetXAuto = (2000 - imgWidth) / 2;
          const offsetYAuto = (2000 - imgHeight) / 2;
          bounds = [[offsetYAuto, offsetXAuto], [offsetYAuto + imgHeight, offsetXAuto + imgWidth]];
          break;
        case 'custom':
          // Use custom dimensions
          const customWidth = mapImageSettings.customWidth;
          const customHeight = mapImageSettings.customHeight;
          
          // Calculate position offset based on position setting
          let offsetXCustom = 0;
          let offsetYCustom = 0;
          
          switch (mapImageSettings.position) {
            case 'center':
              offsetXCustom = (2000 - customWidth) / 2;
              offsetYCustom = (2000 - customHeight) / 2;
              break;
            case 'top-left':
              offsetXCustom = 0;
              offsetYCustom = 0;
              break;
            case 'top-center':
              offsetXCustom = (2000 - customWidth) / 2;
              offsetYCustom = 0;
              break;
            case 'top-right':
              offsetXCustom = 2000 - customWidth;
              offsetYCustom = 0;
              break;
            case 'center-left':
              offsetXCustom = 0;
              offsetYCustom = (2000 - customHeight) / 2;
              break;
            case 'center-right':
              offsetXCustom = 2000 - customWidth;
              offsetYCustom = (2000 - customHeight) / 2;
              break;
            case 'bottom-left':
              offsetXCustom = 0;
              offsetYCustom = 2000 - customHeight;
              break;
            case 'bottom-center':
              offsetXCustom = (2000 - customWidth) / 2;
              offsetYCustom = 2000 - customHeight;
              break;
            case 'bottom-right':
              offsetXCustom = 2000 - customWidth;
              offsetYCustom = 2000 - customHeight;
              break;
          }
          
          bounds = [[offsetYCustom, offsetXCustom], [offsetYCustom + customHeight, offsetXCustom + customWidth]];
          break;
        default:
          bounds = [[0, 0], [2000, 2000]];
      }
      
      setImageBounds(bounds);
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      // Fallback to default bounds if image fails to load
      setImageBounds([[0, 0], [2000, 2000]]);
      setImageLoaded(true);
    };
    
    img.src = mapImage;
  }, [mapImage, mapImageSettings]);

  if (!imageLoaded) {
    return null; // Don't render until image is loaded and bounds are calculated
  }
  
  // Create dynamic CSS class name based on border settings
  const borderClass = mapImageSettings.showBorder ? 'map-image-with-border' : 'map-image-no-border';
  
  return (
    <ImageOverlay
      url={mapImage}
      bounds={imageBounds}
      zIndex={1}
      className={`rounded-map ${borderClass}`}
      crossOrigin="anonymous"
      opacity={1}
      interactive={false}
      pane="tilePane"
    />
  );
} 