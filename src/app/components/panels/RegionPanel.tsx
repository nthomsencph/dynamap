import React from 'react';
import { BasePanel, createClickHandlers } from './BasePanel';
import type { Region } from '@/types/regions';
import type { Location } from '@/types/locations';
import { useLocations } from '@/hooks/elements/useLocations';
import { useRegions } from '@/hooks/elements/useRegions';
import { isPercentContained, findContainingRegions } from '@/app/utils/containment';
import { pointInPolygon } from '@/app/utils/area';
import '@/css/panels/sidepanel.css';

interface RegionPanelProps {
  region: Region;
  containingRegions?: Region[]; // All regions that contain this one
  onClose: () => void;
  onBack?: () => void;
  onLocationClick?: (location: Location) => void;
  onRegionClick?: (region: Region) => void;
}

export function RegionPanel({ 
  region, 
  containingRegions, 
  onClose, 
  onBack, 
  onLocationClick, 
  onRegionClick
}: RegionPanelProps) {
  const { locations } = useLocations();
  const { regions } = useRegions();
  const { handleLocationClick, handleRegionClick } = React.useMemo(
    () => createClickHandlers(onLocationClick, onRegionClick),
    [onLocationClick, onRegionClick]
  );

  // Render counter to track re-renders
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  // Debug logging in useEffect to avoid re-renders
  React.useEffect(() => {
    console.log('🔍 RegionPanel: Render #', renderCount.current, 'for region:', region.id);
    console.log('🔍 RegionPanel: Props received:', {
      hasOnLocationClick: !!onLocationClick,
      hasOnRegionClick: !!onRegionClick,
      hasHandleLocationClick: !!handleLocationClick,
      hasHandleRegionClick: !!handleRegionClick,
      regionId: region.id,
      containingRegionsCount: containingRegions?.length || 0,
      containingRegionIds: containingRegions?.map(r => r.id) || []
    });
  });

  // Find child regions (fully contained within this region, not self)
  const childRegions = React.useMemo(() => {
    return regions.filter(r =>
      r.id !== region.id &&
      Array.isArray(r.position) && r.position.length > 2 &&
      Array.isArray(region.position) && region.position.length > 2 &&
      isPercentContained(r.position, region.position, 90)
    );
  }, [regions, region]);

  // For each child region, find its locations
  const childRegionLocations = React.useMemo(() => {
    const map: Record<string, Location[]> = {};
    childRegions.forEach(child => {
      map[child.id] = locations.filter(loc =>
        Array.isArray(child.position) && child.position.length > 2 &&
        Array.isArray(loc.position) && loc.position.length === 2 &&
        pointInPolygon(loc.position as [number, number], child.position as [number, number][])
      );
    });
    return map;
  }, [childRegions, locations]);

  // Locations in this region, but not in any child region
  const locationsInRegion = React.useMemo(() => {
    // All locations in this region
    const inThisRegion = locations.filter(loc =>
      Array.isArray(region.position) && region.position.length > 2 &&
      Array.isArray(loc.position) && loc.position.length === 2 &&
      pointInPolygon(loc.position as [number, number], region.position as [number, number][])
    );
    // Exclude those in any child region
    const childLocIds = new Set(
      Object.values(childRegionLocations).flat().map(l => l.id)
    );
    return inThisRegion.filter(loc => !childLocIds.has(loc.id));
  }, [locations, region, childRegionLocations]);

  // Helper function to handle location clicks with containingRegions calculation
  const handleLocationClickWithRegions = (location: Location) => {
    const allContainingRegions = findContainingRegions(location.position, regions);
    
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  // Memoize the location click handler
  const handleLocationItemClick = React.useCallback((location: Location) => {
    console.log('🔍 RegionPanel: Location clicked:', {
      locationId: location.id,
      locationName: location.name,
      hasOnLocationClick: !!onLocationClick,
      hasHandleLocationClick: !!handleLocationClick
    });
    
    if (handleLocationClick) {
      handleLocationClick(location);
    }
  }, [handleLocationClick, onLocationClick, handleLocationClick]);

  // Debug logging for containingRegions and current region
  console.log(
    "DEBUG: containingRegions in RegionPanel",
    containingRegions?.map(r => ({ id: r.id, name: r.name }))
  );
  console.log("DEBUG: current region", { id: region.id, name: region.name });

  // Memoize the regions section render function
  const renderRegionsSection = React.useMemo(() => {
    if (childRegions.length === 0) return null;
    return (
      <div className="regionpanel-regions-section">
        <h3 className="regionpanel-regions-header">Regions</h3>
        <ul className="regionpanel-regions-list">
          {childRegions.map(child => (
            <li key={child.id} className="regionpanel-regions-list-item">
              <div className="regionpanel-region-info" onClick={() => onRegionClick?.(child)} style={{ cursor: 'pointer' }}>
                <span className="regionpanel-region-name">{child.name}</span>
                <span className="regionpanel-region-type">{child.type}</span>
              </div>
              {childRegionLocations[child.id] && childRegionLocations[child.id].length > 0 && (
                <ul className="regionpanel-region-locations-list">
                  {childRegionLocations[child.id].map(loc => (
                    <li key={loc.id} className="regionpanel-region-location-item" onClick={() => handleLocationClickWithRegions(loc)}>
                      <span className="regionpanel-region-location-name">{loc.name}</span>
                      <span className="regionpanel-region-location-type">{loc.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }, [childRegions, childRegionLocations, onRegionClick, handleLocationClickWithRegions]);

  // Memoize the locations section render function
  const renderLocationsSection = React.useMemo(() => {
    if (locationsInRegion.length === 0) return null;

    return (
      <div className="regionpanel-locations-section">
        <h3 className="regionpanel-locations-header">Locations</h3>
        <ul className="regionpanel-locations-list">
          {locationsInRegion.map(location => (
            <li 
              key={location.id}
              className="regionpanel-locations-list-item"
              onClick={() => handleLocationItemClick(location as Location)}
            >
              <div className="regionpanel-location-info">
                <span className="regionpanel-location-name">{location.name}</span>
                <span className="regionpanel-location-type">{location.type}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [locationsInRegion, handleLocationItemClick]);

  return (
    <BasePanel
      element={region}
      onClose={onClose}
      onBack={onBack}
      onLocationClick={handleLocationClick}
      onRegionClick={handleRegionClick}
      containingRegions={containingRegions}
    >
      {renderRegionsSection}
      {renderLocationsSection}
    </BasePanel>
  );
}