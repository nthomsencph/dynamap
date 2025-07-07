import React, { useState, useRef, useEffect } from 'react';
import { HiMiniQuestionMarkCircle } from 'react-icons/hi2';
import '@/css/components/tooltip.css';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  text,
  position = 'top',
  delay = 500,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={`tooltip-trigger ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <HiMiniQuestionMarkCircle size={16} className="tooltip-icon" />
      {isVisible && (
        <div className={`tooltip tooltip-${position}`} role="tooltip">
          {text}
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
