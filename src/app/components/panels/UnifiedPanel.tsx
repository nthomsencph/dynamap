import React from 'react';
import type { PanelEntry } from '@/hooks/ui/usePanelStack';
import { LocationPanel } from './LocationPanel';
import { RegionPanel } from './RegionPanel';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

interface UnifiedPanelProps {
  entry: PanelEntry;
  onClose: () => void;
  onBack?: () => void;
  onElementClick: (element: Location | Region) => void;
}

export function UnifiedPanel({ 
  entry, 
  onClose, 
  onBack,
  onElementClick 
}: UnifiedPanelProps) {
  // Handle location clicks
  const handleLocationClick = React.useCallback((location: Location) => {
    onElementClick(location);
  }, [onElementClick]);

  // Handle region clicks
  const handleRegionClick = React.useCallback((region: Region) => {
    onElementClick(region);
  }, [onElementClick]);

  if (entry.elementType === 'location') {
    return (
      <LocationPanel
        location={entry.element as Location}
        containingRegions={entry.metadata?.containingRegions}
        onClose={onClose}
        onBack={onBack}
        onLocationClick={handleLocationClick}
        onRegionClick={handleRegionClick}
      />
    );
  } else {
    return (
      <RegionPanel
        region={entry.element as Region}
        containingRegions={entry.metadata?.containingRegions}
        onClose={onClose}
        onBack={onBack}
        onLocationClick={handleLocationClick}
        onRegionClick={handleRegionClick}
      />
    );
  }
} 