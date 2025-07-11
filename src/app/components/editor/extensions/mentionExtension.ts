import Mention from '@tiptap/extension-mention';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

function getElementType(element: Location | Region): 'region' | 'location' {
  return element.elementType;
}

interface MentionItem {
  id: string;
  name: string;
  type: string;
  elementType: 'region' | 'location';
}

export function createMentionExtension(
  getElements: () => (Location | Region)[]
) {
  return Mention.extend({
    addAttributes() {
      return {
        id: { default: null },
        name: { default: null },
        type: { default: null },
        elementType: { default: null },
      };
    },
  }).configure({
    HTMLAttributes: {
      class: 'mention',
    },
    renderText({ node }) {
      return `@${node.attrs.name}`;
    },
    renderHTML({ node }) {
      return [
        'span',
        {
          class: 'mention',
          'data-id': node.attrs.id,
          'data-name': node.attrs.name,
          'data-type': node.attrs.type,
          'data-element-type': node.attrs.elementType,
        },
        `@${node.attrs.name}`,
      ];
    },
    suggestion: {
      items: ({ query }: { query: string }) => {
        const elements = getElements();
        if (!elements || !Array.isArray(elements) || elements.length === 0) {
          return [];
        }

        try {
          const filteredElements = elements
            .filter(element => {
              const hasValidStructure =
                element &&
                element.id &&
                element.name &&
                typeof element.name === 'string';

              if (!hasValidStructure) {
                return false;
              }

              const elementName = element.name as string;
              const matches = elementName
                .toLowerCase()
                .includes(query.toLowerCase());
              return matches;
            })
            .slice(0, 5)
            .map(element => ({
              id: element.id!,
              name: element.name!,
              type: element.type!,
              elementType: getElementType(element),
            }));

          return filteredElements;
        } catch (error) {
          return [];
        }
      },
      render: () => {
        let component: HTMLDivElement;
        let selectedIndex = 0;
        let currentItems: MentionItem[] = [];
        let currentCommand: ((item: MentionItem) => void) | null = null;

        const updateItems = (
          element: HTMLDivElement,
          items: MentionItem[],
          command: (item: MentionItem) => void,
          selected: number
        ) => {
          element.innerHTML = '';
          currentItems = items; // Store current items for keyboard navigation
          currentCommand = command; // Store current command for keyboard navigation

          // Safety check for items
          if (!items || !Array.isArray(items) || items.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = 'No elements found';
            emptyDiv.className = 'mention-empty';
            element.appendChild(emptyDiv);
            return;
          }

          items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.textContent = `${item.name} (${item.type})`;
            itemDiv.className = `mention-item ${index === selected ? 'selected' : ''}`;
            itemDiv.setAttribute('data-index', index.toString());

            itemDiv.addEventListener('mouseenter', () => {
              // Update selected index and visual state
              selectedIndex = index;
              updateVisualSelection(element, selectedIndex);
            });

            itemDiv.addEventListener('click', () => {
              // Ensure both id and name are passed to the command
              command({
                id: item.id,
                name: item.name,
                type: item.type,
                elementType: item.elementType,
              });
            });

            element.appendChild(itemDiv);
          });
        };

        const updateVisualSelection = (
          element: HTMLDivElement,
          selected: number
        ) => {
          // Remove previous selection styling
          const items = element.querySelectorAll('.mention-item');
          items.forEach((item, index) => {
            if (index === selected) {
              item.classList.add('selected');
              // Scroll into view if needed
              (item as HTMLElement).scrollIntoView({ block: 'nearest' });
            } else {
              item.classList.remove('selected');
            }
          });
        };

        return {
          onStart: (props: any) => {
            selectedIndex = 0;
            component = document.createElement('div');
            component.className = 'mention-dropdown';

            // Only set position styles, let CSS handle the appearance
            component.style.position = 'absolute';
            component.style.zIndex = '10010';

            // Position the dropdown
            const rect = props.clientRect();
            if (rect) {
              component.style.top = `${rect.bottom + window.scrollY + 4}px`;
              component.style.left = `${rect.left + window.scrollX}px`;
            }

            updateItems(
              component,
              props.items || [],
              props.command,
              selectedIndex
            );
            document.body.appendChild(component);
          },

          onUpdate: (props: any) => {
            if (
              !component ||
              !props ||
              !props.items ||
              !Array.isArray(props.items)
            ) {
              return;
            }

            // Ensure selectedIndex is within bounds
            selectedIndex = Math.min(
              selectedIndex,
              Math.max(0, props.items.length - 1)
            );
            updateItems(component, props.items, props.command, selectedIndex);

            // Update position if needed
            const rect = props.clientRect();
            if (rect) {
              component.style.top = `${rect.bottom + window.scrollY + 4}px`;
              component.style.left = `${rect.left + window.scrollX}px`;
            }
          },

          onKeyDown: (props: any) => {
            // Safety checks for component and items
            if (!component) {
              return false;
            }

            // Use currentItems instead of props.items for reliability
            if (!currentItems || currentItems.length === 0) {
              return false;
            }

            const { event } = props;

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              selectedIndex =
                selectedIndex > 0 ? selectedIndex - 1 : currentItems.length - 1;
              updateVisualSelection(component, selectedIndex);
              return true;
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              selectedIndex =
                selectedIndex < currentItems.length - 1 ? selectedIndex + 1 : 0;
              updateVisualSelection(component, selectedIndex);
              return true;
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              if (currentItems[selectedIndex] && currentCommand) {
                currentCommand(currentItems[selectedIndex]);
              }
              return true;
            }

            if (event.key === 'Escape') {
              return true;
            }
            return false;
          },

          onExit: () => {
            if (component && component.parentNode) {
              component.parentNode.removeChild(component);
            }
          },
        };
      },
    },
  });
}
