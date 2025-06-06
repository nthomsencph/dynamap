// external imports
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRef, useState, useEffect } from "react";
import '@luomus/leaflet-smooth-wheel-zoom';

// types
import type { Location } from "@/types/locations";
import type { Region } from "@/types/regions";

// constants
import { MAP_CENTER } from '@/constants/map';

// hooks
import { useFitZoom } from "@/hooks/view/useFitZoom";
import { useSmoothWheelZoom } from "@/hooks/view/useSmoothWheelZoom";
import { useMoveLocation } from "@/hooks/elements/useMoveLocation";
import { useLocationDialog } from "@/hooks/dialogs/useLocationDialog";
import { useRegionDialog } from "@/hooks/dialogs/useRegionDialog";
import { useLocations } from "@/hooks/elements/useLocations";
import { useRegions } from "@/hooks/elements/useRegions";
import { useContextMenu } from "@/hooks/ui/useContextMenu";
import { usePolygonDraw } from "@/hooks/elements/usePolygonDraw";

// components
import { ContextMenu } from "../ui/ContextMenu";
import { ScaleBar } from '../ui/ScaleBar';
import { ProminenceLevel } from '../ui/ProminenceLevel';
import { LocationDialog } from "../dialogs/LocationDialog";
import { RegionDialog } from "../dialogs/RegionDialog";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { MapImage } from "./MapImage";
import { LocationMarkers } from "../markers/LocationMarkers";
import { RegionMarkers } from "../markers/RegionMarkers";

// styles
import '@/css/markers/location-label.css';
import '@/css/markers/region-label.css';
import '@/css/ui/move-mode.css';

// utils
import { showProminenceToast } from '@/app/utils/toast';
import { calculateProminenceLevel } from '@/app/utils/zoom';

type DialogMode = 'create' | 'edit';

interface LocationDialogState {
  open: boolean;
  mode: DialogMode;
  position: { lat: number; lng: number };
  location: Partial<Location> | null;
}

interface RegionDialogState {
  open: boolean;
  mode: DialogMode;
  position: [number, number][];
  region: Region | undefined;
}

interface DeleteConfirmationState {
  open: boolean;
  type: 'location' | 'region';
  element: Location | Region | null;
}

export default function Map() {
    const mapRef = useRef<L.Map>(null);
    const fitZoom = useFitZoom();
    useSmoothWheelZoom(mapRef, 2);

    // Hooks for locations and regions
    const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
    const { regions, addRegion, updateRegion, deleteRegion } = useRegions();
    const locationDialog = useLocationDialog();
    const regionDialog = useRegionDialog();
    const { moveMode, handleMoveLocation, resetMoveMode } = useMoveLocation(
      mapRef as React.RefObject<L.Map>, 
      updateLocation,
      addLocation
    );

    // Add polygon drawing hook
    const { isDrawing, startDrawing, stopDrawing } = usePolygonDraw(
      mapRef as React.RefObject<L.Map>,
      (points) => {
        regionDialog.openCreate(points);
        stopDrawing(); // Make sure to stop drawing when dialog opens
      }
    );

    // State for delete confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
      open: false,
      type: 'location',
      element: null,
    });

    const { menu, handleContextMenu, closeMenu, getMenuItems } = useContextMenu({
      onAddLocation: (position) => {
        locationDialog.openCreate(position);
      },
      onEditLocation: (location) => {
        locationDialog.openEdit(location);
      },
      onMoveLocation: (location, isDuplicating) => {
        handleMoveLocation(location, isDuplicating);
        closeMenu();
      },
      onDeleteLocation: (location) => {
        setDeleteConfirmation({ 
          open: true, 
          type: 'location',
          element: location 
        });
      },
      onDeleteRegion: (region) => {
        setDeleteConfirmation({ 
          open: true, 
          type: 'region',
          element: region 
        });
      },
      onEditRegion: (region) => {
        regionDialog.openEdit(region);
      },
      onAddRegion: () => {
        startDrawing();
        closeMenu();
      },
      mapRef: mapRef as React.RefObject<L.Map>,
    });

    // Save handlers for dialogs
    async function handleSaveLocation(location: Location) {
      if (locationDialog.mode === 'edit') {
        await updateLocation(location);
      } else {
        await addLocation(location);
        // Check if the location's prominence is below the current zoom level
        const currentProminenceLevel = calculateProminenceLevel(currentZoom, fitZoom);
        if (location.prominence < currentProminenceLevel && location.name) {
          showProminenceToast(location.name, location.prominence);
        }
      }
      locationDialog.close();
    }

    async function handleSaveRegion(region: Region) {
      if (regionDialog.mode === 'edit') {
        await updateRegion(region);
      } else {
        await addRegion(region);
        // Check if the region's prominence is below the current zoom level
        const currentProminenceLevel = calculateProminenceLevel(currentZoom, fitZoom);
        if (region.prominence < currentProminenceLevel && region.name) {
          showProminenceToast(region.name, region.prominence);
        }
      }
      regionDialog.close();
    }

    // Handle delete element
    async function handleDelete() {
      if (deleteConfirmation.type === 'location' && deleteConfirmation.element) {
        await deleteLocation(deleteConfirmation.element.id);
      } else if (deleteConfirmation.type === 'region' && deleteConfirmation.element) {
        await deleteRegion(deleteConfirmation.element.id);
      }
      setDeleteConfirmation({ open: false, type: 'location', element: null });
    }

    const [currentZoom, setCurrentZoom] = useState(fitZoom);

    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      const onZoom = () => setCurrentZoom(map.getZoom());
      map.on('zoom', onZoom);
      // Set initial zoom
      setCurrentZoom(map.getZoom());
      return () => {
        map.off('zoom', onZoom);
      };
    }, [mapRef.current]);

    // Add logging for regions
    useEffect(() => {
    }, [regions, fitZoom]);

    return (
      <div 
        style={{ width: '100vw', height: '100vh', position: 'relative' }} 
        onContextMenu={e => handleContextMenu(e, 'map')}
        className={isDrawing ? 'drawing-mode' : ''}
      >
        <MapContainer
          center={MAP_CENTER}
          zoom={fitZoom}
          minZoom={fitZoom}
          maxZoom={2}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef as React.RefObject<L.Map>}
          crs={L.CRS.Simple as any}
          zoomControl={true}
          preferCanvas={true}
          renderer={L.canvas()}
          scrollWheelZoom={false}
        >
          <ScaleBar />
          <ProminenceLevel />
          <MapImage />
          <RegionMarkers
            regions={regions}
            currentZoom={currentZoom}
            fitZoom={fitZoom}
            onContextMenu={(e, type, region) => handleContextMenu(e, type, region)}
          />
          <LocationMarkers
            locations={locations}
            currentZoom={currentZoom}
            fitZoom={fitZoom}
            onContextMenu={(e, type, location) => handleContextMenu(e, type, location)}
          />
        </MapContainer>
        <ContextMenu
          open={menu.open}
          x={menu.x}
          y={menu.y}
          onClose={() => {
            closeMenu();
            if (moveMode && menu.type !== 'marker') {
              resetMoveMode();
            }
          }}
          items={getMenuItems()}
        />
        <LocationDialog
          open={locationDialog.open}
          mode={locationDialog.mode}
          location={locationDialog.location}
          onSave={handleSaveLocation}
          onDelete={(location) => {
            console.log('Map: handleDeleteLocation called with:', location);
            setDeleteConfirmation({ 
              open: true, 
              type: 'location',
              element: location 
            });
            locationDialog.close();
          }}
          onClose={() => {
            console.log('Map: onCloseLocation called');
            locationDialog.close();
          }}
        />
        {regionDialog.open && (
        <RegionDialog
          open={regionDialog.open}
          mode={regionDialog.mode}
          region={regionDialog.region}
          position={regionDialog.position || []}
          map={mapRef.current!}
          onSave={(region) => {
            console.log('Map: handleSaveRegion called with:', region);
            handleSaveRegion(region);
          }}
          onDelete={(region) => {
            console.log('Map: handleDelete called with:', region);
            setDeleteConfirmation({ 
              open: true, 
              type: 'region',
              element: region 
            });
            regionDialog.close();
          }}
          onClose={() => {
            console.log('Map: onClose called');
            regionDialog.close();
          }}
        />
      )}
        <ConfirmDialog
          open={deleteConfirmation.open}
          title={`Delete ${deleteConfirmation.type}`}
          message={`Are you sure you want to delete this ${deleteConfirmation.type}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmation({ 
            open: false, 
            type: 'location', 
            element: null 
          })}
        />
      </div>
    );
}
  