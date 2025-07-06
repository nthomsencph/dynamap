import React from 'react';
import type { PanelEntry } from '@/app/contexts/PanelStackContext';
import { LocationPanel } from './elements/LocationPanel';
import { RegionPanel } from './elements/RegionPanel';
import { SearchPanel } from './globals/SearchPanel';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

interface PanelRouterProps {
  entry: PanelEntry;
  onClose: () => void;
  onBack?: () => void;
  onElementClick: (element: Location | Region) => void;
}

export function PanelRouter({ 
  entry, 
  onClose, 
  onBack,
  onElementClick
}: PanelRouterProps) {
  // Route to the appropriate panel based on entry type
  switch (entry.elementType) {
    case 'search':
      return (
        <SearchPanel
          onClose={onClose}
          onElementClick={onElementClick}
        />
      );
    
    case 'location':
      return (
        <LocationPanel
          location={entry.element as Location}
          onClose={onClose}
          onBack={onBack}
        />
      );
    
    case 'region':
      return (
        <RegionPanel
          region={entry.element as Region}
          onClose={onClose}
          onBack={onBack}
        />
      );
    
    default:
      // This should never happen, but provides a fallback
      console.warn(`Unknown panel type: ${entry.elementType}`);
      return null;
  }
}

 