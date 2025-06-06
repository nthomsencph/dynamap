import React, { useEffect, useState } from 'react';
import '@/css/ui/lightbox.css';

interface LightboxProps {
  imageUrl: string | undefined;
  alt: string;
  onClose: () => void;
}

export function Lightbox({ imageUrl, alt, onClose }: LightboxProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Trigger animation after mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  if (!imageUrl) return null;

  return (
    <div 
      className={`lightbox-backdrop ${isVisible ? 'visible' : ''}`} 
      onClick={onClose}
    >
      <div 
        className={`lightbox-content ${isVisible ? 'visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <img src={imageUrl} alt={alt} />
        <button className="lightbox-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
} 