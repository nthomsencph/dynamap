import React, { useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
} from 'lucide-react';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import '@/css/rich-text-editor.css';

// Type definitions
interface DescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  elements: (Location | Region)[];
  rows?: number;
  className?: string;
}

// Simplified mention list component
const MentionList = React.forwardRef<
  HTMLDivElement,
  {
    items: Array<{ id: string; label: string }>;
    command: (item: { id: string; label: string }) => void;
    selectedIndex: number;
    onSelect: (index: number) => void;
  }
>(({ items, command, selectedIndex, onSelect }, ref) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        onSelect(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1);
        event.preventDefault();
      } else if (event.key === 'ArrowDown') {
        onSelect(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0);
        event.preventDefault();
      } else if (event.key === 'Enter') {
        if (items[selectedIndex]) {
          command(items[selectedIndex]);
        }
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, command, onSelect]);

  if (items.length === 0) {
    return (
      <div ref={ref} className="mention-dropdown">
        <div className="mention-empty">No elements found</div>
      </div>
    );
  }

  return (
    <div ref={ref} className="mention-dropdown">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => command(item)}
          role="option"
          aria-selected={index === selectedIndex}
        >
          @{item.label}
        </div>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  value,
  onChange,
  elements,
  rows = 4,
  className = '',
}) => {
  // Configure mention extension
  const mentionExtension = useMemo(() => {
    return Mention.configure({
      HTMLAttributes: {
        class: 'mention',
      },
      renderLabel({ node }) {
        return `@${node.attrs.label}`;
      },
      suggestion: {
        items: ({ query }: { query: string }) => {
          return elements
            .filter((element) =>
              element.name?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map((element) => ({
              id: element.id,
              label: element.name,
            }));
        },
        render: () => {
          let component: any;
          let popup: any;
          let selectedIndex = 0;

          return {
            onStart: (props: any) => {
              selectedIndex = 0;
              
              popup = document.createElement('div');
              popup.style.position = 'absolute';
              popup.style.zIndex = '9999';
              document.body.appendChild(popup);

              const rect = props.clientRect();
              if (rect) {
                popup.style.top = `${rect.bottom + window.scrollY}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              }

              const root = (window as any).ReactDOM?.createRoot?.(popup);
              if (root) {
                component = (
                  <MentionList
                    items={props.items}
                    command={props.command}
                    selectedIndex={selectedIndex}
                    onSelect={(index) => { selectedIndex = index; }}
                  />
                );
                root.render(component);
              }
            },

            onUpdate: (props: any) => {
              selectedIndex = Math.min(selectedIndex, props.items.length - 1);
              const root = (window as any).ReactDOM?.createRoot?.(popup);
              if (root) {
                component = (
                  <MentionList
                    items={props.items}
                    command={props.command}
                    selectedIndex={selectedIndex}
                    onSelect={(index) => { selectedIndex = index; }}
                  />
                );
                root.render(component);
              }
            },

            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                return true;
              }
              return false;
            },

            onExit: () => {
              if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
              }
            },
          };
        },
      },
    });
  }, [elements]);

  // Initialize editor with description-specific extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'image',
        },
      }),
      mentionExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content description-editor',
        role: 'textbox',
        'aria-label': 'Description editor',
      },
    },
  });

  // Sync content with value prop
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Media insertion handlers
  const insertImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Enter image URL:');
    if (url?.trim()) {
      try {
        editor.chain().focus().setImage({ src: url.trim() }).run();
      } catch (error) {
        console.warn('Failed to insert image:', error);
      }
    }
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Enter link URL:');
    if (url?.trim()) {
      try {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
      } catch (error) {
        console.warn('Failed to insert link:', error);
      }
    }
  }, [editor]);

  if (!editor) {
    return <div className="rte-loading">Loading editor...</div>;
  }

  return (
    <div className={`rte-wrapper ${className}`} data-rows={rows}>
      <div className="tiptap-editor-wrapper">
        {/* Toolbar */}
        <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold"
            aria-label="Bold"
          >
            <Bold size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic"
            aria-label="Italic"
          >
            <Italic size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'active' : ''}
            title="Underline"
            aria-label="Underline"
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="rte-toolbar-separator"></div>

          {/* Font Settings */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setFontFamily(e.target.value).run();
                e.target.value = '';
              }
            }}
            className="font-family-select"
            title="Font Family"
            aria-label="Font Family"
          >
            <option value="">Font</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Times New Roman', serif">Times</option>
            <option value="'Courier New', monospace">Courier</option>
            <option value="fantasy">Fantasy</option>
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans-serif</option>
            <option value="monospace">Monospace</option>
          </select>

          <div className="font-size-icon-select-wrapper">
            <Type className="font-size-icon" size={16} />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  editor.chain().focus().setFontSize(e.target.value).run();
                  e.target.value = '';
                }
              }}
              className="font-size-select"
              title="Font Size"
              aria-label="Font Size"
            >
              <option value="">Size</option>
              <option value="12px">12px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              <option value="28px">28px</option>
              <option value="32px">32px</option>
            </select>
          </div>

          <div className="rte-toolbar-separator"></div>

          {/* Text Alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
            title="Align Left"
            aria-label="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
            title="Align Center"
            aria-label="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
            title="Align Right"
            aria-label="Align Right"
          >
            <AlignRight size={16} />
          </button>

          <div className="rte-toolbar-separator"></div>

          {/* Text Color */}
          <div className="rte-color-group">
            <label title="Text Color">
              <input
                type="color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                aria-label="Text Color"
              />
            </label>
          </div>

          <div className="rte-toolbar-separator"></div>

          {/* Media */}
          <button
            type="button"
            onClick={insertImage}
            title="Insert Image"
            aria-label="Insert Image"
          >
            <ImageIcon size={16} />
          </button>
          
          <button
            type="button"
            onClick={insertLink}
            title="Insert Link"
            aria-label="Insert Link"
          >
            <LinkIcon size={16} />
          </button>
        </div>

        {/* Standard Editor Content */}
        <div className="tiptap-editor description-editor-container">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default DescriptionEditor;