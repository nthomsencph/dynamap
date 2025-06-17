import React from 'react';
import { BasePanel, createClickHandlers } from './BasePanel';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import type { MapElement } from '@/types/elements';

interface LocationPanelProps {
  location: Location;
  containingRegions?: Region[]; // All regions that contain this location
  onClose: () => void;
  onBack?: () => void;
  onLocationClick?: (location: Location) => void;
  onRegionClick?: (region: Region) => void;
}

export function LocationPanel({ 
  location, 
  containingRegions,
  onClose, 
  onBack, 
  onLocationClick, 
  onRegionClick
}: LocationPanelProps) {
  // Use useCallback instead of useMemo to create stable handlers
  const handleLocationClick = React.useCallback(
    (location: MapElement) => onLocationClick?.(location as Location),
    [onLocationClick]
  );

  const handleRegionClick = React.useCallback(
    (region: MapElement) => onRegionClick?.(region as Region),
    [onRegionClick]
  );
  
  return (
    <BasePanel
      element={location}
      onClose={onClose}
      onBack={onBack}
      onLocationClick={handleLocationClick}
      onRegionClick={handleRegionClick}
      containingRegions={containingRegions}
    />
  );
} 