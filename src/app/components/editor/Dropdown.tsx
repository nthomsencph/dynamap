import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  icon: React.ReactNode;
  options: DropdownOption[];
  selected?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  buttonClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
  disabled?: boolean;
  maxHeight?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  icon,
  options,
  selected,
  onSelect,
  className = '',
  dropdownClassName = '',
  buttonClassName = '',
  optionClassName = '',
  selectedOptionClassName = '',
  disabled = false,
  maxHeight = '200px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectedOption = options.find(option => option.value === selected);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onMouseDown={e => { e.preventDefault(); toggleDropdown(); }}
        disabled={disabled}
        className={`
          flex items-center justify-center gap-1 px-2 py-1 rounded transition-colors
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-200 active:bg-gray-300'
          }
          ${buttonClassName}
        `}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Icon */}
        <span className="flex items-center justify-center">
          {icon}
        </span>
        
        {/* Dropdown arrow */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className={`
            absolute left-0 top-full mt-1 z-50 overflow-hidden
            bg-[#222] text-white border border-[#444] rounded-lg shadow-xl whitespace-nowrap
            ${dropdownClassName}
          `}
          role="listbox"
          style={{ minWidth: 'max-content' }}
        >
          <div 
            style={{ maxHeight, overflowY: 'scroll' }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 text-sm">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-2 text-left font-normal transition-colors
                      hover:bg-[#333] focus:bg-[#333] focus:outline-none
                      ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                      ${optionClassName}
                      ${isSelected ? selectedOptionClassName : ''}
                    `}
                    role="option"
                    aria-selected={isSelected}
                    style={{ border: 'none', borderRadius: 0, background: 'none' }}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;