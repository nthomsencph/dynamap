import React, { useEffect, useState } from 'react';
import type { Region } from '@/types/regions';
import type { Location } from '@/types/locations';
import { Lightbox } from '@/app/components/ui/Lightbox';
import { useRegions } from '@/hooks/elements/useRegions';
import { IoArrowBack } from 'react-icons/io5';
import '@/css/panels/sidepanel.css';
import { useLocations } from '@/hooks/elements/useLocations';
import { ELEMENT_ICONS } from '@/types/elements';
import { pointInPolygon } from '@/app/utils/area';

interface RegionPanelProps {
  region: Region | null;
  onClose: () => void;
  onRegionClick?: (region: Region) => void;
  onBack?: () => void;
  onLocationClick?: (location: Location) => void;
}

// Remove leading '@' from mentions in the HTML string
function removeAtFromMentions(html: string): string {
  return html.replace(/(<span[^>]*class=\"mention\"[^>]*>)@/g, '$1');
}

export function RegionPanel({ region, onClose, onRegionClick, onBack, onLocationClick }: RegionPanelProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const { regions } = useRegions();
  const { locations } = useLocations();

  // Handle click on a region mention
  const handleMentionClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!onRegionClick) return;
    const mentionId = e.currentTarget.getAttribute('data-id');
    if (!mentionId) return;
    const mentionedRegion = regions.find(reg => reg.id === mentionId);
    if (mentionedRegion) {
      onRegionClick(mentionedRegion);
    }
  };

  // Add click handlers to mentions when the panel content changes
  useEffect(() => {
    if (!region?.description) return;
    
    // Add click handlers to all mention elements
    const mentions = document.querySelectorAll('.region-panel-description .mention');
    mentions.forEach(mention => {
      mention.addEventListener('click', handleMentionClick as any);
    });

    return () => {
      mentions.forEach(mention => {
        mention.removeEventListener('click', handleMentionClick as any);
      });
    };
  }, [region?.description, onRegionClick, regions]);

  // Prevent wheel events from reaching the map when panel is open
  useEffect(() => {
    if (!region) return;

    function preventWheel(e: Event) {
      e.stopPropagation();
    }

    const panel = document.querySelector('.region-panel');
    if (panel) {
      panel.addEventListener('wheel', preventWheel as EventListener, { passive: false });
    }

    return () => {
      if (panel) {
        panel.removeEventListener('wheel', preventWheel as EventListener);
      }
    };
  }, [region]);

  if (!region) return null;

  // Find locations inside the region polygon
  const locationsInRegion = locations.filter(loc =>
    pointInPolygon(loc.position, region.position)
  );

  const imageUrl = region.image || '';

  return (
    <div className="sidepanel-backdrop" onClick={onClose}>
      <div className="sidepanel" onClick={e => e.stopPropagation()}>
        <div className="sidepanel-header">
          {onBack && (
            <button className="sidepanel-back-button" onClick={onBack}>
              <IoArrowBack size={22} />
          </button>
          )}
          <h2>{region.name}</h2>
        </div>
        <div className="sidepanel-content">
          <div className="sidepanel-type">
            {region.type}
          </div>
          {Object.keys(region.fields).length > 0 && (
            <div className="sidepanel-fields">
              <h3>Fields</h3>
              <table className="fields-table">
                <tbody>
                  {Object.entries(region.fields).map(([key, value]) => (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {region.description && (
            <div className="sidepanel-description rich-text-content">
              <div dangerouslySetInnerHTML={{ __html: removeAtFromMentions(region.description) }} />
            </div>
          )}
          {/* Locations in Region Section */}
          {locationsInRegion.length > 0 && (
            <div className="regionpanel-locations-section">
              <div className="sidepanel-type regionpanel-locations-header">Locations</div>
              <ul className="regionpanel-locations-list">
                {locationsInRegion.map(loc => {
                  const Icon = ELEMENT_ICONS[loc.icon]?.icon;
                  return (
                    <li
                      key={loc.id}
                      className="regionpanel-locations-list-item"
                      onClick={() => onLocationClick && onLocationClick(loc)}
                    >
                      <div className="regionpanel-location-info">
                        <span
                          className="mention"
                          style={{ fontWeight: 600 }}
                        >
                          {loc.name}
                        </span>
                        <span className="regionpanel-location-type">{loc.type}</span>
                      </div>
                      {Icon && <Icon className="regionpanel-location-icon" style={{ color: loc.color }} />}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {region.image && (
            <div className="sidepanel-image">
              <img src={region.image} alt={region.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 