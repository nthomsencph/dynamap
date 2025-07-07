import { useState, useEffect } from 'react';
import {
  calculateImageBounds,
  type ImageBounds,
} from '@/app/utils/image-bounds';
import { useSettings } from '@/hooks/useSettings';

/**
 * Hook to calculate and manage image bounds based on image URL and settings
 */
export function useImageBounds(imageUrl: string | null) {
  const { settings } = useSettings();
  const mapImageSettings = settings?.mapImageSettings;
  const [imageBounds, setImageBounds] = useState<ImageBounds>({
    bounds: [
      [0, 0],
      [2000, 2000],
    ],
    loaded: false,
  });

  useEffect(() => {
    calculateImageBounds(imageUrl, mapImageSettings)
      .then(result => {
        setImageBounds(result);
      })
      .catch(error => {
        console.error('Error calculating image bounds:', error);
        setImageBounds({
          bounds: [
            [0, 0],
            [2000, 2000],
          ],
          loaded: true,
        });
      });
  }, [imageUrl, mapImageSettings]);

  return imageBounds;
}
