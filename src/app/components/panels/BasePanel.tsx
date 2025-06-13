import React, { useEffect, ReactNode, useRef, useLayoutEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import '@/css/panels/sidepanel.css';
import type { MapElement } from '@/types/elements';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import { useLocations } from '@/hooks/elements/useLocations';
import { useRegions } from '@/hooks/elements/useRegions';
import { pointInPolygon } from '@/app/utils/area';

// Helper function to find locations within a region
export const findLocationsInRegion = (locations: MapElement[], region: MapElement) =>
  Array.isArray(region.position) 
    ? locations.filter(loc => pointInPolygon(loc.position as [number, number], region.position as [number, number][]))
    : [];

// Helper function to create type-safe click handlers
export const createClickHandlers = (
  onLocationClick?: (location: Location) => void,
  onRegionClick?: (region: Region) => void
) => {
  const handlers = {
    handleLocationClick: onLocationClick ? (e: MapElement) => onLocationClick(e as Location) : undefined,
    handleRegionClick: onRegionClick ? (e: MapElement) => onRegionClick(e as Region) : undefined
  };

  return handlers;
};

export interface BasePanelProps {
  element: MapElement;
  onClose: () => void;
  onBack?: () => void;
  onLocationClick?: (location: MapElement) => void;
  onRegionClick?: (region: MapElement) => void;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
  containingRegions?: Region[]; // All regions that contain this element
}

export function BasePanel({ 
  element, 
  onClose, 
  onBack, 
  onLocationClick, 
  onRegionClick,
  className = '',
  contentClassName = '',
  children,
  containingRegions
}: BasePanelProps) {
  const { locations } = useLocations();
  const { regions } = useRegions();
  const locationsRef = useRef(locations);
  const regionsRef = useRef(regions);

  // Update refs when data changes
  useEffect(() => {
    locationsRef.current = locations;
    regionsRef.current = regions;
  }, [locations, regions]);

  // Handle click on a mention
  const handleMentionClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const mentionId = target.getAttribute('data-id');
    const mentionType = target.getAttribute('data-element-type');
    if (!mentionId) return;

    const element = mentionType === 'region' 
      ? regionsRef.current.find(r => r.id === mentionId)
      : locationsRef.current.find(l => l.id === mentionId);

    if (element) {
      mentionType === 'region' ? onRegionClick?.(element) : onLocationClick?.(element);
    }
  };

  // Add click handlers to mentions
  useEffect(() => {
    const container = document.querySelector('.panel-description');
    if (!container || !element?.description) return;

    const handleClick = (e: Event) => {
      if ((e.target as HTMLElement).classList.contains('mention')) {
        handleMentionClick(e);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [element?.description, onRegionClick, onLocationClick]);

  // Handle wheel events on backdrop
  const handleBackdropWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Prevent body scrolling when panel is open
  useEffect(() => {
    // Global wheel event handler to prevent map zooming when panels are open
    const handleGlobalWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const isInPanel = target.closest('.sidepanel') || target.closest('.sidepanel-backdrop');
      
      if (isInPanel) {
        // Check if the target is inside scrollable content
        const scrollableContainer = target.closest('.sidepanel-content');
        if (scrollableContainer) {
          const container = scrollableContainer as HTMLElement;
          // Check if the container is actually scrollable
          if (container.scrollHeight > container.clientHeight) {
            // Allow scrolling within the panel content but prevent bubbling to map
            e.stopPropagation();
            return;
          }
        }
        
        // Prevent the event from bubbling up to the map
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
    };

    // Only attach the global listener if it's not already attached
    if (!(document as any).__wheelListenerAttached) {
      document.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
      (document as any).__wheelListenerAttached = true;
    }
    
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Only remove the global listener if no panels are left
      const remainingPanels = document.querySelectorAll('.sidepanel');
      if (remainingPanels.length === 0) {
        document.removeEventListener('wheel', handleGlobalWheel, { capture: true });
        (document as any).__wheelListenerAttached = false;
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Create path pills for regional hierarchy
  const pathPills = React.useMemo(() => {
    if (!containingRegions || containingRegions.length === 0) return [];

    // Deduplicate by region.id and exclude the current element
    const seen = new Set<string>();
    const parentPills = [];
    // For hierarchy display, we want largest (outermost) to smallest (innermost)
    // But containingRegions is sorted smallest first, so we need to reverse it
    const reversedRegions = [...containingRegions].reverse();

    for (const r of reversedRegions) {
      if (r.id !== element.id && !seen.has(r.id)) {
        parentPills.push({ region: r, isClickable: true });
        seen.add(r.id);
      }
    }

    // Limit to last 4 parent pills
    return parentPills.slice(-4);
  }, [containingRegions, element.id]);

  // Memoize the path pills section render function
  const renderPathPillsSection = React.useMemo(() => {
    if (!pathPills || pathPills.length === 0) {
      return null;
    }

    console.log('🔍 Rendering pill path with', pathPills.length, 'pills:', pathPills.map(p => p.region.name));

    return (
      <div className="path-section">
        <div className="path-pills">
          {pathPills.map((pill, index) => (
            <React.Fragment key={pill.region.id}>
              <button 
                className="path-pill path-pill--parent"
                onClick={() => onRegionClick?.(pill.region)}
                title={pill.region.name || 'Unknown'}
              >
                <span className="path-pill-name">
                  {(pill.region.name || 'Unknown').length > 12 
                    ? `${(pill.region.name || 'Unknown').substring(0, 12)}...` 
                    : (pill.region.name || 'Unknown')
                  }
                </span>
              </button>
              <div className="path-separator">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path 
                    d="M6 4L10 8L6 12" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </React.Fragment>
          ))}
          <div className="path-pill path-pill--current">
            <span className="path-pill-name">
              {(element.name || 'Unknown').length > 15 
                ? `${(element.name || 'Unknown').substring(0, 15)}...` 
                : (element.name || 'Unknown')
              }
            </span>
          </div>
        </div>
      </div>
    );
  }, [pathPills, element, onRegionClick]);

  // Scroll pill path to the right end to show current element
  React.useEffect(() => {
    if (pathPills && pathPills.length > 0) {
      const pillContainer = document.querySelector('.path-pills');
      if (pillContainer) {
        console.log('🔍 Found pill container, scrolling to end');
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          pillContainer.scrollLeft = pillContainer.scrollWidth;
        }, 0);
      } else {
        console.log('🔍 Pill container not found');
      }
    }
  }, [pathPills]);

  return (
    <div 
      className={`sidepanel-backdrop`} 
      onClick={onClose}
      onWheel={handleBackdropWheel}
    >
      <div 
        className={`sidepanel ${className}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className={`sidepanel-content ${contentClassName}`}>
          <div className="sidepanel-topbar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
              <div className="sidepanel-header" style={{ marginBottom: 0 }}>
            <button className="sidepanel-back-button" onClick={onBack}>
              <IoArrowBack size={22} />
            </button>
          </div>
        )}
            {renderPathPillsSection}
          </div>
          {element.image && (
            <div className="sidepanel-image">
              <img src={element.image} alt={element.name} />
            </div>
          )}

          <div className="sidepanel-header-section">
            <h2 className="sidepanel-title">{element.name}</h2>
            <div className="sidepanel-type">{element.type}</div>
          </div>

          {(Object.keys(element.fields || {}).length > 0) && (
            <div className="sidepanel-fields">
              <table className="fields-table">
                <tbody>
                  {Object.entries(element.fields || {}).map(([key, value]) => (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {element.description && (
            <div className="sidepanel-description rich-text-content">
              <div 
                className="panel-description"
                dangerouslySetInnerHTML={{ __html: element.description }}
              />
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
} 