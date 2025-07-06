import { useEffect } from 'react';

interface BodyStyles {
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundRepeat?: string;
  backgroundPosition?: string;
  backgroundAttachment?: string;
  backgroundSize?: string;
  overflow?: string;
}

export function useBodyStyles(styles: BodyStyles) {
  useEffect(() => {
    const originalStyles: Record<string, string> = {};
    
    // Apply new styles and store originals
    Object.entries(styles).forEach(([property, value]) => {
      if (value !== undefined) {
        originalStyles[property] = document.body.style.getPropertyValue(property);
        document.body.style.setProperty(property, value);
      }
    });

    // Cleanup function to restore original styles
    return () => {
      Object.entries(originalStyles).forEach(([property, value]) => {
        if (value !== '') {
          document.body.style.setProperty(property, value);
        } else {
          document.body.style.removeProperty(property);
        }
      });
    };
  }, [styles]);
} 