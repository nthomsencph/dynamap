import React from 'react';
import type { DrawingTool } from '@/hooks/elements/usePolygonDraw';
import '@/css/ui/drawing-mode-banner.css';

interface DrawingModeBannerProps {
  isVisible: boolean;
  currentTool: DrawingTool;
  onCancel: () => void;
}

export function DrawingModeBanner({ isVisible }: DrawingModeBannerProps) {
  if (!isVisible) return null;

  return <div className="drawing-mode-banner-minimal">In drawing mode</div>;
}
