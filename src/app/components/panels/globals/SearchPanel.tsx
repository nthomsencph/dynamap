import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { ELEMENT_ICONS, type ElementIcon } from '@/types/elements';
import { useSearch } from '@/hooks/queries/useSearch';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { BasePanel } from '../BasePanel';
import type { MapElement } from '@/types/elements';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

interface SearchPanelProps {
  onClose: () => void;
  onElementClick: (element: Location | Region) => void;
}

// Component to render element icons
function ElementIcon({
  iconKey,
  color = '#fff',
  size = 16,
}: {
  iconKey: ElementIcon;
  color?: string;
  size?: number;
}) {
  const iconData = ELEMENT_ICONS[iconKey];
  if (!iconData) {
    return <Search size={size} color={color} />;
  }

  const IconComponent = iconData.icon;
  return <IconComponent size={size} color={color} />;
}

export function SearchPanel({ onClose, onElementClick }: SearchPanelProps) {
  const { currentYear } = useTimelineContext();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use the search API
  const {
    data: searchResults = [],
    isLoading: searchLoading,
    error: searchError,
  } = useSearch({
    query: searchQuery,
    year: currentYear,
    limit: 50,
    enabled: true,
  });

  // Focus search input when panel opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Create a dummy element for BasePanel
  const searchElement: MapElement = {
    id: 'search-panel',
    name: 'Search Places',
    type: 'Search',
    elementType: 'location',
    color: '#ffffff',
    prominence: { lower: 0, upper: 10 },
    icon: 'MdPlace',
    fields: {},
    creationYear: 0,
  };

  return (
    <BasePanel
      element={searchElement}
      onClose={onClose}
      className="search-panel"
    >
      {/* Search Header */}
      <div className="search-panel-header">
        <div className="search-panel-title">
          <Search size={20} />
          <span>Search places</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="search-panel-input-container">
        <input
          ref={searchInputRef}
          type="text"
          className="search-panel-input"
          placeholder="Search by name, type, or description..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
        />
      </div>

      {/* Search Results */}
      <div className="search-panel-results">
        {searchLoading ? (
          <div className="search-panel-loading">
            <p>Searching...</p>
          </div>
        ) : searchError ? (
          <div className="search-panel-error">
            <p>Search failed. Please try again.</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="search-panel-results-list">
            {searchResults.map(result => (
              <div
                key={`${result.elementType}-${result.id}`}
                className="search-panel-result-item"
                onClick={() => {
                  // Convert SearchResult to Location or Region based on elementType
                  if (result.elementType === 'location') {
                    onElementClick({
                      ...result,
                      geom: result.geom as [number, number],
                    } as Location);
                  } else {
                    onElementClick({
                      ...result,
                      geom: result.geom as [number, number][],
                    } as Region);
                  }
                }}
              >
                <div className="search-panel-result-icon">
                  <ElementIcon
                    iconKey={result.icon as any}
                    color={result.color}
                    size={16}
                  />
                </div>
                <div className="search-panel-result-content">
                  <div className="search-panel-result-name">{result.name}</div>
                  <div className="search-panel-result-type">{result.type}</div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="search-panel-no-results">
            <p>No results found for &quot;{searchQuery}&quot;</p>
            <p>Try searching by name, type, or description</p>
          </div>
        ) : (
          <div className="search-panel-empty">
            <p>Start typing to search for places</p>
          </div>
        )}
      </div>
    </BasePanel>
  );
}
