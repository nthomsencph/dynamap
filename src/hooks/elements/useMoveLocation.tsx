import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { renderToStaticMarkup } from "react-dom/server";
import { ELEMENT_ICONS } from "../../types/elements";
import type { Location } from "../../types/locations";
import type { MapElement } from "../../types/elements";

interface MoveMode {
  location: Location;
  isDuplicating?: boolean;
}

// Type guard to ensure a Location has all required MapElement properties
function hasMapElementProperties(location: Location): location is Location & MapElement {
  return (
    'id' in location &&
    'color' in location &&
    'prominence' in location &&
    'icon' in location
  );
}

// Component for rendering the location icon
function LocationIcon({ element }: { element: MapElement }) {
  const IconComponent = ELEMENT_ICONS[element.icon]?.icon || ELEMENT_ICONS.MdCastle.icon;
  return <IconComponent color={element.color || "#2563eb"} size={32} />;
}

export function useMoveLocation(
  mapRef: React.RefObject<L.Map | null>, 
  onLocationUpdate: (location: Location) => void,
  onLocationCreate?: (location: Location) => void
) {
  const [moveMode, setMoveMode] = useState<MoveMode | null>(null);
  const cursorUrlRef = useRef<string | null>(null);

  // Use refs to avoid dependency issues
  const onLocationUpdateRef = useRef(onLocationUpdate);
  const onLocationCreateRef = useRef(onLocationCreate);
  onLocationUpdateRef.current = onLocationUpdate;
  onLocationCreateRef.current = onLocationCreate;

  // Handle moving or duplicating a location
  const handleMoveLocation = useCallback((location: Location, isDuplicating: boolean = false) => {
    if (!hasMapElementProperties(location)) {
      console.error('Location is missing required MapElement properties');
      return;
    }

    setMoveMode({ location, isDuplicating });
    
    // Change cursor to indicate move mode
    if (mapRef.current) {
      const map = mapRef.current;
      const container = map.getContainer();
      
      // Set a default move cursor first
      container.style.cursor = 'move';

      try {
        // Get the icon component
        const IconComponent = ELEMENT_ICONS[location.icon]?.icon || ELEMENT_ICONS.MdCastle.icon;
        
        // Create a simple SVG string with the icon
        const svgContent = renderToStaticMarkup(
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" 
            height="32" 
            viewBox="0 0 32 32"
            style={{ backgroundColor: 'transparent' }}
          >
            <IconComponent 
              color={location.color || "#2563eb"} 
              size={32}
            />
          </svg>
        );

        // Create a data URL
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
        
        // Set the cursor directly
        container.style.cursor = `url("${dataUrl}") 16 16, move`;
      } catch (error) {
        console.error('Error setting custom cursor:', error);
        // Keep the move cursor if custom cursor fails
        container.style.cursor = 'move';
      }
    }
  }, []);

  // Add a visual indicator for move mode
  useEffect(() => {
    if (moveMode && mapRef.current) {
      // Add the class to both the map container and its parent
      const container = mapRef.current.getContainer();
      const parent = container.parentElement;
      container.classList.add('move-mode');
      if (parent) {
        parent.classList.add('move-mode');
      }
      
      return () => {
        container.classList.remove('move-mode');
        if (parent) {
          parent.classList.remove('move-mode');
        }
      };
    }
  }, [moveMode]);

  // Reset move mode and cursor
  const resetMoveMode = useCallback(() => {
    setMoveMode(null);
    if (mapRef.current) {
      const container = mapRef.current.getContainer();
      container.style.cursor = '';
      container.classList.remove('move-mode');
    }
  }, []);

  // Handle map click when in move mode
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!moveMode || !mapRef.current) return;
    
    const { lat, lng } = e.latlng;
    
    // Store current move mode and reset it immediately
    const currentMoveMode = { ...moveMode };
    resetMoveMode();
    
    // Use setTimeout to ensure the move mode is fully reset before updating
    setTimeout(() => {
      if (currentMoveMode.isDuplicating && onLocationCreateRef.current) {
        // Create a new location with a new UUID
        const newLocation: Location = {
          ...currentMoveMode.location,
          id: crypto.randomUUID(),
          position: [lat, lng] as [number, number],
          name: `${currentMoveMode.location.name} (Copy)`
        };
        onLocationCreateRef.current(newLocation);
      } else {
        // Update existing location
        const updatedLocation = { 
          ...currentMoveMode.location, 
          position: [lat, lng] as [number, number] 
        };
        onLocationUpdateRef.current(updatedLocation);
      }
    }, 0);
  }, [moveMode, resetMoveMode]);

  // Add click handler when in move mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (moveMode) {
      // Handle map clicks
      const handleMapClickWrapper = (e: L.LeafletMouseEvent) => {
        handleMapClick(e);
      };
      map.on('click', handleMapClickWrapper);

      // Handle clicks outside the map
      const handleDocumentClick = (e: MouseEvent) => {
        // Only reset if clicking outside the map
        if (map.getContainer().contains(e.target as Node)) {
          return;
        }
        resetMoveMode();
      };

      // Add document click handler with a small delay
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleDocumentClick);
      }, 100);

      // Handle escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          resetMoveMode();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        map.off('click', handleMapClickWrapper);
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleDocumentClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [moveMode, handleMapClick, resetMoveMode]);

  return {
    moveMode,
    handleMoveLocation,
    resetMoveMode
  };
} 