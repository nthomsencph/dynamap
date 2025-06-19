"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface MapImageSettings {
  size: 'cover' | 'contain' | 'auto' | 'custom';
  position: 'center' | 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  customWidth: number;
  customHeight: number;
  lockAspectRatio: boolean;
  showBorder: boolean;
  borderColor: string;
}

interface MapNameSettings {
  content: string;
  show: boolean;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
}

interface MapSettingsContextType {
  mapImageRoundness: number;
  setMapImageRoundness: (v: number) => void;
  mapScale: number;
  setMapScale: (v: number) => void;
  mapImage: string;
  setMapImage: (v: string) => void;
  mapImageSettings: MapImageSettings;
  setMapImageSettings: (settings: MapImageSettings) => void;
  mapNameSettings: MapNameSettings;
  setMapNameSettings: (settings: MapNameSettings) => void;
  backgroundImage: string;
  setBackgroundImage: (v: string) => void;
  backgroundColor: string;
  setBackgroundColor: (v: string) => void;
  imageGallery: string[];
  addToImageGallery: (url: string) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  startYear: number;
  setStartYear: (v: number) => void;
  showTimeline: boolean;
  setShowTimeline: (v: boolean) => void;
  showTimelineWhenZoomed: boolean;
  setShowTimelineWhenZoomed: (v: boolean) => void;
  showSettingsWhenZoomed: boolean;
  setShowSettingsWhenZoomed: (v: boolean) => void;
}

const MapSettingsContext = createContext<MapSettingsContextType | undefined>(undefined);

export function MapSettingsProvider({ children }: { children: React.ReactNode }) {
  const [mapImageRoundness, setMapImageRoundness] = useState(100);
  const [mapScale, setMapScale] = useState(17.4);
  const [mapImage, setMapImage] = useState('/media/map.jpg');
  const [mapImageSettings, setMapImageSettings] = useState<MapImageSettings>({
    size: 'contain',
    position: 'center',
    customWidth: 4000,
    customHeight: 3000,
    lockAspectRatio: true,
    showBorder: false,
    borderColor: '#000000'
  });
  const [mapNameSettings, setMapNameSettings] = useState<MapNameSettings>({
    content: '',
    show: false,
    position: 'center'
  });
  const [backgroundImage, setBackgroundImage] = useState('/media/parchment.jpeg');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [imageGallery, setImageGallery] = useState<string[]>([
    '/media/map.jpg',
    '/media/parchment.jpeg',
    '/media/404.jpeg',
  ]);
  const [editMode, setEditMode] = useState(true);
  const [startYear, setStartYear] = useState(2024);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showTimelineWhenZoomed, setShowTimelineWhenZoomed] = useState(true);
  const [showSettingsWhenZoomed, setShowSettingsWhenZoomed] = useState(true);

  const addToImageGallery = (url: string) => {
    if (!imageGallery.includes(url)) {
      setImageGallery(prev => [...prev, url]);
    }
  };

  // Load settings from API on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (typeof data.mapImageRoundness === 'number') setMapImageRoundness(data.mapImageRoundness);
        if (typeof data.mapScale === 'number') setMapScale(data.mapScale);
        if (typeof data.mapImage === 'string') setMapImage(data.mapImage);
        if (data.mapImageSettings) setMapImageSettings(data.mapImageSettings);
        if (data.mapNameSettings) setMapNameSettings(data.mapNameSettings);
        if (typeof data.backgroundImage === 'string') setBackgroundImage(data.backgroundImage);
        if (typeof data.backgroundColor === 'string') setBackgroundColor(data.backgroundColor);
        if (Array.isArray(data.imageGallery)) setImageGallery(data.imageGallery);
        if (typeof data.editMode === 'boolean') setEditMode(data.editMode);
        if (typeof data.startYear === 'number') setStartYear(data.startYear);
        if (typeof data.showTimeline === 'boolean') setShowTimeline(data.showTimeline);
        if (typeof data.showTimelineWhenZoomed === 'boolean') setShowTimelineWhenZoomed(data.showTimelineWhenZoomed);
        if (typeof data.showSettingsWhenZoomed === 'boolean') setShowSettingsWhenZoomed(data.showSettingsWhenZoomed);
      })
      .catch(error => {
        console.error('MapSettings: Error loading settings:', error);
        // Continue with default values if API fails
      });
  }, []);

  // Debounced save to API
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mapImageRoundness, 
          mapScale, 
          mapImage, 
          mapImageSettings,
          mapNameSettings,
          backgroundImage, 
          backgroundColor,
          imageGallery,
          editMode,
          startYear,
          showTimeline,
          showTimelineWhenZoomed,
          showSettingsWhenZoomed
        }),
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('MapSettings: Settings saved successfully:', data);
      })
      .catch(error => {
        console.error('MapSettings: Error saving settings:', error);
      });
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [mapImageRoundness, mapScale, mapImage, mapImageSettings, mapNameSettings, backgroundImage, backgroundColor, imageGallery, editMode, startYear, showTimeline, showTimelineWhenZoomed, showSettingsWhenZoomed]);

  return (
    <MapSettingsContext.Provider value={{ 
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
      setEditMode,
      startYear,
      setStartYear,
      showTimeline,
      setShowTimeline,
      showTimelineWhenZoomed,
      setShowTimelineWhenZoomed,
      showSettingsWhenZoomed,
      setShowSettingsWhenZoomed
    }}>
      {children}
    </MapSettingsContext.Provider>
  );
}

export function useMapSettings() {
  const context = useContext(MapSettingsContext);
  if (context === undefined) {
    throw new Error('useMapSettings must be used within a MapSettingsProvider');
  }
  return context;
} 