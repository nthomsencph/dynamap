import { useState, useCallback, useMemo } from 'react';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

export type ElementType = 'location' | 'region' | 'search';

export interface PanelEntry {
  id: string;
  elementType: ElementType;
  element?: Location | Region; // Optional for search panels
  metadata?: {
    containingRegions?: Region[];
    regionToDisplay?: Region;
    // Search panel specific metadata
    searchQuery?: string;
    // Any other context-specific data
  };
}

export function usePanelStack() {
  const [panelStack, setPanelStack] = useState<PanelEntry[]>([]);
  
  const pushPanel = useCallback((entry: PanelEntry) => {
    setPanelStack(prev => [...prev, entry]);
  }, []);
  
  const popPanel = useCallback(() => {
    setPanelStack(prev => prev.slice(0, -1));
  }, []);
  
  const clearStack = useCallback(() => {
    setPanelStack([]);
  }, []);
  
  const currentPanel = useMemo(() => 
    panelStack[panelStack.length - 1] || null, 
    [panelStack]
  );
  
  const canGoBack = useMemo(() => 
    panelStack.length > 1, 
    [panelStack.length]
  );
  
  const stackDepth = useMemo(() => 
    panelStack.length, 
    [panelStack.length]
  );
  
  return {
    panelStack,
    currentPanel,
    pushPanel,
    popPanel,
    clearStack,
    canGoBack,
    stackDepth
  };
} 