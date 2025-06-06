import { useState, useCallback } from "react";
import type { Region } from "@/types/regions";

interface RegionDialogState {
  open: boolean;
  mode: "create" | "edit";
  position: [number, number][] | null;
  region: Region | undefined;
}

export function useRegionDialog() {
  const [state, setState] = useState<RegionDialogState>({
    open: false,
    mode: "create",
    position: null,
    region: undefined,
  });

  // Open dialog to create a new region at a given position
  const openCreate = useCallback((position: [number, number][]) => {
    setState({
      open: true,
      mode: "create",
      position,
      region: { position } as Region,
    });
  }, []);

  // Open dialog to edit an existing region
  const openEdit = useCallback((region: Region) => {
    setState({
      open: true,
      mode: "edit",
      position: region.position,
      region,
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

  return {
    ...state,
    openCreate,
    openEdit,
    close,
    onSave,
  };
} 