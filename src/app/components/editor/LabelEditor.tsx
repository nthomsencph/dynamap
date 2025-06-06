import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Type,
} from 'lucide-react';
import { getFontSizeForArea } from '@/app/utils/area';
import '@/css/rich-text-editor.css';

// Type definitions
interface LabelEditorProps {
  value: string;
  onChange: (html: string) => void;
  isRegion?: boolean;
  regionArea?: number;
  rows?: number;
  className?: string;
}

const LabelEditor: React.FC<LabelEditorProps> = ({
  value,
  onChange,
  isRegion = false,
  regionArea,
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

  // Initialize editor with label-specific extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Underline,
      BackgroundColor,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'region-label-preview',
        role: 'textbox',
        'aria-label': 'Label editor',
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

  // Apply style to entire document
  const applyGlobalStyle = useCallback((command: () => void) => {
    if (!editor) return;
    
    try {
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

  // Background color handlers - use custom backgroundColor attribute
  const handleBackgroundColorChange = useCallback((color: string) => {
    setBgColor(color);
    if (editor && !isTransparent) {
      applyGlobalStyle(() => {
        editor.chain().setMark('textStyle', { backgroundColor: color }).run();
      });
    }
  }, [editor, isTransparent, applyGlobalStyle]);

  const handleTransparencyToggle = useCallback((transparent: boolean) => {
    setIsTransparent(transparent);
    if (editor) {
      if (transparent) {
        applyGlobalStyle(() => {
          editor.chain().setMark('textStyle', { backgroundColor: null }).run();
        });
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
        <div className="rte-toolbar" role="toolbar" aria-label="Label formatting">
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
        </div>

        {/* Preview Editor Content */}
        <div className="rte-preview-container">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default LabelEditor;