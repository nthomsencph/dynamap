import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import { Italic, Underline as UnderlineIcon } from 'lucide-react';
import { AiOutlineFontSize } from 'react-icons/ai';
import { RxFontFamily } from 'react-icons/rx';
import { MdOutlineFormatClear } from 'react-icons/md';
import { RiLineHeight } from 'react-icons/ri';
import { getFontSizeForArea } from '@/app/utils/area';
import '@/css/label-editor.css';
import Dropdown from './Dropdown';
import { BackColor } from './extensions/backgroundColorExtension';
import { LineHeight } from './extensions/lineHeightExtension';
import Placeholder from '@tiptap/extension-placeholder';

interface LabelEditorProps {
  value: string;
  onChange: (html: string) => void;
  text?: string; // The label text (from name)
  isRegion?: boolean;
  regionArea?: number;
  className?: string;
  placeholder?: string;
}

const LabelEditor: React.FC<LabelEditorProps> = ({
  value,
  onChange,
  text,
  isRegion = false,
  regionArea,
  className = '',
  placeholder,
}) => {
  const lastTextRef = useRef(text);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false, // Disable bold from StarterKit to use our own
      }),
      Bold, // Add Bold explicitly
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      Color,
      BackColor,
      Underline,
      TextStyle,
      LineHeight.configure({
        heights: ['50%', '75%', '80%', '100%', '125%', '150%', '175%', '200%'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Enter text...',
        emptyEditorClass: 'is-editor-empty',
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
    ],
    immediatelyRender: false,
    content: text ? `<p><span>${text}</span></p>` : value,
    editable: true,
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();

      // If text prop is provided, prevent text content changes but allow styling
      if (text) {
        const currentText = editor.getText();
        if (currentText !== text) {
          // Text was changed, revert to original text but preserve styles
          const html = editor.getHTML();
          const styledHTML = html.replace(
            /(<[^>]*>)(.*?)(<\/[^>]*>)/g,
            (match, openTag, content, closeTag) => {
              if (content.trim() && content !== text) {
                return `${openTag}${text}${closeTag}`;
              }
              return match;
            }
          );
          editor.commands.setContent(styledHTML, false);
          return;
        }
      }

      // Only call onChange for non-text props or when content actually changes
      if (!text && htmlContent !== value) {
        onChange(htmlContent);
      } else if (text) {
        onChange(htmlContent);
      }
    },
    editorProps: {
      attributes: {
        class: 'label-preview',
        role: 'textbox',
        'aria-label': 'Label editor',
      },
      // Prevent text selection and editing when text prop is provided
      handleKeyDown: (view, event) => {
        if (text) {
          // Allow only styling shortcuts, prevent text input
          const isStyleShortcut =
            (event.ctrlKey || event.metaKey) &&
            ['b', 'i', 'u'].includes(event.key.toLowerCase());

          if (!isStyleShortcut) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      handleTextInput: (view, from, to, inputText) => {
        // Prevent text input when text prop is provided
        if (text) {
          return true;
        }
        return false;
      },
    },
  });

  // Sync label text with name
  useEffect(() => {
    if (editor && text && lastTextRef.current !== text) {
      const html = editor.getHTML();
      // Replace the text content but keep the styles
      const styledHTML = html.replace(
        /(<[^>]*>)(.*?)(<\/[^>]*>)/g,
        (match, openTag, content, closeTag) => {
          if (content.trim()) {
            return `${openTag}${text}${closeTag}`;
          }
          return match;
        }
      );

      if (html !== styledHTML) {
        editor.commands.setContent(styledHTML, false);
      }
      lastTextRef.current = text;
    }
  }, [text, editor]);

  if (!editor) return <div className="rte-loading">Loading editor...</div>;

  // Helper to apply style to all text
  const applyToAll = (command: string, options?: any) => {
    if (command === 'toggleBold') {
      editor.chain().focus().selectAll().toggleBold().run();
    } else if (command === 'toggleItalic') {
      editor.chain().focus().selectAll().toggleItalic().run();
    } else if (command === 'toggleUnderline') {
      editor.chain().focus().selectAll().toggleUnderline().run();
    } else if (command === 'setFontFamily') {
      editor.chain().focus().selectAll().setFontFamily(options).run();
    } else if (command === 'setFontSize') {
      editor.chain().focus().selectAll().setFontSize(options).run();
    } else if (command === 'setColor') {
      editor.chain().focus().selectAll().setColor(options).run();
    } else if (command === 'setBackgroundColor') {
      editor.chain().focus().selectAll().setBackColor(options).run();
    } else if (command === 'setLineHeight') {
      editor.chain().focus().selectAll().setLineHeight(options).run();
    } else if (command === 'clearFormatting') {
      // Remove all styling: bold, italic, underline, color, background color, font family, font size
      editor
        .chain()
        .focus()
        .selectAll()
        .unsetBold()
        .unsetItalic()
        .unsetUnderline()
        .unsetColor()
        .unsetBackColor()
        .unsetFontFamily()
        .unsetFontSize()
        .unsetLineHeight()
        .run();
    }
    // Collapse selection to end after applying style
    editor.commands.setTextSelection(editor.state.doc.content.size);
  };

  return (
    <div className={`rte-wrapper ${className}`}>
      <div className="tiptap-editor-wrapper">
        <div
          className="rte-toolbar"
          role="toolbar"
          aria-label="Label formatting"
        >
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              applyToAll('toggleBold');
            }}
            className={editor.isActive('bold') ? 'active' : ''}
          >
            <span
              style={{
                fontWeight: 'bold',
                fontSize: 16,
                fontFamily: 'inherit',
                letterSpacing: 1,
              }}
            >
              B
            </span>
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              applyToAll('toggleItalic');
            }}
            className={editor.isActive('italic') ? 'active' : ''}
          >
            <Italic size={16} />
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              applyToAll('toggleUnderline');
            }}
            className={editor.isActive('underline') ? 'active' : ''}
          >
            <UnderlineIcon size={16} />
          </button>
          {/* Font family dropdown */}
          <Dropdown
            icon={
              <RxFontFamily
                size={20}
                style={{ color: '#fff', fontWeight: 'bold' }}
              />
            }
            options={[
              { label: 'Arial', value: 'Arial, sans-serif' },
              { label: 'Georgia', value: 'Georgia, serif' },
              { label: 'Times', value: "'Times New Roman', serif" },
              { label: 'Courier', value: "'Courier New', monospace" },
              { label: 'Fantasy', value: 'fantasy' },
              { label: 'Serif', value: 'serif' },
              { label: 'Sans-serif', value: 'sans-serif' },
              { label: 'Monospace', value: 'monospace' },
              {
                label: 'UnifrakturMaguntia',
                value: "'UnifrakturMaguntia', cursive",
              },
              {
                label: 'Passions Conflict',
                value: "'Passions Conflict', cursive",
              },
              { label: 'Festive', value: "'Festive', cursive" },
              { label: 'Arizonia', value: "'Arizonia', cursive" },
              { label: 'Petemoss', value: "'Petemoss', cursive" },
              { label: 'Kaushan Script', value: "'Kaushan Script', cursive" },
              {
                label: 'Fredericka the Great',
                value: "'Fredericka the Great', cursive",
              },
              { label: 'Meddon', value: "'Meddon', cursive" },
              { label: 'Jim Nightshade', value: "'Jim Nightshade', cursive" },
              { label: 'Felipa', value: "'Felipa', cursive" },
              { label: 'MedievalSharp', value: "'MedievalSharp', cursive" },
            ]}
            selected={undefined}
            onSelect={font => applyToAll('setFontFamily', font)}
            placeholder="Font"
            buttonClassName="rte-dropdown-btn"
            dropdownClassName="rte-dropdown-menu"
          />

          {/* Font size dropdown */}
          <Dropdown
            icon={<AiOutlineFontSize size={20} style={{ color: '#fff' }} />}
            options={[
              { label: '8px', value: '8px' },
              { label: '10px', value: '10px' },
              { label: '12px', value: '12px' },
              { label: '14px', value: '14px' },
              { label: '16px', value: '16px' },
              { label: '18px', value: '18px' },
              { label: '20px', value: '20px' },
              { label: '24px', value: '24px' },
              { label: '28px', value: '28px' },
              { label: '32px', value: '32px' },
              { label: '36px', value: '36px' },
              { label: '40px', value: '40px' },
              { label: '48px', value: '48px' },
              { label: '56px', value: '56px' },
              { label: '64px', value: '64px' },
              { label: '72px', value: '72px' },
              { label: '80px', value: '80px' },
              { label: '96px', value: '96px' },
              ...(isRegion && regionArea != null
                ? [
                    {
                      label: 'Area',
                      value: `${getFontSizeForArea(regionArea)}px`,
                    },
                  ]
                : []),
            ]}
            selected={undefined}
            onSelect={size => applyToAll('setFontSize', size)}
            placeholder="Size"
            buttonClassName="rte-dropdown-btn"
            dropdownClassName="rte-dropdown-menu"
          />

          {/* Line height dropdown */}
          <Dropdown
            icon={<RiLineHeight size={20} style={{ color: '#fff' }} />}
            options={[
              { label: '50%', value: '50%' },
              { label: '75%', value: '75%' },
              { label: '80%', value: '80%' },
              { label: '100%', value: '100%' },
              { label: '125%', value: '125%' },
              { label: '150%', value: '150%' },
              { label: '175%', value: '175%' },
              { label: '200%', value: '200%' },
            ]}
            selected={undefined}
            onSelect={height => applyToAll('setLineHeight', height)}
            placeholder="Line Height"
            buttonClassName="rte-dropdown-btn"
            dropdownClassName="rte-dropdown-menu"
          />

          <input
            type="color"
            onChange={e => {
              applyToAll('setColor', e.target.value);
            }}
            title="Text Color"
          />

          <input
            type="color"
            onChange={e => {
              applyToAll('setBackgroundColor', e.target.value);
            }}
            aria-label="Background Color"
            title="Background Color"
          />
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              applyToAll('clearFormatting');
            }}
            title="Clear formatting"
          >
            <MdOutlineFormatClear size={16} />
          </button>
        </div>
        <EditorContent editor={editor} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
};

export default LabelEditor;
