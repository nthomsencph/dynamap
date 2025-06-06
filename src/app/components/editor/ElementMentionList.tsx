import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import '@/css/element-mention-list.css';

type Element = Location | Region;

interface ElementMentionListProps {
  items: Element[];
  command: (element: Element) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const ElementMentionList = forwardRef<MentionListRef, ElementMentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const element = props.items[index];
    if (element) {
      props.command(element);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const isLocation = (element: Element): element is Location => {
    return Array.isArray(element.position) && !Array.isArray(element.position[0]);
  };

  return (
    <div className="element-mention-list">
      {props.items.length ? (
        props.items.map((element, index) => (
          <button
            className={`element-mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
            key={element.id}
            onClick={() => selectItem(index)}
          >
            <span className="element-mention-name">{element.name}</span>
            <span className="element-mention-type">
              {element.type}
              {isLocation(element) ? ' (Location)' : ' (Region)'}
            </span>
          </button>
        ))
      ) : (
        <div className="element-mention-empty">No elements found</div>
      )}
    </div>
  );
});

ElementMentionList.displayName = 'ElementMentionList'; 