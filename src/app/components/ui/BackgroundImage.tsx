"use client";

import { useEffect } from 'react';
import { useMapSettings } from '../map/MapSettingsContext';

export function BackgroundImage() {
  const { backgroundImage, backgroundColor } = useMapSettings();

  useEffect(() => {
    // Apply background color or image to body
    if (backgroundColor && backgroundColor !== '#000000') {
      // Use background color if it's set and not the default black
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = backgroundColor;
    } else {
      // Use background image
      document.body.style.backgroundImage = `url('${backgroundImage}')`;
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundSize = 'cover';
    }

    // Cleanup function to reset background when component unmounts
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundColor = '';
    };
  }, [backgroundImage, backgroundColor]);

  return null; // This component doesn't render anything
} 