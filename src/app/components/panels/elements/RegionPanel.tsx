import React from 'react';
import { BasePanel } from '../BasePanel';
import type { Region } from '@/types/regions';
import type { Location } from '@/types/locations';
import { useRegionChildren } from '@/hooks/queries/useRegionChildren';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { usePanelStack } from '@/app/contexts/PanelStackContext';
import '@/css/panels/sidepanel.css';

interface RegionPanelProps {
  region: Region;
  onClose: () => void;
  onBack?: () => void;
}

export function RegionPanel({ 
  region, 
  onClose, 
  onBack
}: RegionPanelProps) {
  
  const { currentYear } = useTimelineContext();
  const { pushPanel } = usePanelStack();
  const { data: regionChildren } = useRegionChildren({
    regionId: region.id,
    year: currentYear
  });

  const childRegions = regionChildren?.childRegions || [];
  const locationsInRegion = regionChildren?.locationsInRegion || [];

  // Create navigation handlers
  const handleLocationClick = React.useCallback((location: Location) => {
    pushPanel({
      id: location.id,
      elementType: 'location',
      element: location,
      metadata: {}
    });
  }, [pushPanel]);
  
  const handleRegionClick = React.useCallback((region: Region) => {
    pushPanel({
      id: region.id,
      elementType: 'region',
      element: region,
      metadata: {}
    });
  }, [pushPanel]);



  // Memoize the regions section render function
  const renderRegionsSection = React.useMemo(() => {
    if (childRegions.length === 0) return null;
    return (
      <div className="container-section">
        <h3 className="container-header">Regions</h3>
        <ul className="container-list">
          {childRegions.map(childData => (
            <li key={childData.region.id} className="container-item">
              <button 
                className="container-item-info"
                onClick={() => handleRegionClick(childData.region)}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="container-item-name">{childData.region.name}</span>
                <span className="container-item-type">{childData.region.type}</span>
              </button>
              {childData.locations && childData.locations.length > 0 && (
                <ul className="container-children-list">
                  {childData.locations.map(loc => (
                    <li key={loc.id} className="container-child-item">
                      <button 
                        onClick={() => handleLocationClick(loc)}
                        style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <span className="container-child-name">{loc.name}</span>
                        <span className="container-child-type">{loc.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }, [childRegions, handleRegionClick, handleLocationClick]);

  // Memoize the locations section render function
  const renderLocationsSection = React.useMemo(() => {
    if (locationsInRegion.length === 0) return null;

    return (
      <div className="elements-section">
        <h3 className="elements-header">Locations</h3>
        <ul className="elements-list">
          {locationsInRegion.map(location => (
            <li 
              key={location.id}
              className="element-item"
            >
              <button 
                onClick={() => handleLocationClick(location)}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
              >
                <div className="element-info">
                  <span className="element-name">{location.name}</span>
                  <span className="element-type">{location.type}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [locationsInRegion, handleLocationClick]);

  return (
    <BasePanel
      element={region}
      onClose={onClose}
      onBack={onBack}
    >
      {renderRegionsSection}
      {renderLocationsSection}
    </BasePanel>
  );
}