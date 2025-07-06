"use client";
import React, { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
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

interface PanelStackContextType {
  panelStack: PanelEntry[];
  currentPanel: PanelEntry | null;
  canGoBack: boolean;
  stackDepth: number;
  pushPanel: (entry: PanelEntry) => void;
  popPanel: () => void;
  clearStack: () => void;
  replaceCurrentPanel: (entry: PanelEntry) => void;
  goBack: () => void;
}

const PanelStackContext = createContext<PanelStackContextType | undefined>(undefined);

export function PanelStackProvider({ children }: { children: ReactNode }) {
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
  
  const replaceCurrentPanel = useCallback((entry: PanelEntry) => {
    setPanelStack(prev => {
      if (prev.length === 0) return [entry];
      return [...prev.slice(0, -1), entry];
    });
  }, []);
  
  const goBack = useCallback(() => {
    if (panelStack.length > 1) {
      popPanel();
    }
  }, [panelStack.length, popPanel]);
  
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
  
  const value = useMemo(() => ({
    panelStack,
    currentPanel,
    canGoBack,
    stackDepth,
    pushPanel,
    popPanel,
    clearStack,
    replaceCurrentPanel,
    goBack
  }), [
    panelStack,
    currentPanel,
    canGoBack,
    stackDepth,
    pushPanel,
    popPanel,
    clearStack,
    replaceCurrentPanel,
    goBack
  ]);

  return (
    <PanelStackContext.Provider value={value}>
      {children}
    </PanelStackContext.Provider>
  );
}

export function usePanelStack() {
  const context = useContext(PanelStackContext);
  if (context === undefined) {
    throw new Error('usePanelStack must be used within a PanelStackProvider');
  }
  return context;
} 