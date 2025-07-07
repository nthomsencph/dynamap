import React, { useEffect, ReactNode, useRef, useCallback } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import '@/css/panels/sidepanel.css';
import type { MapElement } from '@/types/elements';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import { useMapElementsByYear } from '@/hooks/queries/useMapElements';
import { usePanelWidth } from '@/hooks/ui/usePanelWidth';
import { pointInPolygon } from '@/app/utils/geometry';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { usePanelStack } from '@/app/contexts/PanelStackContext';
import { calculateDisplayYear } from '@/app/utils/timeline';
import { toast } from 'react-toastify';
import { useContainingRegions } from '@/hooks/queries/useContainingRegions';
import Image from 'next/image';

// Helper function to find locations within a region
export const findLocationsInRegion = (
  locations: MapElement[],
  region: MapElement
) => {
  if (region.elementType !== 'region') return [];

  const regionGeom = (region as any).geom as [number, number][];
  if (!Array.isArray(regionGeom)) return [];

  return locations.filter(loc => {
    if (loc.elementType !== 'location') return false;
    const locGeom = (loc as any).geom as [number, number];
    return pointInPolygon(locGeom, regionGeom);
  });
};

export interface BasePanelProps {
  element: MapElement;
  onClose: () => void;
  onBack?: () => void;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
}

export function BasePanel({
  element,
  onClose,
  onBack,
  className = '',
  contentClassName = '',
  children,
}: BasePanelProps) {
  const { currentYear, currentEpoch } = useTimelineContext();
  const { pushPanel } = usePanelStack();
  const { locations, regions } = useMapElementsByYear(currentYear);
  const locationsRef = useRef(locations);
  const regionsRef = useRef(regions);

  // Get containing regions using the hook
  const { data: containingRegions = [] } = useContainingRegions(
    element as Location | Region
  );

  // Create navigation handlers using panel stack context
  const handleLocationClick = useCallback(
    (location: MapElement) => {
      pushPanel({
        id: location.id,
        elementType: 'location',
        element: location as Location,
        metadata: {},
      });
    },
    [pushPanel]
  );

  const handleRegionClick = useCallback(
    (region: MapElement) => {
      pushPanel({
        id: region.id,
        elementType: 'region',
        element: region as Region,
        metadata: {},
      });
    },
    [pushPanel]
  );

  // Panel width management
  const { width, handleMouseDown } = usePanelWidth();

  // Update refs when data changes
  useEffect(() => {
    locationsRef.current = locations;
    regionsRef.current = regions;
  }, [locations, regions]);

  // Handle click on a mention
  const handleMentionClick = useCallback(
    (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      const mentionId = target.getAttribute('data-id');
      const mentionName = target.getAttribute('data-name');
      const mentionType = target.getAttribute('data-element-type');
      if (!mentionId || !mentionName) return;

      const element =
        mentionType === 'region'
          ? regionsRef.current.find(r => r.id === mentionId)
          : locationsRef.current.find(l => l.id === mentionId);

      if (element) {
        mentionType === 'region'
          ? handleRegionClick(element)
          : handleLocationClick(element);
      } else {
        // Element doesn't exist in current year - show tooltip
        const displayYear = currentEpoch
          ? calculateDisplayYear(currentYear, currentEpoch)
          : currentYear;
        const yearLabel = currentEpoch
          ? `${currentEpoch.yearPrefix || ''} ${displayYear} ${currentEpoch.yearSuffix || ''}`.trim()
          : displayYear;

        toast.info(
          `${mentionName} doesn't exist in the current year (${yearLabel})`,
          {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }
    },
    [handleRegionClick, handleLocationClick, currentYear, currentEpoch]
  );

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
  }, [
    element?.description,
    handleRegionClick,
    handleLocationClick,
    currentYear,
    currentEpoch,
    handleMentionClick,
  ]);

  // Add visual styling for deleted mentions
  useEffect(() => {
    const container = document.querySelector('.panel-description');
    if (!container || !element?.description) return;

    const mentions = container.querySelectorAll('.mention');
    mentions.forEach(mention => {
      const mentionId = mention.getAttribute('data-id');
      const mentionType = mention.getAttribute('data-element-type');

      if (mentionId) {
        const elementExists =
          mentionType === 'region'
            ? regionsRef.current.some(r => r.id === mentionId)
            : locationsRef.current.some(l => l.id === mentionId);

        if (!elementExists) {
          mention.classList.add('mention-deleted');
        } else {
          mention.classList.remove('mention-deleted');
        }
      }
    });
  }, [element?.description, locations, regions]);

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
      const isInPanel =
        target.closest('.sidepanel') || target.closest('.sidepanel-backdrop');

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
      document.addEventListener('wheel', handleGlobalWheel, {
        passive: false,
        capture: true,
      });
      (document as any).__wheelListenerAttached = true;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      // Only remove the global listener if no panels are left
      const remainingPanels = document.querySelectorAll('.sidepanel');
      if (remainingPanels.length === 0) {
        document.removeEventListener('wheel', handleGlobalWheel, {
          capture: true,
        });
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

    return (
      <div className="path-section">
        <div className="path-pills">
          {pathPills.map((pill, index) => (
            <React.Fragment key={pill.region.id}>
              <button
                className="path-pill path-pill--parent"
                onClick={() => handleRegionClick(pill.region)}
                title={pill.region.name || 'Unknown'}
              >
                <span className="path-pill-name">
                  {(pill.region.name || 'Unknown').length > 12
                    ? `${(pill.region.name || 'Unknown').substring(0, 12)}...`
                    : pill.region.name || 'Unknown'}
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
                : element.name || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    );
  }, [pathPills, element, handleRegionClick]);

  // Scroll pill path to the right end to show current element
  React.useEffect(() => {
    if (pathPills && pathPills.length > 0) {
      const pillContainer = document.querySelector('.path-pills');
      if (pillContainer) {
        setTimeout(() => {
          pillContainer.scrollLeft = pillContainer.scrollWidth;
        }, 0);
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
        style={{ width: `${width}px` }}
      >
        {/* Draggable handle */}
        <div
          className="sidepanel-drag-handle"
          onMouseDown={handleMouseDown}
          style={{ cursor: 'col-resize' }}
        />

        <div className={`sidepanel-content ${contentClassName}`}>
          <div
            className="sidepanel-topbar"
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            {onBack && (
              <div className="sidepanel-header" style={{ marginBottom: 0 }}>
                <button className="sidepanel-back-button" onClick={onBack}>
                  <IoArrowBack size={22} />
                </button>
              </div>
            )}
            {renderPathPillsSection}
          </div>
          {typeof element.image === 'string' && (
            <div className="sidepanel-image">
              <Image
                src={element.image || ''}
                alt={element.name || ''}
                width={400}
                height={400}
              />
            </div>
          )}

          <div className="sidepanel-header-section">
            <h2 className="sidepanel-title">{element.name}</h2>
            <div className="sidepanel-type">{element.type}</div>
          </div>

          {Object.keys(element.fields || {}).length > 0 && (
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
