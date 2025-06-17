import React from 'react';
import type { PanelEntry } from '@/hooks/ui/usePanelStack';
import { LocationPanel } from './LocationPanel';
import { RegionPanel } from './RegionPanel';
import { SearchPanel } from './SearchPanel';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

interface UnifiedPanelProps {
  entry: PanelEntry;
  onClose: () => void;
  onBack?: () => void;
  onElementClick: (element: Location | Region) => void;
  onSearchElementClick?: (element: Location | Region) => void;
  locations: Location[];
  regions: Region[];
}

export function UnifiedPanel({ 
  entry, 
  onClose, 
  onBack,
  onElementClick,
  onSearchElementClick,
  locations,
  regions
}: UnifiedPanelProps) {
  // Handle location clicks
  const handleLocationClick = React.useCallback((location: Location) => {
    onElementClick(location);
  }, [onElementClick]);

  // Handle region clicks
  const handleRegionClick = React.useCallback((region: Region) => {
    onElementClick(region);
  }, [onElementClick]);

  if (entry.elementType === 'search') {
    return (
      <SearchPanel
        locations={locations}
        regions={regions}
        onClose={onClose}
        onElementClick={onSearchElementClick || onElementClick}
      />
    );
  } else if (entry.elementType === 'location') {
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