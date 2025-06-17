import { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_PANEL_WIDTH = 450;
const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 800;

export function usePanelWidth(initialWidth: number = DEFAULT_PANEL_WIDTH) {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    
    // Add cursor style to body
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = startXRef.current - e.clientX;
    const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, startWidthRef.current + deltaX));
    
    setWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return {
    width,
    isDragging,
    handleMouseDown,
  };
} 