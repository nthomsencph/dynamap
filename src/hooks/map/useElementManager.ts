import { useState, useCallback, useMemo } from 'react';
import type { Location } from "@/types/locations";
import type { Region } from "@/types/regions";
import { useTimelineContext } from "@/app/contexts/TimelineContext";
import { useMapElementsByYear, useCreateLocation, useUpdateLocation, useDeleteLocation, useCreateRegion, useUpdateRegion, useDeleteRegion } from "@/hooks/queries/useMapElements";
import { getFutureChangesForElement } from '@/app/utils/timeline-changes';

export function useElementManager() {
  const { currentYear, entries, epochs } = useTimelineContext();
  
  // Map elements using React Query
  const { locations, regions } = useMapElementsByYear(currentYear);
  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();
  const createRegionMutation = useCreateRegion();
  const updateRegionMutation = useUpdateRegion();
  const deleteRegionMutation = useDeleteRegion();

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    open: boolean; 
    type: 'location' | 'region';
    element: Location | Region | null;
    mode: 'normal' | 'timeline';
    warning?: string;
  }>({
    open: false,
    type: 'location',
    element: null,
    mode: 'normal'
  });

  // Memoize mutation handlers to prevent re-renders
  const mutationHandlers = useMemo(() => ({
    updateLocation: (location: Location) => updateLocationMutation.mutateAsync(location as any),
    addLocation: (location: Location) => createLocationMutation.mutateAsync(location as any),
    updateRegion: (region: Region) => updateRegionMutation.mutateAsync(region as any),
    addRegion: (region: Region) => createRegionMutation.mutateAsync(region as any),
  }), [updateLocationMutation.mutateAsync, createLocationMutation.mutateAsync, updateRegionMutation.mutateAsync, createRegionMutation.mutateAsync]);

  // Delete handlers
  const handleDeleteLocation = useCallback((location: Location) => {
    const { hasChanges, years } = getFutureChangesForElement(
      location.id,
      'location',
      currentYear,
      entries,
      epochs
    );
    
    const warning = hasChanges 
      ? `This element has changes later in the timeline: (${years.join(', ')})`
      : undefined;

    setDeleteConfirm({ 
      open: true, 
      type: 'location', 
      element: location,
      mode: 'normal',
      warning
    });
  }, [currentYear, entries, epochs]);

  const handleDeleteRegion = useCallback((region: Region) => {
    const { hasChanges, years } = getFutureChangesForElement(
      region.id,
      'region',
      currentYear,
      entries,
      epochs
    );
    
    const warning = hasChanges 
      ? `This element has changes later in the timeline: (${years.join(', ')})`
      : undefined;

    setDeleteConfirm({ 
      open: true, 
      type: 'region', 
      element: region,
      mode: 'normal',
      warning
    });
  }, [currentYear, entries, epochs]);

  const handleDeleteElement = useCallback(async () => {
    if (!deleteConfirm.element) return;

    if (deleteConfirm.type === 'location') {
      await deleteLocationMutation.mutateAsync({ id: deleteConfirm.element.id });
    } else {
      await deleteRegionMutation.mutateAsync({ id: deleteConfirm.element.id });
    }
    setDeleteConfirm({ open: false, type: 'location', element: null, mode: 'normal' });
  }, [deleteConfirm.element, deleteConfirm.type, deleteLocationMutation.mutateAsync, deleteRegionMutation.mutateAsync]);

  const handleDeleteFromTimeline = useCallback(async () => {
    if (!deleteConfirm.element) return;

    if (deleteConfirm.type === 'location') {
      await deleteLocationMutation.mutateAsync({ id: deleteConfirm.element.id });
    } else {
      await deleteRegionMutation.mutateAsync({ id: deleteConfirm.element.id });
    }
    setDeleteConfirm({ open: false, type: 'location', element: null, mode: 'normal' });
  }, [deleteConfirm.element, deleteConfirm.type, deleteLocationMutation.mutateAsync, deleteRegionMutation.mutateAsync]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ open: false, type: 'location', element: null, mode: 'normal' });
  }, []);

  return {
    // Data
    locations,
    regions,
    
    // Mutation handlers
    mutationHandlers,
    
    // Delete state and handlers
    deleteConfirm,
    handleDeleteLocation,
    handleDeleteRegion,
    handleDeleteElement,
    handleDeleteFromTimeline,
    handleDeleteCancel,
    
    // Utility function to check for future changes
    getFutureChangesForElement: (elementId: string, elementType: 'location' | 'region') => 
      getFutureChangesForElement(elementId, elementType, currentYear, entries, epochs)
  };
} 