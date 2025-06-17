import React, { useEffect, useRef } from 'react';
import { FaImage, FaUpload, FaLink, FaRegImages, FaRulerCombined, FaLock, FaUnlock } from 'react-icons/fa';
import './GeneralSettingsPanel.css';
import { useMapSettings } from './MapSettingsContext';
import LabelEditor from '../editor/LabelEditor';

export function GeneralSettingsPanel({ onClose }: { onClose: () => void }) {
  const { 
    mapImageRoundness, 
    setMapImageRoundness, 
    mapScale, 
    setMapScale, 
    mapImage, 
    setMapImage,
    mapImageSettings,
    setMapImageSettings,
    mapNameSettings,
    setMapNameSettings,
    backgroundImage,
    setBackgroundImage,
    backgroundColor,
    setBackgroundColor,
    imageGallery,
    addToImageGallery,
    editMode,
    setEditMode
  } = useMapSettings();
  const [showMapGallery, setShowMapGallery] = React.useState(false);
  const [showBgGallery, setShowBgGallery] = React.useState(false);
  const [showMapUrlDialog, setShowMapUrlDialog] = React.useState(false);
  const [showBgUrlDialog, setShowBgUrlDialog] = React.useState(false);
  const [mapUrlInput, setMapUrlInput] = React.useState('');
  const [bgUrlInput, setBgUrlInput] = React.useState('');
  const [isMapUploading, setIsMapUploading] = React.useState(false);
  const [isBgUploading, setIsBgUploading] = React.useState(false);
  const mapFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleMapFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMapUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url;
        setMapImage(imageUrl);
        addToImageGallery(imageUrl);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsMapUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleMapUrlSubmit = () => {
    if (mapUrlInput.trim()) {
      setMapImage(mapUrlInput.trim());
      addToImageGallery(mapUrlInput.trim());
      setMapUrlInput('');
      setShowMapUrlDialog(false);
    }
  };

  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBgUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url;
        setBackgroundImage(imageUrl);
        setBackgroundColor('#000000'); // Reset to default to use image
        addToImageGallery(imageUrl);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsBgUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleBgUrlSubmit = () => {
    if (bgUrlInput.trim()) {
      setBackgroundImage(bgUrlInput.trim());
      setBackgroundColor('#000000'); // Reset to default to use image
      addToImageGallery(bgUrlInput.trim());
      setBgUrlInput('');
      setShowBgUrlDialog(false);
    }
  };

  const updateMapImageSettings = (updates: Partial<typeof mapImageSettings>) => {
    setMapImageSettings({ ...mapImageSettings, ...updates });
  };

  const handleCustomDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (dimension === 'width') {
      let newHeight = mapImageSettings.customHeight;
      if (mapImageSettings.lockAspectRatio && mapImageSettings.customWidth > 0) {
        const aspectRatio = mapImageSettings.customHeight / mapImageSettings.customWidth;
        newHeight = Math.round(value * aspectRatio);
      }
      updateMapImageSettings({ customWidth: value, customHeight: newHeight });
    } else {
      let newWidth = mapImageSettings.customWidth;
      if (mapImageSettings.lockAspectRatio && mapImageSettings.customHeight > 0) {
        const aspectRatio = mapImageSettings.customWidth / mapImageSettings.customHeight;
        newWidth = Math.round(value * aspectRatio);
      }
      updateMapImageSettings({ customWidth: newWidth, customHeight: value });
    }
  };

  const updateMapNameSettings = (updates: Partial<typeof mapNameSettings>) => {
    setMapNameSettings({ ...mapNameSettings, ...updates });
  };

  return (
    <div className="general-settings-backdrop" onClick={onClose}>
      <div className="general-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>General Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Edit Mode Toggle */}
        <div className="panel-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={editMode}
              onChange={(e) => setEditMode(e.target.checked)}
            />
            <span>Edit mode</span>
          </label>
          <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
            When enabled, you can add, edit, and delete map elements via right-click context menu.
          </small>
        </div>

        {/* Map Name Settings - Always First */}
        <div className="panel-section">
          <label>Map Name Content</label>
          <LabelEditor
            value={mapNameSettings.content}
            onChange={(content: string) => updateMapNameSettings({ content })}
            placeholder="Enter and style map name here..."
          />
          
          <div className="input-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mapNameSettings.show}
                onChange={(e) => updateMapNameSettings({ show: e.target.checked })}
              />
              <span>Show map name</span>
            </label>
          </div>
          
          {mapNameSettings.show && (
            <div className="panel-section">
              <label>Map Name Position</label>
              <select 
                value={mapNameSettings.position} 
                onChange={(e) => updateMapNameSettings({ position: e.target.value as any })}
              >
                <option value="center">Center (Fades out on zoom)</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          )}
        </div>

        {/* Map Image Settings */}
        <div className="panel-section">
          <label>Map Image</label>
          <div className="input-row">
            <button 
              title="Upload" 
              onClick={() => mapFileInputRef.current?.click()}
              disabled={isMapUploading}
            >
              {isMapUploading ? '⏳' : <FaUpload />}
            </button>
            <button title="From URL" onClick={() => setShowMapUrlDialog(true)}>
              <FaLink />
            </button>
            <button title="Pick from gallery" onClick={() => setShowMapGallery(v => !v)}>
              <FaRegImages />
            </button>
          </div>
          <input
            ref={mapFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleMapFileUpload}
            style={{ display: 'none' }}
          />
          {showMapUrlDialog && (
            <div className="url-dialog">
              <input
                type="text"
                placeholder="Enter image URL..."
                value={mapUrlInput}
                onChange={(e) => setMapUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMapUrlSubmit()}
              />
              <div className="url-dialog-buttons">
                <button onClick={handleMapUrlSubmit}>OK</button>
                <button onClick={() => { setShowMapUrlDialog(false); setMapUrlInput(''); }}>Cancel</button>
              </div>
            </div>
          )}
          {showMapGallery && (
            <div className="gallery">
              {imageGallery.map((img, i) => (
                <img key={i} src={img} alt="gallery" className="gallery-img" onClick={() => setMapImage(img)} />
              ))}
            </div>
          )}
          {mapImage && <img src={mapImage} alt="Selected map" className="selected-img" />}
        </div>

        <div className="panel-section">
          <label>Map Image Size</label>
          <select 
            value={mapImageSettings.size} 
            onChange={(e) => updateMapImageSettings({ size: e.target.value as any })}
          >
            <option value="cover">Cover (fill map area)</option>
            <option value="contain">Contain (fit in map area)</option>
            <option value="auto">Auto (original size)</option>
            <option value="custom">Custom dimensions</option>
          </select>
        </div>

        {mapImageSettings.size === 'custom' && (
          <div className="panel-section">
            <label>Custom Dimensions</label>
            <div className="dimension-controls">
              <div className="dimension-row">
                <label>Width:</label>
                <input
                  type="number"
                  value={mapImageSettings.customWidth}
                  onChange={(e) => handleCustomDimensionChange('width', Number(e.target.value))}
                  min="1"
                  max="5000"
                />
                <span>px</span>
              </div>
              <div className="dimension-row">
                <label>Height:</label>
                <input
                  type="number"
                  value={mapImageSettings.customHeight}
                  onChange={(e) => handleCustomDimensionChange('height', Number(e.target.value))}
                  min="1"
                  max="5000"
                />
                <span>px</span>
              </div>
              <div className="aspect-ratio-toggle">
                <button
                  onClick={() => updateMapImageSettings({ lockAspectRatio: !mapImageSettings.lockAspectRatio })}
                  title={mapImageSettings.lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                >
                  {mapImageSettings.lockAspectRatio ? <FaLock /> : <FaUnlock />}
                </button>
                <span>Aspect Ratio {mapImageSettings.lockAspectRatio ? 'Locked' : 'Unlocked'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="panel-section">
          <label>Map Image Position</label>
          <select 
            value={mapImageSettings.position} 
            onChange={(e) => updateMapImageSettings({ position: e.target.value as any })}
          >
            <option value="center">Center</option>
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="center-left">Center Left</option>
            <option value="center-right">Center Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>

        <div className="panel-section">
          <label>Map image roundness</label>
          <input
            type="range"
            min="0"
            max="100"
            value={mapImageRoundness}
            onChange={(e) => setMapImageRoundness(Number(e.target.value))}
          />
          <span>{mapImageRoundness}%</span>
        </div>

        <div className="panel-section">
          <label>Map Image Border</label>
          <div className="input-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mapImageSettings.showBorder}
                onChange={(e) => updateMapImageSettings({ showBorder: e.target.checked })}
              />
              <span>Show border</span>
            </label>
          </div>
          {mapImageSettings.showBorder && (
            <div className="input-row">
              <label>Border Color:</label>
              <input
                type="color"
                value={mapImageSettings.borderColor}
                onChange={(e) => updateMapImageSettings({ borderColor: e.target.value })}
                title="Border Color"
              />
            </div>
          )}
        </div>

        <div className="panel-section">
          <label>Map scale (km per pixel)</label>
          <input
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={mapScale}
            onChange={(e) => setMapScale(Number(e.target.value))}
          />
          <span>{mapScale} km/pixel</span>
        </div>

        {/* Background Image Settings */}
        <div className="panel-section">
          <label>Background</label>
          <div className="input-row">
            <button 
              title="Upload" 
              onClick={() => bgFileInputRef.current?.click()}
              disabled={isBgUploading}
            >
              {isBgUploading ? '⏳' : <FaUpload />}
            </button>
            <button title="From URL" onClick={() => setShowBgUrlDialog(true)}>
              <FaLink />
            </button>
            <button title="Pick from gallery" onClick={() => setShowBgGallery(v => !v)}>
              <FaRegImages />
            </button>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              title="Background Color"
              style={{
                width: '32px',
                height: '32px',
                padding: '0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: backgroundColor
              }}
            />
          </div>
          <input
            ref={bgFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBgFileUpload}
            style={{ display: 'none' }}
          />
          {showBgUrlDialog && (
            <div className="url-dialog">
              <input
                type="text"
                placeholder="Enter image URL..."
                value={bgUrlInput}
                onChange={(e) => setBgUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBgUrlSubmit()}
              />
              <div className="url-dialog-buttons">
                <button onClick={handleBgUrlSubmit}>OK</button>
                <button onClick={() => { setShowBgUrlDialog(false); setBgUrlInput(''); }}>Cancel</button>
              </div>
            </div>
          )}
          {showBgGallery && (
            <div className="gallery">
              {imageGallery.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  alt="gallery" 
                  className="gallery-img" 
                  onClick={() => {
                    setBackgroundImage(img);
                    setBackgroundColor('#000000'); // Reset to default to use image
                  }} 
                />
              ))}
            </div>
          )}
          
          {/* Show selected background (image or color) */}
          {backgroundColor && backgroundColor !== '#000000' ? (
            <div className="selected-background">
              <div 
                className="selected-color-preview" 
                style={{ 
                  backgroundColor: backgroundColor,
                  width: '100px',
                  height: '100px',
                  borderRadius: '12px',
                  border: '2px solid #2563eb',
                  marginTop: '8px'
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                Using background color: {backgroundColor}
              </span>
            </div>
          ) : (
            backgroundImage && <img src={backgroundImage} alt="Selected background" className="selected-img" />
          )}
        </div>
      </div>
    </div>
  );
} 