import React from 'react';
import { FaLink, FaRegImages } from 'react-icons/fa';
import '@/css/panels/settings-panel.css'
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';
import LabelEditor from '../editor/LabelEditor';

export function GeneralSettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const { updateSetting } = useUpdateSetting();
  
  // Destructure settings with fallbacks
  const {
    mapImageRoundness = 100,
    mapScale = 17.4,
    mapImage = '/media/map.jpg',
    mapImageSettings = { size: 'contain', position: 'center', customWidth: 4000, customHeight: 3000, lockAspectRatio: true, showBorder: false, borderColor: '#000000' },
    mapNameSettings = { content: '', show: false, position: 'center' },
    backgroundImage = '/media/parchment.jpeg',
    backgroundColor = '#000000',
    imageGallery = ['/media/map.jpg', '/media/parchment.jpeg', '/media/404.jpeg'],
    editMode = true,
    startYear = 2024,
    showTimeline = true,
    showTimelineWhenZoomed = true,
    showSettingsWhenZoomed = true
  } = settings || {};

  const [showMapGallery, setShowMapGallery] = React.useState(false);
  const [showBgGallery, setShowBgGallery] = React.useState(false);
  const [showMapUrlDialog, setShowMapUrlDialog] = React.useState(false);
  const [showBgUrlDialog, setShowBgUrlDialog] = React.useState(false);
  const [mapUrlInput, setMapUrlInput] = React.useState('');
  const [bgUrlInput, setBgUrlInput] = React.useState('');



  const handleMapUrlSubmit = () => {
    if (mapUrlInput.trim()) {
      updateSetting('mapImage', mapUrlInput.trim());
      updateSetting('imageGallery', [...imageGallery, mapUrlInput.trim()]);
      setMapUrlInput('');
      setShowMapUrlDialog(false);
    }
  };



  const handleBgUrlSubmit = () => {
    if (bgUrlInput.trim()) {
      updateSetting('backgroundImage', bgUrlInput.trim());
      updateSetting('backgroundColor', '#000000'); // Reset to default to use image
      updateSetting('imageGallery', [...imageGallery, bgUrlInput.trim()]);
      setBgUrlInput('');
      setShowBgUrlDialog(false);
    }
  };

  const updateMapImageSettings = (updates: Partial<typeof mapImageSettings>) => {
    updateSetting('mapImageSettings', { ...mapImageSettings, ...updates });
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
    updateSetting('mapNameSettings', { ...mapNameSettings, ...updates });
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
              onChange={(e) => updateSetting('editMode', e.target.checked)}
            />
            <span>Edit mode</span>
          </label>
          <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
            When enabled, you can add, edit, and delete map elements via right-click context menu.
          </small>
        </div>

        {/* Timeline Settings */}
        <div className="panel-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showTimeline}
              onChange={(e) => updateSetting('showTimeline', e.target.checked)}
            />
            <span>Show timeline</span>
          </label>
          <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
            When enabled, the timeline slider is visible and accessible at all zoom levels.
          </small>
        </div>

        <div className="panel-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showTimelineWhenZoomed}
              onChange={(e) => updateSetting('showTimelineWhenZoomed', e.target.checked)}
            />
            <span>Show timeline when zoomed</span>
          </label>
          <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
            When enabled, the timeline button remains visible even when zoomed in on the map.
          </small>
        </div>

        <div className="panel-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showSettingsWhenZoomed}
              onChange={(e) => updateSetting('showSettingsWhenZoomed', e.target.checked)}
            />
            <span>Show settings when zoomed</span>
          </label>
          <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
            When enabled, the settings button remains visible even when zoomed in on the map.
          </small>
        </div>

        {/* Start Year Setting */}
        <div className="panel-section">
          <label>Start Year</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => updateSetting('startYear', Number(e.target.value))}
            min="1"
            max="9999"
            placeholder="2024"
          />
        </div>

        {/* Map Image Section */}
        <div className="panel-section">
          <h3>Map Image</h3>
          
          {/* Current Map Image */}
          <div className="current-image">
            <img src={mapImage} alt="Current map" />
                          <div className="image-actions">
                <button onClick={() => setShowMapGallery(true)}>
                  <FaRegImages /> Gallery
                </button>
                <button onClick={() => setShowMapUrlDialog(true)}>
                  <FaLink /> URL
                </button>
              </div>
          </div>



          {/* Map Gallery */}
          {showMapGallery && (
            <div className="image-gallery">
              <div className="gallery-header">
                <h4>Select Map Image</h4>
                <button onClick={() => setShowMapGallery(false)}>&times;</button>
              </div>
              <div className="gallery-grid">
                {imageGallery.map((img: string, i: number) => (
                  <div
                    key={i}
                    className={`gallery-item ${img === mapImage ? 'selected' : ''}`}
                    onClick={() => {
                      updateSetting('mapImage', img);
                      setShowMapGallery(false);
                    }}
                  >
                    <img src={img} alt={`Gallery image ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map URL Dialog */}
          {showMapUrlDialog && (
            <div className="url-dialog">
              <div className="url-dialog-content">
                <h4>Enter Map Image URL</h4>
                <input
                  type="url"
                  value={mapUrlInput}
                  onChange={(e) => setMapUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="url-dialog-actions">
                  <button onClick={handleMapUrlSubmit}>Add</button>
                  <button onClick={() => setShowMapUrlDialog(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Map Name Content */}
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
            <label>Map Image Roundness</label>
            <input
              type="range"
              min="0"
              max="100"
              value={mapImageRoundness}
              onChange={(e) => updateSetting('mapImageRoundness', Number(e.target.value))}
            />
            <span>{mapImageRoundness}%</span>
          </div>

          <div className="panel-section">
            <label>Map Scale</label>
            <input
              type="number"
              value={mapScale}
              onChange={(e) => updateSetting('mapScale', Number(e.target.value))}
              step="0.1"
              min="0.1"
              max="100"
            />
          </div>

          {/* Map Image Settings */}
          <div className="panel-section">
            <label>Image Size</label>
            <select 
              value={mapImageSettings.size} 
              onChange={(e) => updateMapImageSettings({ size: e.target.value as any })}
            >
              <option value="contain">Contain (Fit within bounds)</option>
              <option value="cover">Cover (Fill bounds, crop if needed)</option>
              <option value="auto">Auto (Use image dimensions)</option>
              <option value="custom">Custom (Manual dimensions)</option>
            </select>
          </div>

          {mapImageSettings.size === 'custom' && (
            <div className="panel-section">
              <label>Custom Dimensions</label>
              <div className="dimension-inputs">
                <div>
                  <label>Width:</label>
                  <input
                    type="number"
                    value={mapImageSettings.customWidth}
                    onChange={(e) => handleCustomDimensionChange('width', Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div>
                  <label>Height:</label>
                  <input
                    type="number"
                    value={mapImageSettings.customHeight}
                    onChange={(e) => handleCustomDimensionChange('height', Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="lock-aspect">
                  <label>
                    <input
                      type="checkbox"
                      checked={mapImageSettings.lockAspectRatio}
                      onChange={(e) => updateMapImageSettings({ lockAspectRatio: e.target.checked })}
                    />
                    <span>Lock aspect ratio</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="panel-section">
            <label>Image Position</label>
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
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mapImageSettings.showBorder}
                onChange={(e) => updateMapImageSettings({ showBorder: e.target.checked })}
              />
              <span>Show border</span>
            </label>
            
            {mapImageSettings.showBorder && (
              <div>
                <label>Border Color</label>
                <input
                  type="color"
                  value={mapImageSettings.borderColor}
                  onChange={(e) => updateMapImageSettings({ borderColor: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Background Section */}
        <div className="panel-section">
          <h3>Background</h3>
          
          {/* Background Type Toggle */}
          <div className="background-type">
            <label className="radio-label">
              <input
                type="radio"
                name="backgroundType"
                checked={backgroundImage !== ''}
                onChange={() => updateSetting('backgroundImage', '/media/parchment.jpeg')}
              />
              <span>Image</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="backgroundType"
                checked={backgroundImage === ''}
                onChange={() => updateSetting('backgroundImage', '')}
              />
              <span>Color</span>
            </label>
          </div>

          {/* Background Image */}
          {backgroundImage !== '' && (
            <div className="current-image">
              <img src={backgroundImage} alt="Current background" />
              <div className="image-actions">
                <button onClick={() => setShowBgGallery(true)}>
                  <FaRegImages /> Gallery
                </button>
                <button onClick={() => setShowBgUrlDialog(true)}>
                  <FaLink /> URL
                </button>
              </div>
            </div>
          )}



          {/* Background Gallery */}
          {showBgGallery && (
            <div className="image-gallery">
              <div className="gallery-header">
                <h4>Select Background Image</h4>
                <button onClick={() => setShowBgGallery(false)}>&times;</button>
              </div>
              <div className="gallery-grid">
                {imageGallery.map((img: string, i: number) => (
                  <div
                    key={i}
                    className={`gallery-item ${img === backgroundImage ? 'selected' : ''}`}
                    onClick={() => {
                      updateSetting('backgroundImage', img);
                      setShowBgGallery(false);
                    }}
                  >
                    <img src={img} alt={`Gallery image ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Background URL Dialog */}
          {showBgUrlDialog && (
            <div className="url-dialog">
              <div className="url-dialog-content">
                <h4>Enter Background Image URL</h4>
                <input
                  type="url"
                  value={bgUrlInput}
                  onChange={(e) => setBgUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="url-dialog-actions">
                  <button onClick={handleBgUrlSubmit}>Add</button>
                  <button onClick={() => setShowBgUrlDialog(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Background Color */}
          <div className="panel-section">
            <label>Background Color</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => updateSetting('backgroundColor', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 