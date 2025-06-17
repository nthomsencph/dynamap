import React, { useState, useEffect, useRef } from 'react';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import { Search, X } from 'lucide-react';
import { ELEMENT_ICONS, type ElementIcon } from '@/types/elements';
import '@/css/panels/search-panel.css';

interface SearchPanelProps {
  locations: Location[];
  regions: Region[];
  onClose: () => void;
  onElementClick: (element: Location | Region) => void;
}

interface SearchResult {
  element: Location | Region;
  type: 'location' | 'region';
  name: string;
  typeName: string;
  relevance: number; // For sorting by relevance
}

// Component to render the actual element icon
function ElementIcon({ iconKey, color = '#fff', size = 16 }: { 
  iconKey: ElementIcon; 
  color?: string; 
  size?: number; 
}) {
  const iconData = ELEMENT_ICONS[iconKey];
  if (!iconData) {
    // Fallback to a default icon if the icon key is not found
    return <Search size={size} color={color} />;
  }
  
  const IconComponent = iconData.icon;
  return <IconComponent size={size} color={color} />;
}

export function SearchPanel({ locations, regions, onClose, onElementClick }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when panel opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show all elements when search is empty
      const allResults: SearchResult[] = [
        ...locations.map(location => ({
          element: location,
          type: 'location' as const,
          name: location.name || 'Unnamed Location',
          typeName: location.type,
          relevance: 0
        })),
        ...regions.map(region => ({
          element: region,
          type: 'region' as const,
          name: region.name || 'Unnamed Region',
          typeName: region.type,
          relevance: 0
        }))
      ];
      setResults(allResults);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search locations
    locations.forEach(location => {
      const name = location.name || 'Unnamed Location';
      const type = location.type;
      const description = location.description || '';
      
      let relevance = 0;
      
      // Exact name match (highest priority)
      if (name.toLowerCase() === query) {
        relevance = 100;
      }
      // Name starts with query
      else if (name.toLowerCase().startsWith(query)) {
        relevance = 80;
      }
      // Name contains query
      else if (name.toLowerCase().includes(query)) {
        relevance = 60;
      }
      // Type matches
      else if (type.toLowerCase().includes(query)) {
        relevance = 40;
      }
      // Description contains query
      else if (description.toLowerCase().includes(query)) {
        relevance = 20;
      }

      if (relevance > 0) {
        searchResults.push({
          element: location,
          type: 'location',
          name,
          typeName: type,
          relevance
        });
      }
    });

    // Search regions
    regions.forEach(region => {
      const name = region.name || 'Unnamed Region';
      const type = region.type;
      const description = region.description || '';
      
      let relevance = 0;
      
      // Exact name match (highest priority)
      if (name.toLowerCase() === query) {
        relevance = 100;
      }
      // Name starts with query
      else if (name.toLowerCase().startsWith(query)) {
        relevance = 80;
      }
      // Name contains query
      else if (name.toLowerCase().includes(query)) {
        relevance = 60;
      }
      // Type matches
      else if (type.toLowerCase().includes(query)) {
        relevance = 40;
      }
      // Description contains query
      else if (description.toLowerCase().includes(query)) {
        relevance = 20;
      }

      if (relevance > 0) {
        searchResults.push({
          element: region,
          type: 'region',
          name,
          typeName: type,
          relevance
        });
      }
    });

    // Sort by relevance (highest first), then by name
    searchResults.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return a.name.localeCompare(b.name);
    });

    setResults(searchResults);
  }, [searchQuery, locations, regions]);

  const handleResultClick = (result: SearchResult) => {
    onElementClick(result.element);
    // Do not call onClose here; let the panel stack handle navigation
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <div className="search-panel-title">
          <Search size={20} />
          <span>Search places</span>
        </div>
        <button 
          className="search-panel-close" 
          onClick={onClose}
          aria-label="Close search panel"
        >
          <X size={20} />
        </button>
      </div>

      <div className="search-panel-content">
        <div className="search-input-container">
          <Search size={16} className="search-input-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search locations and regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="search-results">
          {results.length === 0 && searchQuery.trim() ? (
            <div className="search-no-results">
              <p>No matching places found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="search-results-list">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.element.id}`}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleResultClick(result);
                    }
                  }}
                >
                  <div className="search-result-icon">
                    <ElementIcon 
                      iconKey={result.element.icon} 
                      color={result.element.color}
                    />
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-name">{result.name}</div>
                    <div className="search-result-type">{result.typeName}</div>
                  </div>
                  <div className="search-result-type-badge">
                    {result.type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="search-panel-footer">
          <div className="search-stats">
            {searchQuery.trim() ? (
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            ) : (
              <span>{results.length} total places</span>
            )}
          </div>
          <div className="search-shortcuts">
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
} 