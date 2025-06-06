import { useState, useCallback } from "react";
import type { Location } from "@/types/locations";

interface LocationDialogState {
  open: boolean;
  mode: "create" | "edit";
  position: [number, number] | null;
  location: Partial<Location> | null;
}

export function useLocationDialog() {
  const [state, setState] = useState<LocationDialogState>({
    open: false,
    mode: "create",
    position: null,
    location: null,
  });

  // Open dialog to create a new location at a given position
  const openCreate = useCallback((position: [number, number]) => {
    setState({
      open: true,
      mode: "create",
      position,
      location: { position, showLabel: true },
    });
  }, []);

  // Open dialog to edit an existing location
  const openEdit = useCallback((location: Location) => {
    setState({
      open: true,
      mode: "edit",
      position: location.position,
      location,
    });
  }, []);

  // Close dialog
  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  // Save handler (to be passed to the dialog component)
  const onSave = useCallback((location: Location) => {
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