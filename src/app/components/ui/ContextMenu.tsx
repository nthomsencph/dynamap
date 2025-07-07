import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '@/css/ui/context-menu.css';

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ open, x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  const menu = (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      tabIndex={-1}
      style={{
        top: y,
        left: x,
      }}
      onContextMenu={e => {
        e.preventDefault();
        onClose();
      }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          className={`context-menu-item ${item.danger ? 'danger' : ''}`}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          role="menuitem"
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  return createPortal(menu, document.body);
}
