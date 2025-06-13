import { useState, useCallback, useMemo } from "react";
import type { Region } from "@/types/regions";

interface RegionDialogState {
  open: boolean;
  mode: "create" | "edit";
  position: [number, number][] | null;
  region: Partial<Region> | null;
}

export function useRegionDialog() {
  const [state, setState] = useState<RegionDialogState>({
    open: false,
    mode: "create",
    position: null,
    region: null,
  });

  // Open dialog to create a new region at a given position
  const openCreate = useCallback((position: [number, number][]) => {
    setState({
      open: true,
      mode: "create",
      position,
      region: { position } as Partial<Region>,
    });
  }, []);

  // Open dialog to edit an existing region
  const openEdit = useCallback((region: Region) => {
    setState({
      open: true,
      mode: "edit",
      position: region.position,
      region: region as Partial<Region>,
    });
  }, []);

  // Close dialog
  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  // Save handler (to be passed to the dialog component)
  const onSave = useCallback((region: Region) => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  const result = useMemo(() => ({
    open: state.open,
    mode: state.mode,
    position: state.position,
    region: state.region,
    openCreate,
    openEdit,
    close,
    onSave,
  }), [state.open, state.mode, state.position, state.region]);

  return result;
} 