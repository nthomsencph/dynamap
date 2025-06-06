import React, { useEffect, useState } from 'react';
import type { Location } from '@/types/locations';
import { Lightbox } from '@/app/components/ui/Lightbox';
import { useLocations } from '@/hooks/elements/useLocations';
import { IoArrowBack } from 'react-icons/io5';
import '@/css/panels/sidepanel.css';

interface LocationPanelProps {
  location: Location | null;
  onClose: () => void;
  onLocationClick?: (location: Location) => void;
  onBack?: () => void;
}

export function LocationPanel({ location, onClose, onLocationClick, onBack }: LocationPanelProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const { locations } = useLocations();

  // Handle click on a location mention
  const handleMentionClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!onLocationClick) return;
    const mentionId = e.currentTarget.getAttribute('data-id');
    if (!mentionId) return;
    const mentionedLocation = locations.find(loc => loc.id === mentionId);
    if (mentionedLocation) {
      onLocationClick(mentionedLocation);
    }
  };

  // Add click handlers to mentions when the panel content changes
  useEffect(() => {
    if (!location?.description) return;
    // Add click handlers to all mention elements
    const mentions = document.querySelectorAll('.sidepanel-description .mention');
    mentions.forEach(mention => {
      mention.addEventListener('click', handleMentionClick as any);
    });
    return () => {
      mentions.forEach(mention => {
        mention.removeEventListener('click', handleMentionClick as any);
      });
    };
  }, [location?.description, onLocationClick, locations]);

  // Prevent wheel events from reaching the map when panel is open
  useEffect(() => {
    if (!location) return;

    function preventWheel(e: Event) {
      e.stopPropagation();
    }

    const panel = document.querySelector('.location-panel');
    if (panel) {
      panel.addEventListener('wheel', preventWheel as EventListener, { passive: false });
    }

    return () => {
      if (panel) {
        panel.removeEventListener('wheel', preventWheel as EventListener);
      }
    };
  }, [location]);

  if (!location) return null;

  const imageUrl = location.image || '';

  // Remove leading '@' from mentions in the HTML string
  function removeAtFromMentions(html: string): string {
    return html.replace(/(<span[^>]*class=\"mention\"[^>]*>)@/g, '$1');
  }

  return (
    <div className="sidepanel-backdrop" onClick={onClose}>
      <div className="sidepanel" onClick={e => e.stopPropagation()}>
        <div className="sidepanel-header">
          {onBack && (
            <button className="sidepanel-back-button" onClick={onBack}>
              <IoArrowBack size={22} />
          </button>
          )}
          <h2>{location.name}</h2>
        </div>
        <div className="sidepanel-content">
          <div className="sidepanel-type">
            {location.type}
          </div>
          {Object.keys(location.fields).length > 0 && (
            <div className="sidepanel-fields">
              <h3>Fields</h3>
              <table className="fields-table">
                <tbody>
                  {Object.entries(location.fields).map(([key, value]) => (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {location.description && (
            <div className="sidepanel-description rich-text-content">
              <div dangerouslySetInnerHTML={{ __html: removeAtFromMentions(location.description) }} />
            </div>
          )}
          {location.image && (
            <div className="sidepanel-image">
              <img src={location.image} alt={location.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 