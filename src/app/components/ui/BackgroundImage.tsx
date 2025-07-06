"use client";

import { useSettings } from '@/hooks/useSettings';
import { useBodyStyles } from '@/hooks/ui/useBodyStyles';

export function BackgroundImage() {
  const { settings } = useSettings();
  const { backgroundImage, backgroundColor } = settings || {};

  // Use the new body styles hook instead of useEffect
  useBodyStyles({
    backgroundImage: backgroundColor && backgroundColor !== '#000000' 
      ? 'none' 
      : `url('${backgroundImage}')`,
    backgroundColor: backgroundColor && backgroundColor !== '#000000' 
      ? backgroundColor 
      : undefined,
    backgroundRepeat: backgroundColor && backgroundColor !== '#000000' 
      ? undefined 
      : 'no-repeat',
    backgroundPosition: backgroundColor && backgroundColor !== '#000000' 
      ? undefined 
      : 'center center',
    backgroundAttachment: backgroundColor && backgroundColor !== '#000000' 
      ? undefined 
      : 'fixed',
    backgroundSize: backgroundColor && backgroundColor !== '#000000' 
      ? undefined 
      : 'cover',
  });

  return null; // This component doesn't render anything
} 