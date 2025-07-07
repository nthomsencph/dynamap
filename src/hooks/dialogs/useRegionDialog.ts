import { useState, useCallback, useMemo } from 'react';
import type { Region } from '@/types/regions';
import { useTimelineContext } from '@/app/contexts/TimelineContext';

interface RegionDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  position: [number, number][] | null;
  region: Partial<Region> | null;
}

export function useRegionDialog() {
  const { currentYear } = useTimelineContext();
  const [state, setState] = useState<RegionDialogState>({
    open: false,
    mode: 'create',
    position: null,
    region: null,
  });

  const openCreate = useCallback(
    (position: [number, number][]) => {
      setState({
        open: true,
        mode: 'create',
        position,
        region: {
          id: crypto.randomUUID(),
          name: '',
          type: 'Region',
          description: '',
          color: '#ffffff',
          icon: 'MdPlace',
          showLabel: true,
          label: '',
          labelPosition: { direction: 'Center', offset: 10 },
          prominence: { lower: 0, upper: 10 },
          fields: {},
          elementType: 'region',
          geom: position,
          showBorder: true,
          showHighlight: true,
          areaFadeDuration: 800,
          creationYear: currentYear,
        },
      });
    },
    [currentYear]
  );

  const openEdit = useCallback((region: Region) => {
    setState({
      open: true,
      mode: 'edit',
      position: region.geom,
      region,
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  const onSave = useCallback((region: Region) => {
    // This will be handled by the parent component
  }, []);

  return useMemo(
    () => ({
      open: state.open,
      mode: state.mode,
      position: state.position,
      region: state.region,
      openCreate,
      openEdit,
      close,
      onSave,
    }),
    [
      state.open,
      state.mode,
      state.position,
      state.region,
      openCreate,
      openEdit,
      close,
      onSave,
    ]
  );
}
