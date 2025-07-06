import React from 'react';

// types
import type { DialogTab } from '@/types/dialogs';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';
import { ELEMENT_ICONS, type ElementIcon, type MapElement } from '@/types/elements';
import { DEFAULT_LOCATION_TYPES } from '@/types/locations';
import { DEFAULT_REGION_TYPES } from '@/types/regions';

// components
import Toggle from 'react-toggle';
import { Tooltip } from '@/app/components/ui/Tooltip';
import DescriptionEditor from '@/app/components/editor/DescriptionEditor';
import LabelEditor from '@/app/components/editor/LabelEditor';

// icons
import { IoAdd, IoCheckmark } from 'react-icons/io5';

// hooks
import { useMapElementsByYear } from '@/hooks/queries/useMapElements';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import { useBaseDialog } from '@/hooks/dialogs/useBaseDialog';

// css
import "react-toggle/style.css";
import '@/css/dialogs/base-dialog.css';

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
      showWhen?: (element: Partial<T>) => boolean;
    }>;
  };
  richTextEditorProps?: {
    isRegion?: boolean;
    regionArea?: number;
  };
  mapRef?: React.RefObject<L.Map | null>;
  onPreviewChange?: (previewElement: Partial<T>) => void;
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
  richTextEditorProps = {},
  mapRef,
  onPreviewChange
}: BaseDialogProps<T>) {
  // Always call ALL hooks first - never conditionally call hooks
  const { currentYear } = useTimelineContext();
  const { locations, regions } = useMapElementsByYear(currentYear);

  // Get the default types for this category
  const defaultTypes = typeCategory === 'locations' ? DEFAULT_LOCATION_TYPES : DEFAULT_REGION_TYPES;

  // Use the base dialog hook
  const hook = useBaseDialog({
    open,
    mode,
    element,
    defaultColor,
    typeCategory,
    onClose,
    mapRef,
    onPreviewChange
  });

  // Use hook values
  const {
    form,
    activeTab,
    newFieldKey,
    newFieldValue,
    iconGalleryBg,
    error,
    showIconGallery,
    setForm,
    setNewFieldKey,
    setNewFieldValue,
    setShowIconGallery,
    handleChange,
    handleColorChange,
    handleProminenceChange,
    handleIconSelect,
    handleAddField,
    handleRemoveField,
    handleSubmit,
    handleTabSwitch,
  } = hook;

  // Only render when dialog is open to prevent infinite API calls
  if (!open) return null;

  // Validate required fields for tab switching
  const validateRequiredFields = (): string | null => {
    if (!form.name?.trim()) {
      return 'Name is required';
    }
    if (!form.type?.trim()) {
      return 'Type is required';
    }
    return null;
  };

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
          {(['Content', 'Styling', 'Fields'] as DialogTab[]).map(tab => {
            const isDisabled = tab !== 'Content' && validateRequiredFields() !== null;
            return (
              <button
                key={tab}
                type="button"
                className={`dialog-tab ${activeTab === tab ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => handleTabSwitch(tab)}
                disabled={isDisabled}
                title={isDisabled ? 'Please fill out Name and Type fields first to access this tab' : ''}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          // Add default values for styling fields if they're not explicitly set
          const formToValidate = { ...form } as T;
          if (stylingFields?.fields) {
            stylingFields.fields.forEach(field => {
              if ((formToValidate as any)[field.id] === undefined) {
                (formToValidate as any)[field.id] = field.defaultValue;
              }
            });
          }
          
          // Call the hook's handleSubmit with the enhanced form
          handleSubmit(e, validateForm, onSave);
        }}>
          {activeTab === 'Content' && (
            <div className="dialog-tab-content">
              <div className="dialog-field">
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  placeholder="Type name here..."
                />
              </div>

              <div className="dialog-field">
                <Tooltip text="Categorize this element by type (e.g., 'Castle', 'Village'). You can select from common types or type your own." position="right" />
                <div className="type-field">
                  <input
                    type="text"
                    name="type"
                    value={form.type || ''}
                    onChange={handleChange}
                    placeholder="Select or type a type..."
                    list={`${typeCategory}-types`}
                  />
                  <datalist id={`${typeCategory}-types`}>
                    {defaultTypes.map(type => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="dialog-field">
                <DescriptionEditor
                  value={form.description || ''}
                  onChange={value => setForm(prev => ({ ...prev, description: value }))}
                  elements={[...locations, ...regions] as Array<Location | Region>}
                  {...richTextEditorProps}
                />
              </div>

              <div className="dialog-field">
                <Tooltip text="Optional: Add an image that will be displayed when this element is selected" position="right" />
                <input
                  type="text"
                  name="image"
                  value={form.image || ''}
                  onChange={handleChange}
                  placeholder="Enter image URL..."
                />
              </div>
            </div>
          )}
          {activeTab === 'Styling' && (
            <div className="dialog-tab-content">
              <div className="dialog-field-wrapper">
                <span className="dialog-field-label">Label</span>
                <div className="dialog-field">
                <LabelEditor
                  value={form.label ?? ''}
                  onChange={html => setForm(prev => ({ ...prev, label: html }))}
                  text={!form.label?.trim() ? form.name : undefined}
                  isRegion={richTextEditorProps.isRegion}
                  regionArea={richTextEditorProps.regionArea}
                />
                </div>
              </div>
              <div className="dialog-row">
                <label className="dialog-row-label" htmlFor="showLabel">
                  <span>Show label</span>
                  <Tooltip text="Toggle whether to display the element's name as a label" position="right" />
                </label>
                <Toggle
                  id="showLabel"
                  checked={form.showLabel === true}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, showLabel: e.target.checked }))}
                  aria-label="Show label"
                />
              </div>
              <div className={`label-settings-container ${form.showLabel === true ? 'expanded' : 'collapsed'}`}>
                <div className="dialog-row">
                  <label className="dialog-row-label" htmlFor="labelDirection">
                    <span>Label direction</span>
                    <Tooltip text="Choose where to position the label relative to the icon" position="right" />
                  </label>
                  <div className="direction-picker">
                    <div className="direction-grid">
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Left top' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Left top', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Left top"
                      >
                        ↖
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Mid top' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Mid top', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Mid top"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Right top' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Right top', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Right top"
                      >
                        ↗
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Left mid' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Left mid', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Left mid"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Center' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Center', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Center"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Right mid' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Right mid', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Right mid"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Left bottom' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Left bottom', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Left bottom"
                      >
                        ↙
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Mid bottom' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Mid bottom', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Mid bottom"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${form.labelPosition?.direction === 'Right bottom' ? 'selected' : ''}`}
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          labelPosition: { 
                            direction: 'Right bottom', 
                            offset: (prev.labelPosition as any)?.offset || 10.0 
                          }
                        }))}
                        title="Right bottom"
                      >
                        ↘
                      </button>
                    </div>
                  </div>
                </div>
                <div className="dialog-row">
                  <label className="dialog-row-label" htmlFor="labelOffset">
                    <span>Label offset</span>
                    <Tooltip text="Adjust the distance between the icon and its label" position="right" />
                  </label>
                  <div className="dialog-slider-wrapper">
                    <input
                      type="range"
                      id="labelOffset"
                      name="labelOffset"
                      min={1}
                      max={50}
                      value={form.labelPosition?.offset || 10.0}
                      onChange={e => setForm(prev => ({ 
                        ...prev, 
                        labelPosition: { 
                          direction: (prev.labelPosition as any)?.direction || 'Center', 
                          offset: Number(e.target.value) 
                        }
                      }))}
                    />
                    <span className="dialog-slider-value">{form.labelPosition?.offset || 10.0}</span>
                  </div>
                </div>
              </div>
              <div className="dialog-row">
                <label className="dialog-row-label" htmlFor="prominence">
                  <span>Prominence</span>
                  <Tooltip text="Set the zoom levels at which this element is visible (0 = always hidden, 10 = always visible)" />
                </label>
                <div className="dialog-slider-wrapper">
                  <div className="dual-range-slider">
                    <input
                      type="range"
                      id="prominence-lower"
                      min={0}
                      max={10}
                      value={(form.prominence as any)?.lower ?? 0}
                      onChange={(e) => handleProminenceChange('lower', Number(e.target.value))}
                      className="range-slider range-lower"
                    />
                    <input
                      type="range"
                      id="prominence-upper"
                      min={1}
                      max={10}
                      value={(form.prominence as any)?.upper ?? 5}
                      onChange={(e) => handleProminenceChange('upper', Number(e.target.value))}
                      className="range-slider range-upper"
                    />
                  </div>
                  <span className="dialog-slider-value">
                    {(form.prominence as any)?.lower ?? 0}-{(form.prominence as any)?.upper ?? 5}
                  </span>
                </div>
              </div>
              <div className="dialog-row">
                <label className="dialog-row-label" htmlFor="color">
                  <span>Icon color</span>
                  <Tooltip text="Choose the color for this element's icon" />
                </label>
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={form.color || defaultColor}
                  onChange={e => handleColorChange(e.target.value)}
                />
              </div>
              <div className="dialog-row">
                <label className="dialog-row-label">
                  <span>Icon</span>
                  <Tooltip text="Click to select an icon for this element" />
                </label>
                <button
                  type="button"
                  className={`icon-display-btn ${getColorBrightness(form.color || defaultColor) > 0.5 ? 'dark' : 'light'}`}
                  onClick={() => setShowIconGallery(true)}
                  title="Click to change icon"
                >
                  {form.icon && ELEMENT_ICONS[form.icon as ElementIcon] ? (
                    React.createElement(ELEMENT_ICONS[form.icon as ElementIcon].icon, {
                      size: 32,
                      color: form.color || defaultColor
                    })
                  ) : (
                    <div className="icon-placeholder">?</div>
                  )}
                </button>
              </div>
              {showIconGallery && (
                <div className="icon-gallery-overlay" onClick={() => setShowIconGallery(false)}>
                  <div className="icon-gallery-popup" onClick={e => e.stopPropagation()}>
                    <div className="icon-gallery-header">
                      <h3>Select Icon</h3>
                      <button
                        type="button"
                        className="icon-gallery-close"
                        onClick={() => setShowIconGallery(false)}
                      >
                        ×
                      </button>
                    </div>
                    <div className={`icon-picker-grid ${iconGalleryBg}`}>
                      {Object.entries(ELEMENT_ICONS).map(([key, { icon: Icon, label }]) => (
                        <button
                          key={key}
                          type="button"
                          className={`icon-picker-btn${form.icon === key ? ' selected' : ''}`}
                          onClick={() => {
                            handleIconSelect(key as ElementIcon);
                            setShowIconGallery(false);
                          }}
                          title={label}
                        >
                          <Icon size={28} color={form.color || defaultColor} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {stylingFields?.fields
                .filter(field => !field.showWhen || field.showWhen(form))
                .map(field => (
                <div key={field.id} className="dialog-row">
                  <label className="dialog-row-label" htmlFor={field.id}>
                    <span>{field.label}</span>
                    <Tooltip text={field.id === 'iconSize' ? 
                      "Adjust the size of the icon on the map" : 
                      field.id === 'areaFadeDuration' ? 
                      "Set how long the area highlight animation lasts" :
                      "Configure this setting"} />
                  </label>
                  {field.type === 'range' ? (
                    <div className="dialog-slider-wrapper">
                      <input
                        type="range"
                        id={field.id}
                        name={field.id}
                        min={field.min}
                        max={field.max}
                        value={field.getValue(form) as number}
                        onChange={e => setForm(prev => field.onChange(prev, Number(e.target.value)))}
                      />
                      <span className="dialog-slider-value">
                        {field.getValue(form)}{field.id === 'iconSize' ? '' : field.id === 'areaFadeDuration' ? '' : ''}
                      </span>
                    </div>
                  ) : (
                    <Toggle
                      id={field.id}
                      checked={field.getValue(form) as boolean}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => field.onChange(prev, e.target.checked))}
                      aria-label={field.label}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'Fields' && (
            <div className="dialog-tab-content">
              <div className="fields-section">
                <div className="fields-list">
                  {(Object.entries(form.fields || {}) as [string, string][]).map(([key, value]) => (
                    <div key={key} className="field-row">
                      <input
                        type="text"
                        value={key}
                        readOnly
                        className="field-key field-key-readonly"
                      />
                      <input
                        type="text"
                        value={value}
                        readOnly
                        className="field-value field-value-readonly"
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

// Helper function to get the brightness of a color
// used to determine the icon gallery background color
// based on the brightness of the icon color
function getColorBrightness(color: string): number {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}