import React from 'react';
import { BasePanel } from '../BasePanel';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import type { MapElement } from '@/types/elements';

interface LocationPanelProps {
  location: Location;
  onClose: () => void;
  onBack?: () => void;
}

export function LocationPanel({ 
  location, 
  onClose, 
  onBack
}: LocationPanelProps) {
  return (
    <BasePanel
      element={location}
      onClose={onClose}
      onBack={onBack}
    />
  );
} 