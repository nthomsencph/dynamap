import { useState, useCallback } from 'react';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import L from 'leaflet';

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
  onDeleteRegion: (region: Region) => void;
  onEditRegion: (region: Region) => void;
  onAddRegion: (position: [number, number][]) => void;
  mapRef: React.RefObject<L.Map>;
}

export function useContextMenu({
  onAddLocation,
  onEditLocation,
  onMoveLocation,
  onDeleteLocation,
  onDeleteRegion,
  onEditRegion,
  onAddRegion,
  mapRef,
}: UseContextMenuProps) {
  const [menu, setMenu] = useState<ContextMenuState>({ 
    open: false, 
    x: 0, 
    y: 0, 
    type: 'map' 
  });

  const handleContextMenu = useCallback((
    e: React.MouseEvent | L.LeafletMouseEvent, 
    type: 'map' | 'marker', 
    element?: Location | Region
  ) => {
    
    if ('preventDefault' in e) {
      e.preventDefault();
    } else if ('originalEvent' in e && 'preventDefault' in e.originalEvent) {
      e.originalEvent.preventDefault();
    }
    const clientX = 'clientX' in e ? e.clientX : e.originalEvent.clientX;
    const clientY = 'clientY' in e ? e.clientY : e.originalEvent.clientY;
    
    // Check if element is a Location or Region based on position type
    const isLocation = element && 'position' in element && Array.isArray(element.position) && element.position.length === 2 && !('showBorder' in element);
    
    setMenu({ 
      open: true, 
      x: clientX, 
      y: clientY, 
      type,
      ...(isLocation ? { location: element as Location } : { region: element as Region })
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(m => ({ ...m, open: false }));
  }, []);

  const getMenuItems = useCallback(() => {
    if (menu.type === 'marker') {
      if (menu.location) {
        return [
          { 
            label: "Edit location", 
            onClick: () => { 
              onEditLocation(menu.location!); 
              closeMenu(); 
            } 
          },
          { 
            label: "Move location", 
            onClick: () => { 
              onMoveLocation(menu.location!); 
              closeMenu(); 
            } 
          },
          { 
            label: "Duplicate location", 
            onClick: () => { 
              onMoveLocation(menu.location!, true); 
              closeMenu(); 
            } 
          },
          { 
            label: "Delete location", 
            onClick: () => { 
              onDeleteLocation(menu.location!); 
              closeMenu(); 
            } 
          },
        ];
      } else if (menu.region) {
        return [
          { 
            label: "Edit region", 
            onClick: () => { 
              onEditRegion(menu.region!); 
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
                const point = L.point(menu.x - rect.left, menu.y - rect.top);
                const latlng = map.containerPointToLatLng(point);
                onAddLocation([latlng.lat, latlng.lng]);
              }
              closeMenu();
            }
          },
          { 
            label: "Delete region", 
            onClick: () => { 
              onDeleteRegion(menu.region!); 
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
          if (menu.type === 'map' && mapRef.current) {
            const map = mapRef.current;
            const container = map.getContainer();
            const rect = container.getBoundingClientRect();
            const point = L.point(menu.x - rect.left, menu.y - rect.top);
            const latlng = map.containerPointToLatLng(point);
            onAddLocation([latlng.lat, latlng.lng]);
          }
          closeMenu();
        } 
      },
      { 
        label: "Add region", 
        onClick: () => {
          if (menu.type === 'map' && mapRef.current) {
            const map = mapRef.current;
            const container = map.getContainer();
            const rect = container.getBoundingClientRect();
            const point = L.point(menu.x - rect.left, menu.y - rect.top);
            const latlng = map.containerPointToLatLng(point);
            // For now, create a simple triangle around the click point
            const offset = 0.1; // Adjust this value to control the size of the region
            const position: [number, number][] = [
              [latlng.lat, latlng.lng],
              [latlng.lat + offset, latlng.lng + offset],
              [latlng.lat + offset, latlng.lng - offset],
            ];
            onAddRegion(position);
          }
          closeMenu();
        } 
      },
    ];
  }, [menu, onAddLocation, onEditLocation, onMoveLocation, onDeleteLocation, onDeleteRegion, onEditRegion, onAddRegion, closeMenu, mapRef]);

  return {
    menu,
    handleContextMenu,
    closeMenu,
    getMenuItems,
  };
} 