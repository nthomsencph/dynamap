import { useCallback } from 'react';
import L from 'leaflet';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import { getOptimalZoomForElement, calculateProminenceLevel } from '@/app/utils/zoom';
import { flyToLocation } from '@/app/utils/fly';
import { getElementCenter } from '@/app/utils/area';

interface UseSearchPanelZoomProps {
  mapRef: React.RefObject<L.Map | null>;
  fitZoom: number;
  pushPanel: (entry: any) => void;
}

export function useSearchPanelZoom({ mapRef, fitZoom, pushPanel }: UseSearchPanelZoomProps) {
  const handleSearchElementClick = useCallback((element: Location | Region) => {
    const entry = {
      id: element.id,
      elementType: element.elementType,
      element,
      metadata: element.elementType === 'region' ? {
        containingRegions: (element as any).containingRegions,
        regionToDisplay: (element as any).regionToDisplay
      } : {
        containingRegions: (element as any).containingRegions
      }
    };
    pushPanel(entry);

    // Center and zoom to the element ONLY if coming from search panel
    if (mapRef.current) {
      // Check if the element's upper prominence is lower than current prominence level
      const currentProminence = calculateProminenceLevel(mapRef.current.getZoom(), fitZoom);
      
      if (element.prominence.upper < currentProminence) {
        // Get the center position using the utility function
        const targetPosition = getElementCenter(element);

        // Calculate optimal zoom level based on prominence
        const targetZoom = getOptimalZoomForElement(element.prominence.upper, fitZoom);

        // Use the flyToLocation utility function to navigate to the target
        flyToLocation(mapRef.current, targetPosition, targetZoom);
      }
    }
  }, [pushPanel, fitZoom, mapRef]);

  return { handleSearchElementClick };
} 