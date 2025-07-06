import { useState, useEffect, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/ui/useKeyboardShortcuts';
import type { DialogTab } from '@/types/dialogs';
import type { MapElement } from '@/types/elements';

interface UseBaseDialogOptions<T extends MapElement> {
  open: boolean;
  mode: 'create' | 'edit';
  element?: Partial<T>;
  defaultColor: string;
  typeCategory: 'locations' | 'regions';
  onClose: () => void;
  mapRef?: React.RefObject<L.Map | null>;
  onPreviewChange?: (previewElement: Partial<T>) => void;
}

interface UseBaseDialogReturn<T extends MapElement> {
  form: Partial<T>;
  activeTab: DialogTab;
  newFieldKey: string;
  newFieldValue: string;
  iconGalleryBg: 'light' | 'dark';
  error: string | null;
  labelAutoInitialized: boolean;
  showIconGallery: boolean;
  setForm: (form: Partial<T> | ((prev: Partial<T>) => Partial<T>)) => void;
  setActiveTab: (tab: DialogTab) => void;
  setNewFieldKey: (key: string) => void;
  setNewFieldValue: (value: string) => void;
  setError: (error: string | null) => void;
  setLabelAutoInitialized: (initialized: boolean) => void;
  setShowIconGallery: (show: boolean) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleColorChange: (color: string) => void;
  handleProminenceChange: (type: 'lower' | 'upper', value: number) => void;
  handleIconSelect: (icon: string) => void;
  handleAddField: () => void;
  handleRemoveField: (key: string) => void;
  handleSubmit: (e: React.FormEvent, validateForm: (form: Partial<T>) => string | null, onSave: (element: T) => void) => void;
  handleTabSwitch: (tab: DialogTab) => void;
}

// Helper function to calculate color brightness
function getColorBrightness(color: string): number {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness using luminance formula
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function useBaseDialog<T extends MapElement>({
  open,
  mode,
  element,
  defaultColor,
  typeCategory,
  onClose,
  mapRef,
  onPreviewChange
}: UseBaseDialogOptions<T>): UseBaseDialogReturn<T> {
  // Form state
  const [form, setForm] = useState<Partial<T>>({} as Partial<T>);
  const [activeTab, setActiveTab] = useState<DialogTab>('Content');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [iconGalleryBg, setIconGalleryBg] = useState<'light' | 'dark'>('dark');
  const [error, setError] = useState<string | null>(null);
  const [labelAutoInitialized, setLabelAutoInitialized] = useState(false);
  const [showIconGallery, setShowIconGallery] = useState(false);

  // Default icon (first icon from ELEMENT_ICONS)
  const DEFAULT_ICON = 'MdCastle';

  // Form initialization effect
  useEffect(() => {
    if (open) {
      const defaults = {
        color: defaultColor,
        icon: DEFAULT_ICON,
        showLabel: true,
        labelPosition: { direction: 'Center' as const, offset: 10.0 },
        prominence: { lower: 0, upper: 5 },
        description: '',
        image: '',
        fields: {},
        elementType: typeCategory === 'regions' ? 'region' : 'location',
        // Region-specific defaults
        ...(typeCategory === 'regions' && {
          showBorder: true,
          showHighlight: true,
          areaFadeDuration: 800,
        }),
      };

      if (element) {
        // Merge defaults with element
        setForm({
          ...defaults,
          ...element,
          fields: element.fields || defaults.fields,
          labelPosition: element.labelPosition || defaults.labelPosition,
          prominence: element.prominence || defaults.prominence,
          description: element.description || defaults.description,
        });
      } else {
        // For create mode, use defaults
        setForm(defaults as unknown as Partial<T>);
      }
      
      setLabelAutoInitialized(mode === 'edit');
      setActiveTab('Content');
    } else {
      setForm({} as Partial<T>);
      setLabelAutoInitialized(false);
    }
    setError(null);
  }, [open, element, mode, defaultColor, typeCategory]);

  // Color brightness effect
  useEffect(() => {
    if (form.color) {
      const brightness = getColorBrightness(form.color);
      setIconGalleryBg(brightness > 0.5 ? 'dark' : 'light');
    }
  }, [form.color]);

  // Zoom to element when dialog opens in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && element && mapRef?.current) {
      const { flyToLocation } = require('@/app/utils/fly');
      const { getElementCenter } = require('@/app/utils/area');
      
      // Get the center position of the element
      const targetPosition = getElementCenter(element);
      
      // Fly to the element with a slight delay to ensure dialog is rendered
      setTimeout(() => {
        flyToLocation(mapRef.current!, targetPosition);
      }, 100);
    }
  }, [open, mode, element, mapRef]);

  // Send preview updates when form changes (for immediate visual feedback)
  useEffect(() => {
    if (onPreviewChange && form && Object.keys(form).length > 0 && element?.id) {
      // Create a preview element with current form data merged with original element
      const previewElement = {
        ...element,
        ...form,
        id: element.id,
        elementType: typeCategory === 'regions' ? 'region' : 'location'
      } as Partial<T>;
      
      onPreviewChange(previewElement);
    }
  }, [form, element, typeCategory, onPreviewChange]);

  // Keyboard shortcuts - only active when dialog is open
  useKeyboardShortcuts(open ? [
    {
      key: 'Escape',
      action: () => {
        setForm({} as Partial<T>);
        onClose();
      }
    }
  ] : []);

  // Event handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts filling required fields
    if ((name === 'name' || name === 'type') && value.trim() && error) {
      setError(null);
    }
  }, [error]);

  const handleColorChange = useCallback((color: string) => {
    setForm(prev => ({ ...prev, color }));
  }, []);

  const handleProminenceChange = useCallback((type: 'lower' | 'upper', value: number) => {
    setForm(prev => {
      const currentProminence = prev.prominence || { lower: 0, upper: 5 };
      const newProminence = { ...currentProminence, [type]: value };
      
      // Ensure lower <= upper
      if (type === 'lower' && value > newProminence.upper) {
        newProminence.upper = value;
      }
      if (type === 'upper' && value < newProminence.lower) {
        newProminence.lower = value;
      }
      
      return { ...prev, prominence: newProminence };
    });
  }, []);

  const handleIconSelect = useCallback((icon: string) => {
    setForm(prev => ({ ...prev, icon }));
  }, []);

  const handleAddField = useCallback(() => {
    if (!newFieldKey.trim()) return;
    setForm(prev => ({
      ...prev,
      fields: {
        ...(prev.fields || {}),
        [newFieldKey.trim()]: newFieldValue.trim(),
      },
    }));
    setNewFieldKey('');
    setNewFieldValue('');
  }, [newFieldKey, newFieldValue]);

  const handleRemoveField = useCallback((key: string) => {
    setForm(prev => {
      const { [key]: _, ...rest } = (prev.fields || {}) as Record<string, string>;
      return { ...prev, fields: rest };
    });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent, validateForm: (form: Partial<T>) => string | null, onSave: (element: T) => void) => {
    e.preventDefault();
    
    const formToValidate = {
      ...form,
    } as T;
    
    // If showLabel is true but no custom label is provided, use the name as the label
    if (!formToValidate.label?.trim() && formToValidate.name) {
      formToValidate.label = formToValidate.name;
    }
    
    const validationError = validateForm(formToValidate);
    if (validationError) {
      setError(validationError);
      return;
    }

    const id = mode === 'create' ? crypto.randomUUID() : form.id!;
    const elementType = typeCategory === 'regions' ? 'region' : 'location';
    onSave({ ...formToValidate, id, elementType } as T);
    setForm({} as Partial<T>);
  }, [form, mode, typeCategory]);

  const handleTabSwitch = useCallback((tab: DialogTab) => {
    // Always allow switching to Content tab
    if (tab === 'Content') {
      setActiveTab(tab);
      setError(null);
      return;
    }

    // For Styling and Fields tabs, check required fields
    if (!form.name?.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.type?.trim()) {
      setError('Type is required');
      return;
    }

    // Clear any existing error and switch tab
    setError(null);
    setActiveTab(tab);
  }, [form.name, form.type]);

  return {
    form,
    activeTab,
    newFieldKey,
    newFieldValue,
    iconGalleryBg,
    error,
    labelAutoInitialized,
    showIconGallery,
    setForm,
    setActiveTab,
    setNewFieldKey,
    setNewFieldValue,
    setError,
    setLabelAutoInitialized,
    setShowIconGallery,
    handleChange,
    handleColorChange,
    handleProminenceChange,
    handleIconSelect,
    handleAddField,
    handleRemoveField,
    handleSubmit,
    handleTabSwitch,
  };
} 