import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Map state
  currentZoom: number;
  isZooming: boolean;
  mapCenter: [number, number];
  
  // Panel state
  isPanelOpen: boolean;
  panelWidth: number;
  
  // Dialog state
  activeDialogs: Set<string>;
  
  // Actions
  setCurrentZoom: (zoom: number) => void;
  setIsZooming: (isZooming: boolean) => void;
  setMapCenter: (center: [number, number]) => void;
  setPanelOpen: (isOpen: boolean) => void;
  setPanelWidth: (width: number) => void;
  openDialog: (dialogId: string) => void;
  closeDialog: (dialogId: string) => void;
  closeAllDialogs: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentZoom: -1, // Will be set by map when ready
      isZooming: false,
      mapCenter: [0, 0],
      isPanelOpen: false,
      panelWidth: 450,
      activeDialogs: new Set(),

      // Actions
      setCurrentZoom: (zoom) => set({ currentZoom: zoom }),
      setIsZooming: (isZooming) => set({ isZooming }),
      setMapCenter: (center) => set({ mapCenter: center }),
      setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
      setPanelWidth: (width) => set({ panelWidth: width }),
      openDialog: (dialogId) => set((state) => ({
        activeDialogs: new Set([...state.activeDialogs, dialogId])
      })),
      closeDialog: (dialogId) => set((state) => {
        const newDialogs = new Set(state.activeDialogs);
        newDialogs.delete(dialogId);
        return { activeDialogs: newDialogs };
      }),
      closeAllDialogs: () => set({ activeDialogs: new Set() }),
    }),
    {
      name: 'ui-store',
    }
  )
); 