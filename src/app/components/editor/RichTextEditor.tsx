import React, { useState, useCallback, useEffect } from 'react';
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
  PaintBucket,
  Palette,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
} from 'lucide-react';
import { getFontSizeForArea } from '@/app/utils/area';
import '@/css/rich-text-editor.css';

// Type definitions
interface Location {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  isRegion?: boolean;
  regionArea?: number;
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

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  isRegion = false,
  regionArea,
  elements,
  rows = 1,
  className = '',
}) => {
  const [isTransparent, setIsTransparent] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');

  // Custom Background Color extension that properly saves to HTML
  const BackgroundColor = TextStyle.extend({
    addGlobalAttributes() {
      return [
        {
          types: ['textStyle'],
          attributes: {
            backgroundColor: {
              default: null,
              parseHTML: element => {
                const style = (element as HTMLElement).style;
                return style.backgroundColor || null;
              },
              renderHTML: attributes => {
                if (!attributes.backgroundColor) return {};
                return {
                  style: `background-color: ${attributes.backgroundColor}; padding: 4px 8px; border-radius: 4px; display: inline-block;`,
                };
              },
            },
          },
        },
      ];
    },
  });

  // Configure mention extension with simplified logic
  const mentionExtension = Mention.configure({
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
            
            // Create container
            popup = document.createElement('div');
            popup.style.position = 'absolute';
            popup.style.zIndex = '9999';
            document.body.appendChild(popup);

            // Position popup
            const rect = props.clientRect();
            if (rect) {
              popup.style.top = `${rect.bottom + window.scrollY}px`;
              popup.style.left = `${rect.left + window.scrollX}px`;
            }

            // Render component
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

  // Initialize editor with all extensions
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
      BackgroundColor,
      mentionExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'region-label-preview',
        role: 'textbox',
        'aria-label': 'Rich text editor',
        style: `
          font-family: fantasy !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #fafafa !important;
          text-align: center !important;
          white-space: pre !important;
          background: ${isTransparent ? 'transparent' : bgColor} !important;
          padding: 8px 12px !important;
          border-radius: 4px !important;
          min-height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        `,
      },
    },
  });

  // Sync content with value prop
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // Update editor styling when background changes
  useEffect(() => {
    if (editor?.view?.dom) {
      const editorDom = editor.view.dom as HTMLElement;
      editorDom.style.background = isTransparent ? 'transparent' : bgColor;
      
      // Remove all ProseMirror default styling
      editorDom.style.border = 'none';
      editorDom.style.outline = 'none';
      editorDom.style.boxShadow = 'none';
      editorDom.style.padding = '0';
      editorDom.style.margin = '0';
      
      // Also style the paragraph elements inside
      const paragraphs = editorDom.querySelectorAll('p');
      paragraphs.forEach(p => {
        (p as HTMLElement).style.margin = '0';
        (p as HTMLElement).style.padding = '0';
        (p as HTMLElement).style.background = 'transparent';
        (p as HTMLElement).style.border = 'none';
      });
      
      // Update the editor attributes to reflect current background
      editor.view.updateState(editor.state);
    }
  }, [editor, bgColor, isTransparent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Improved "apply to all" using document-level formatting
  const applyGlobalStyle = useCallback((command: () => void) => {
    if (!editor) return;
    
    try {
      // Select all content and apply command
      editor
        .chain()
        .focus()
        .selectAll()
        .run();
      
      command();
    } catch (error) {
      console.warn('Failed to apply global style:', error);
    }
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

  // Background color handlers - use custom backgroundColor attribute
  const handleBackgroundColorChange = useCallback((color: string) => {
    setBgColor(color);
    if (editor && !isTransparent) {
      // Apply background color using the custom backgroundColor attribute
      applyGlobalStyle(() => {
        editor.chain().setMark('textStyle', { backgroundColor: color }).run();
      });
      
      // Also apply to container for visual consistency during editing
      const container = editor.view.dom.closest('.tiptap-editor') as HTMLElement;
      if (container) {
        container.style.backgroundColor = color;
      }
    }
  }, [editor, isTransparent, applyGlobalStyle]);

  const handleTransparencyToggle = useCallback((transparent: boolean) => {
    setIsTransparent(transparent);
    if (editor) {
      if (transparent) {
        // Remove background color attribute
        applyGlobalStyle(() => {
          editor.chain().setMark('textStyle', { backgroundColor: null }).run();
        });
        
        const container = editor.view.dom.closest('.tiptap-editor') as HTMLElement;
        if (container) {
          container.style.backgroundColor = 'transparent';
        }
      } else {
        handleBackgroundColorChange(bgColor);
      }
    }
  }, [editor, bgColor, handleBackgroundColorChange, applyGlobalStyle]);

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
            onClick={() => applyGlobalStyle(() => editor.chain().toggleBold().run())}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold (Apply to All)"
            aria-label="Bold"
          >
            <Bold size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => applyGlobalStyle(() => editor.chain().toggleItalic().run())}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic (Apply to All)"
            aria-label="Italic"
          >
            <Italic size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => applyGlobalStyle(() => editor.chain().toggleUnderline().run())}
            className={editor.isActive('underline') ? 'active' : ''}
            title="Underline (Apply to All)"
            aria-label="Underline"
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="rte-toolbar-separator"></div>

          {/* Font Settings */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                applyGlobalStyle(() => editor.chain().setFontFamily(e.target.value).run());
                e.target.value = '';
              }
            }}
            className="font-family-select"
            title="Font Family (Apply to All)"
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
                  applyGlobalStyle(() => editor.chain().setFontSize(e.target.value).run());
                  e.target.value = '';
                }
              }}
              className="font-size-select"
              title="Font Size (Apply to All)"
              aria-label="Font Size"
            >
              <option value="">Size</option>
              <option value="12px">12px</option>
              <option value="16px">16px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              {isRegion && regionArea != null && (
                <option value={`${getFontSizeForArea(regionArea)}px`}>
                  Area
                </option>
              )}
            </select>
          </div>

          <div className="rte-toolbar-separator"></div>

          {/* Colors */}
          <div className="rte-color-group">
            <label title="Text Color (Apply to All)">
              <input
                type="color"
                onChange={(e) => applyGlobalStyle(() => editor.chain().setColor(e.target.value).run())}
                aria-label="Text Color"
              />
            </label>

            <div className="background-color-wrapper">
              <input
                type="color"
                className="background-color-picker"
                disabled={isTransparent}
                value={bgColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                title="Background Color"
                aria-label="Background Color"
              />
              <button
                type="button"
                className={`transparent-toggle ${isTransparent ? 'active' : ''}`}
                onClick={() => handleTransparencyToggle(!isTransparent)}
                title="Toggle Transparency"
                aria-label="Toggle Background Transparency"
              >
                T
              </button>
            </div>
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

        {/* Editor Content */}
        <div className="rte-preview-container">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;