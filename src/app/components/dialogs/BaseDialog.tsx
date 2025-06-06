import React, { useState, useEffect } from 'react';
import type { DialogTab } from '@/types/dialogs';
import { ELEMENT_ICONS, type ElementIcon, type MapElement } from '@/types/elements';
import DescriptionEditor from '@/app/components/editor/DescriptionEditor';
import LabelEditor from '@/app/components/editor/LabelEditor';
import { IoAdd, IoCheckmark } from 'react-icons/io5';
import '@/css/dialogs/base-dialog.css';
import { useTypes } from '@/hooks/elements/useTypes';
import { useLocations } from '@/hooks/elements/useLocations';
import { useRegions } from '@/hooks/elements/useRegions';

interface BaseDialogProps<T extends MapElement> {
  open: boolean;
  mode: 'create' | 'edit';
  element?: Partial<T>;
  onSave: (element: T) => void;
  onDelete?: (element: T) => void;
  onClose: () => void;
  defaultColor: string;
  title: string;
  typeCategory: 'locations' | 'regions';
  validateForm: (form: Partial<T>) => string | null;
  stylingFields?: {
    fields: Array<{
      id: string;
      label: string;
      type: 'range' | 'checkbox';
      min?: number;
      max?: number;
      defaultValue: number | boolean;
      getValue: (element: Partial<T>) => number | boolean;
      onChange: (element: Partial<T>, value: number | boolean) => Partial<T>;
    }>;
  };
  richTextEditorProps?: {
    isRegion?: boolean;
    regionArea?: number;
  };
}

export function BaseDialog<T extends MapElement>({
  open,
  mode,
  element,
  onSave,
  onDelete,
  onClose,
  defaultColor,
  title,
  typeCategory,
  validateForm,
  stylingFields,
  richTextEditorProps = {}
}: BaseDialogProps<T>) {
  const { types, addType } = useTypes();
  const { locations } = useLocations();
  const { regions } = useRegions();

  const DEFAULT_ICON = Object.keys(ELEMENT_ICONS)[0] as ElementIcon;

  const [form, setForm] = useState<Partial<T>>({
    color: defaultColor,
    icon: DEFAULT_ICON,
    showLabel: true,
    prominence: 5,
    fields: {},
  } as unknown as Partial<T>);

  const [activeTab, setActiveTab] = useState<DialogTab>('content');
  const [newType, setNewType] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [iconGalleryBg, setIconGalleryBg] = useState<'light' | 'dark'>('dark');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (element) setForm(element);
    } else {
      setForm({} as Partial<T>);
    }
    setError(null);
  }, [open, element]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setForm({} as Partial<T>);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (form.color) {
      const brightness = getColorBrightness(form.color);
      setIconGalleryBg(brightness > 0.5 ? 'dark' : 'light');
    }
  }, [form.color]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (color: string) => setForm(prev => ({ ...prev, color }));
  const handleProminenceChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, prominence: Number(e.target.value) }));
  const handleIconSelect = (icon: ElementIcon) => setForm(prev => ({ ...prev, icon }));

  const handleAddField = () => {
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
  };

  const handleRemoveField = (key: string) => {
    setForm(prev => {
      const { [key]: _, ...rest } = (prev.fields || {}) as Record<string, string>;
      return { ...prev, fields: rest };
    });
  };

  const handleUpdateField = (oldKey: string, newKey: string, newValue: string) => {
    setForm(prev => {
      const { [oldKey]: _, ...rest } = (prev.fields || {}) as Record<string, string>;
      return {
        ...prev,
        fields: {
          ...rest,
          [newKey]: newValue,
        },
      };
    });
  };

  const handleAddType = async () => {
    if (!newType.trim()) return;
    setIsAddingType(true);
    try {
      await addType(typeCategory, newType.trim());
      setForm(prev => ({ ...prev, type: newType.trim() }));
      setNewType('');
    } catch (err) {
      console.error('Failed to add type:', err);
    } finally {
      setIsAddingType(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const id = mode === 'create' ? crypto.randomUUID() : form.id!;
    onSave({ ...form, id } as T);
    setForm({} as Partial<T>);
  };

  if (!open) return null;

  // Get all elements for mentions
  const allElements = [...(locations || []), ...(regions || [])];

  return (
    <>
      <div 
        className="base-dialog-backdrop" 
        onClick={(e: React.MouseEvent) => { 
          const target = e.target as HTMLElement;
          const isEditorClick = target.closest('.ProseMirror') || target.closest('.editor-container') || target.closest('.rte-wrapper');
          if (!isEditorClick) {
            setForm({} as Partial<T>); 
            onClose(); 
          }
        }} 
      />
      <div className="base-dialog" onClick={e => e.stopPropagation()} aria-modal role="dialog">
        <h2>{mode === 'create' ? `Add ${title}` : `Edit ${title}`}</h2>
        <div className="dialog-tabs">
          {(['content', 'styling', 'custom'] as DialogTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              className={`dialog-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          {activeTab === 'content' && (
            <div className="dialog-tab-content">
              <label>Name
                <input name="name" value={form.name || ''} onChange={handleChange} required />
              </label>
              <div className="dialog-field-wrapper">
                <span className="dialog-field-label">Description</span>
                <div className="dialog-field">
                  <DescriptionEditor
                    value={form.description ?? ''}
                    onChange={html => setForm(f => ({ ...f, description: html }))}
                    elements={allElements}
                    rows={4}
                  />
                </div>
              </div>
              <div className="dialog-row">
                <label className="dialog-row-label" htmlFor="type">Type:</label>
                <div className="dialog-field type-field">
                  {!isAddingType ? (
                    <>
                      <select
                        id="type"
                        name="type"
                        value={form.type || ''}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select type</option>
                        {types[typeCategory].map((t: string) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsAddingType(true)} className="type-add-button" title="Add new type">
                        <IoAdd size={20} />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddType(); }}
                        placeholder="Enter new type"
                        autoFocus
                        className="type-input"
                      />
                      <button type="button" onClick={handleAddType} disabled={!newType.trim()} className="type-add-button">
                        <IoCheckmark size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <label>Image URL
                <input name="image" value={form.image || ''} onChange={handleChange} />
              </label>
            </div>
          )}
          {activeTab === 'styling' && (
            <div className="dialog-tab-content">
              <div className="dialog-field-wrapper">
                <span className="dialog-field-label">Label</span>
                <div className="dialog-field">
                  <LabelEditor
                    value={form.label ?? ''}
                    onChange={html => setForm(f => ({ ...f, label: html }))}
                    isRegion={richTextEditorProps.isRegion}
                    regionArea={richTextEditorProps.regionArea}
                    rows={1}
                  />
                </div>
              </div>
              <div className="dialog-row">
                <label className="dialog-row-label" htmlFor="showLabel">Show label:</label>
                <input
                  type="checkbox"
                  id="showLabel"
                  name="showLabel"
                  checked={form.showLabel !== false}
                  onChange={e => setForm(f => ({ ...f, showLabel: e.target.checked }))}
                />
              </div>
              {stylingFields?.fields.map(field => (
                <div key={field.id} className="dialog-row">
                  <label className="dialog-row-label" htmlFor={field.id}>{field.label}:</label>
                  {field.type === 'range' ? (
                    <div className="dialog-slider-wrapper">
                      <input
                        type="range"
                        id={field.id}
                        name={field.id}
                        min={field.min}
                        max={field.max}
                        value={field.getValue(element || {}) as number}
                        onChange={e => onSave(field.onChange(element || {}, Number(e.target.value)) as T)}
                      />
                      <span className="dialog-slider-value">
                        {field.getValue(element || {})}{field.id === 'iconSize' ? 'px' : ''}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="checkbox"
                      id={field.id}
                      name={field.id}
                      checked={field.getValue(element || {}) as boolean}
                      onChange={e => onSave(field.onChange(element || {}, e.target.checked) as T)}
                    />
                  )}
                </div>
              ))}
              <div className="dialog-row">
                <label className="dialog-row-label" htmlFor="prominence">Prominence:</label>
                <div className="dialog-slider-wrapper">
                  <input
                    type="range"
                    id="prominence"
                    name="prominence"
                    min={1}
                    max={10}
                    value={form.prominence || 5}
                    onChange={handleProminenceChange}
                  />
                  <span className="dialog-slider-value">{form.prominence}</span>
                </div>
              </div>
              <div className="dialog-row">
                <label className="dialog-row-label" htmlFor="color">Icon color:</label>
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={form.color || defaultColor}
                  onChange={e => handleColorChange(e.target.value)}
                />
              </div>
              <label>Icon</label>
              <div className={`icon-picker-grid ${iconGalleryBg}`}>
                {Object.entries(ELEMENT_ICONS).map(([key, { icon: Icon, label }]) => (
                  <button
                    type="button"
                    key={key}
                    className={`icon-picker-btn${form.icon === key ? ' selected' : ''}`}
                    onClick={() => handleIconSelect(key as ElementIcon)}
                    title={label}
                  >
                    <Icon size={28} color={form.color || defaultColor} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'custom' && (
            <div className="dialog-tab-content">
              <div className="fields-section">
                <div className="fields-list">
                  {(Object.entries(form.fields || {}) as [string, string][]).map(([key, value]) => (
                    <div key={key} className="field-row">
                      <input
                        type="text"
                        value={key}
                        onChange={e => handleUpdateField(key, e.target.value, value)}
                        className="field-key"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={e => handleUpdateField(key, key, e.target.value)}
                        className="field-value"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveField(key)}
                        className="field-remove"
                        title="Remove field"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-add">
                  <input
                    type="text"
                    value={newFieldKey}
                    onChange={e => setNewFieldKey(e.target.value)}
                    placeholder="New field name"
                    className="field-key"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={e => setNewFieldValue(e.target.value)}
                    placeholder="New field value"
                    className="field-value"
                  />
                  <button
                    type="button"
                    onClick={handleAddField}
                    disabled={!newFieldKey.trim()}
                    className="field-add-btn"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
          {error && <div className="dialog-error">{error}</div>}
          <div className="dialog-actions">
            {mode === 'edit' && onDelete && (
              <button type="button" onClick={() => onDelete(element as T)} className="dialog-delete">
                Delete
              </button>
            )}
            <button type="button" className="dialog-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="dialog-save">Save</button>
          </div>
        </form>
      </div>
    </>
  );
}

function getColorBrightness(color: string): number {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}