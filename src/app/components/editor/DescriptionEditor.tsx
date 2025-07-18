import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { AiOutlineFontSize } from 'react-icons/ai';
import { RxFontFamily } from 'react-icons/rx';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import { createMentionExtension } from './extensions/mentionExtension';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { calculateDisplayYear } from '@/app/utils/timeline';
import { toast } from 'react-toastify';
import '@/css/description-editor.css';
import Dropdown from './Dropdown';

// Type definitions
interface DescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  elements: (Location | Region)[];
  rows?: number;
  className?: string;
}

const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  value,
  onChange,
  elements,
  rows = 4,
  className = '',
}) => {
  // Use ref to avoid stale closure issues
  const elementsRef = useRef(elements);
  const { currentYear, currentEpoch } = useTimelineContext();

  // Update ref whenever elements change
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Create mention extension with ref to avoid stale closure
  const mentionExtension = useMemo(() => {
    return createMentionExtension(() => {
      return elementsRef.current;
    });
  }, []); // Empty deps - create once, ref will always have fresh elements

  // Check if toolbar should be excluded from tab navigation
  const skipToolbarInTab = className.includes(
    'description-editor-no-toolbar-tab'
  );

  // Initialize editor with description-specific extensions
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR warning
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left', // Set default alignment to left
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: 'link',
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'image',
        },
      }),
      mentionExtension,
      Placeholder.configure({
        placeholder: 'Type your description here...',
        emptyEditorClass: 'is-editor-empty',
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange(newContent);
    },
    editorProps: {
      attributes: {
        class: 'description-editor-content',
        role: 'textbox',
        'aria-label': 'Description editor',
      },
    },
  });

  // Set initial alignment to left when editor is created
  useEffect(() => {
    if (editor) {
      editor.chain().focus().setTextAlign('left').run();
    }
  }, [editor]);

  // Sync editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', true);
    }
  }, [value, editor]);

  // Handle mention clicks and add visual styling for deleted mentions
  useEffect(() => {
    if (!editor) return;

    const handleMentionClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (!target.classList.contains('mention')) return;

      const mentionId = target.getAttribute('data-id');
      const mentionName = target.getAttribute('data-name');
      const mentionType = target.getAttribute('data-element-type');

      if (!mentionId || !mentionName) return;

      const element = elementsRef.current.find(el => el.id === mentionId);

      if (element) {
        // Element exists - could trigger navigation or other action
      } else {
        // Element doesn't exist in current year - show tooltip
        const displayYear = currentEpoch
          ? calculateDisplayYear(currentYear, currentEpoch)
          : currentYear;
        const yearLabel = currentEpoch
          ? `${currentEpoch.yearPrefix || ''} ${displayYear} ${currentEpoch.yearSuffix || ''}`.trim()
          : displayYear;

        toast.info(
          `${mentionName} doesn't exist in the current year (${yearLabel})`,
          {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }
    };

    // Add visual styling for deleted mentions
    const updateMentionStyling = () => {
      const mentions = editor.view.dom.querySelectorAll('.mention');
      mentions.forEach(mention => {
        const mentionId = mention.getAttribute('data-id');

        if (mentionId) {
          const elementExists = elementsRef.current.some(
            el => el.id === mentionId
          );

          if (!elementExists) {
            mention.classList.add('mention-deleted');
          } else {
            mention.classList.remove('mention-deleted');
          }
        }
      });
    };

    // Add click handler
    editor.view.dom.addEventListener('click', handleMentionClick);

    // Update styling initially and when elements change
    updateMentionStyling();

    return () => {
      editor.view.dom.removeEventListener('click', handleMentionClick);
    };
  }, [editor, elements, currentYear, currentEpoch]);

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
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: url.trim() })
          .run();
      } catch (error) {
        console.warn('Failed to insert link:', error);
      }
    }
  }, [editor]);

  if (!editor) {
    return <div className="rte-loading">Loading editor...</div>;
  }

  return (
    <div className={`description-editor-wrapper ${className}`} data-rows={rows}>
      <div className="description-editor-container">
        {/* Toolbar */}
        <div
          className="description-editor-toolbar"
          role="toolbar"
          aria-label="Text formatting"
        >
          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold"
            aria-label="Bold"
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <Bold size={16} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic"
            aria-label="Italic"
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <Italic size={16} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'active' : ''}
            title="Underline"
            aria-label="Underline"
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="rte-toolbar-separator"></div>

          {/* Font Settings */}
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
            onSelect={font => editor.chain().focus().setFontFamily(font).run()}
            placeholder="Font"
            buttonClassName="rte-dropdown-btn"
            dropdownClassName="rte-dropdown-menu"
          />

          <Dropdown
            icon={<AiOutlineFontSize size={20} style={{ color: '#fff' }} />}
            options={[
              { label: '12px', value: '12px' },
              { label: '14px', value: '14px' },
              { label: '16px', value: '16px' },
              { label: '18px', value: '18px' },
              { label: '20px', value: '20px' },
              { label: '24px', value: '24px' },
              { label: '28px', value: '28px' },
              { label: '32px', value: '32px' },
            ]}
            selected={undefined}
            onSelect={size => editor.chain().focus().setFontSize(size).run()}
            placeholder="Size"
            buttonClassName="rte-dropdown-btn"
            dropdownClassName="rte-dropdown-menu"
          />

          <div className="rte-toolbar-separator"></div>

          {/* Text Alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
            title="Align Left"
            aria-label="Align Left"
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <AlignLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
            title="Align Center"
            aria-label="Align Center"
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <AlignCenter size={16} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
            title="Align Right"
            aria-label="Align Right"
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <AlignRight size={16} />
          </button>

          <div className="rte-toolbar-separator"></div>

          {/* Text Color */}
          <div className="rte-color-group">
            <label title="Text Color">
              <input
                type="color"
                onChange={e =>
                  editor.chain().focus().setColor(e.target.value).run()
                }
                aria-label="Text Color"
                tabIndex={skipToolbarInTab ? -1 : 0}
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
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <ImageIcon size={16} />
          </button>

          <button
            type="button"
            onClick={insertLink}
            title="Insert Link"
            aria-label="Insert Link"
            tabIndex={skipToolbarInTab ? -1 : 0}
          >
            <LinkIcon size={16} />
          </button>
        </div>

        {/* Standard Editor Content */}
        <div className="description-editor-content-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default DescriptionEditor;
