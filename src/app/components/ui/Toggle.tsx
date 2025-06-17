import React from 'react';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Toggle({ 
  id, 
  checked, 
  onChange, 
  disabled = false, 
  className = '',
  'aria-label': ariaLabel 
}: ToggleProps) {
  return (
    <div className={`toggle-switch ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <label htmlFor={id} className="toggle-slider"></label>
    </div>
  );
} 