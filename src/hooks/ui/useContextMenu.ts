import { useState, useCallback, useRef } from 'react';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import L from 'leaflet';
import { findContainingRegions } from '@/app/utils/containment';

interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  type: 'map' | 'marker';
  location?: Location;
  region?: Region;
}

interface UseContextMenuProps {
  onAddLocation: (position: [number, number]) => void;
  onEditLocation: (location: Location) => void;
  onMoveLocation: (location: Location, isDuplicating?: boolean) => void;
  onDeleteLocation: (location: Location) => void;
  onAddRegion: (position: [number, number]) => void;
  onEditRegion: (region: Region) => void;
  onDeleteRegion: (region: Region) => void;
  mapRef: React.RefObject<L.Map>;
  startDrawing: () => void; // Required: polygon drawing is the only way to add regions
  regions: Region[]; // Add regions data for overlapping region detection
}

export function useContextMenu({
  onAddLocation,
  onEditLocation,
  onMoveLocation,
  onDeleteLocation,
  onAddRegion,
  onEditRegion,
  onDeleteRegion,
  mapRef,
  startDrawing,
  regions,
}: UseContextMenuProps) {
  const [menu, setMenu] = useState<ContextMenuState>({ 
    open: false, 
    x: 0, 
    y: 0, 
    type: 'map' 
  });

  // Use a ref to access the current menu state without causing re-renders
  const menuRef = useRef(menu);
  menuRef.current = menu;

  // Helper function to check if any panels are open
  const hasOpenPanels = useCallback(() => {
    return document.querySelectorAll('.sidepanel-backdrop').length > 0;
  }, []);

  // Type-safe handlers for different element types
  const handleContextMenu = useCallback((e: React.MouseEvent | L.LeafletMouseEvent) => {
    // Check if any panels are open - if so, prevent context menu
    if (hasOpenPanels()) {
      if ('preventDefault' in e) {
        e.preventDefault();
      } else if ('originalEvent' in e && 'preventDefault' in e.originalEvent) {
        e.originalEvent.preventDefault();
      }
      return;
    }

    if ('preventDefault' in e) {
      e.preventDefault();
    } else if ('originalEvent' in e && 'preventDefault' in e.originalEvent) {
      e.originalEvent.preventDefault();
    }
    
    const clientX = 'clientX' in e ? e.clientX : (e as L.LeafletMouseEvent).originalEvent.clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as L.LeafletMouseEvent).originalEvent.clientY;
    
    setMenu({ 
      open: true, 
      x: clientX, 
      y: clientY, 
      type: 'map'
    });
  }, [hasOpenPanels]);

  const handleLocationContextMenu = useCallback((e: L.LeafletMouseEvent, location: Location) => {
    // Check if any panels are open - if so, prevent context menu
    if (hasOpenPanels()) {
      e.originalEvent.preventDefault();
      return;
    }

    e.originalEvent.preventDefault();
    
    // Stop propagation to prevent map context menu from overriding marker context menu
    e.originalEvent.stopPropagation();
    
    const clientX = e.originalEvent.clientX;
    const clientY = e.originalEvent.clientY;
    
    setMenu({ 
      open: true, 
      x: clientX, 
      y: clientY, 
      type: 'marker',
      location
    });
  }, [hasOpenPanels]);

  const handleRegionContextMenu = useCallback((e: L.LeafletMouseEvent, region: Region) => {
    // Check if any panels are open - if so, prevent context menu
    if (hasOpenPanels()) {
      e.originalEvent.preventDefault();
      return;
    }

    e.originalEvent.preventDefault();
    
    // Stop propagation to prevent map context menu from overriding marker context menu
    e.originalEvent.stopPropagation();
    
    const clientX = e.originalEvent.clientX;
    const clientY = e.originalEvent.clientY;
    
    // Find all regions containing this right-click point
    const clickPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
    const allContainingRegions = findContainingRegions(clickPoint, regions);
    
    let targetRegion = region; // Default to the clicked region
    
    if (allContainingRegions.length > 0) {
      // Find the smallest containing region (first in the sorted list)
      targetRegion = allContainingRegions[0];
      
      console.log('🔍 useContextMenu: Context menu for overlapping regions:', {
        clickPoint,
        clickedRegion: { id: region.id, name: region.name },
        smallestRegion: { id: targetRegion.id, name: targetRegion.name },
        allContainingRegions: allContainingRegions.map(r => ({ id: r.id, name: r.name, area: r.area }))
      });
    }
    
    setMenu({ 
      open: true, 
      x: clientX, 
      y: clientY, 
      type: 'marker',
      region: targetRegion
    });
  }, [hasOpenPanels, regions]);

  const closeMenu = useCallback(() => {
    setMenu(m => ({ ...m, open: false }));
  }, []);

  const getMenuItems = useCallback(() => {
    const currentMenu = menuRef.current;
    if (currentMenu.type === 'marker') {
      if (currentMenu.location) {
        return [
          { 
            label: "Edit location", 
            onClick: () => { 
              onEditLocation(currentMenu.location!); 
              closeMenu(); 
            } 
          },
          { 
            label: "Move location", 
            onClick: () => { 
              onMoveLocation(currentMenu.location!); 
              closeMenu(); 
            } 
          },
          { 
            label: "Duplicate location", 
            onClick: () => { 
              onMoveLocation(currentMenu.location!, true); 
              closeMenu(); 
            } 
          },
          { 
            label: "Delete location", 
            onClick: () => { 
              onDeleteLocation(currentMenu.location!); 
              closeMenu(); 
            } 
          },
        ];
      } else if (currentMenu.region) {
        return [
          { 
            label: "Edit region", 
            onClick: () => { 
              onEditRegion(currentMenu.region!); 
              closeMenu(); 
            } 
          },
          { 
            label: "Add location", 
            onClick: () => {
              if (mapRef.current) {
                const map = mapRef.current;
                const container = map.getContainer();
                const rect = container.getBoundingClientRect();
                const point = L.point(currentMenu.x - rect.left, currentMenu.y - rect.top);
                const latlng = map.containerPointToLatLng(point);
                onAddLocation([latlng.lat, latlng.lng]);
              }
              closeMenu();
            }
          },
          { 
            label: "Delete region", 
            onClick: () => { 
              onDeleteRegion(currentMenu.region!); 
              closeMenu(); 
            } 
          },
        ];
      }
    }
    return [
      { 
        label: "Add location", 
        onClick: () => {
          if (currentMenu.type === 'map' && mapRef.current) {
            const map = mapRef.current;
            const container = map.getContainer();
            const rect = container.getBoundingClientRect();
            const point = L.point(currentMenu.x - rect.left, currentMenu.y - rect.top);
            const latlng = map.containerPointToLatLng(point);
            onAddLocation([latlng.lat, latlng.lng]);
          }
          closeMenu();
        } 
      },
      { 
        label: "Add region", 
        onClick: () => {
          if (currentMenu.type === 'map' && mapRef.current) {
            const map = mapRef.current;
            const container = map.getContainer();
            const rect = container.getBoundingClientRect();
            const point = L.point(currentMenu.x - rect.left, currentMenu.y - rect.top);
            const latlng = map.containerPointToLatLng(point);
            onAddRegion([latlng.lat, latlng.lng]);
          }
          closeMenu();
        } 
      },
    ];
  }, [onEditLocation, onMoveLocation, onDeleteLocation, onEditRegion, onAddLocation, onDeleteRegion, mapRef, startDrawing, closeMenu]);

  return {
    menu,
    handleContextMenu,
    handleLocationContextMenu,
    handleRegionContextMenu,
    closeMenu,
    getMenuItems,
  };
} 