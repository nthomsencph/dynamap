import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';

interface UseEditorSyncOptions {
  editor: Editor | null;
  value: string;
  onChange: (html: string) => void;
  syncOnMount?: boolean;
}

export function useEditorSync({ 
  editor, 
  value, 
  onChange, 
  syncOnMount = true 
}: UseEditorSyncOptions) {
  const isUpdatingRef = useRef(false);
  const lastValueRef = useRef(value);

  // Sync external value changes to editor
  useEffect(() => {
    if (!editor || isUpdatingRef.current) return;
    
    const currentContent = editor.getHTML();
    if (value !== currentContent && value !== lastValueRef.current) {
      lastValueRef.current = value;
      editor.commands.setContent(value || '', true);
    }
  }, [editor, value]);

  // Set up editor change handler
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = ({ editor }: { editor: Editor }) => {
      if (isUpdatingRef.current) return;
      
      isUpdatingRef.current = true;
      const newContent = editor.getHTML();
      lastValueRef.current = newContent;
      onChange(newContent);
      isUpdatingRef.current = false;
    };

    editor.on('update', handleUpdate);

    // Initial sync if requested
    if (syncOnMount && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', true);
    }

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, onChange, value, syncOnMount]);
} 