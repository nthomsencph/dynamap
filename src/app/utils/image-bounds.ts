import type { MapImageSettings } from '@/app/api/trpc/settings';

export interface ImageBounds {
  bounds: [[number, number], [number, number]];
  loaded: boolean;
}

/**
 * Calculate image bounds based on image dimensions and settings
 */
export function calculateImageBounds(
  imageUrl: string | null,
  mapImageSettings: MapImageSettings
): Promise<ImageBounds> {
  return new Promise(resolve => {
    if (!imageUrl) {
      resolve({
        bounds: [
          [0, 0],
          [2000, 2000],
        ],
        loaded: true,
      });
      return;
    }

    const img = new window.Image();

    img.onload = () => {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      let bounds: [[number, number], [number, number]];

      switch (mapImageSettings.size) {
        case 'cover':
          bounds = [
            [0, 0],
            [2000, 2000],
          ];
          break;

        case 'contain': {
          const mapAspect = 2000 / 2000;
          const imgAspect = imgWidth / imgHeight;
          let fitWidth, fitHeight;

          if (imgAspect > mapAspect) {
            fitWidth = 2000;
            fitHeight = 2000 / imgAspect;
          } else {
            fitHeight = 2000;
            fitWidth = 2000 * imgAspect;
          }

          const offsetX = (2000 - fitWidth) / 2;
          const offsetY = (2000 - fitHeight) / 2;
          bounds = [
            [offsetY, offsetX],
            [offsetY + fitHeight, offsetX + fitWidth],
          ];
          break;
        }

        case 'auto': {
          const offsetXAuto = (2000 - imgWidth) / 2;
          const offsetYAuto = (2000 - imgHeight) / 2;
          bounds = [
            [offsetYAuto, offsetXAuto],
            [offsetYAuto + imgHeight, offsetXAuto + imgWidth],
          ];
          break;
        }

        case 'custom': {
          const customWidth = mapImageSettings.customWidth;
          const customHeight = mapImageSettings.customHeight;
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

          bounds = [
            [offsetYCustom, offsetXCustom],
            [offsetYCustom + customHeight, offsetXCustom + customWidth],
          ];
          break;
        }

        default:
          bounds = [
            [0, 0],
            [2000, 2000],
          ];
      }

      resolve({ bounds, loaded: true });
    };

    img.onerror = () => {
      resolve({
        bounds: [
          [0, 0],
          [2000, 2000],
        ],
        loaded: true,
      });
    };

    img.src = imageUrl;
  });
}
