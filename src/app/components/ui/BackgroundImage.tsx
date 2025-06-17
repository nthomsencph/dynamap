"use client";

import { useEffect } from 'react';
import { useMapSettings } from '../panels/MapSettingsContext';

export function BackgroundImage() {
  const { backgroundImage } = useMapSettings();

  useEffect(() => {
    // Apply background image to body with simple cover styling
    document.body.style.backgroundImage = `url('${backgroundImage}')`;
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';

    // Cleanup function to reset background when component unmounts
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundSize = '';
    };
  }, [backgroundImage]);

  return null; // This component doesn't render anything
} 