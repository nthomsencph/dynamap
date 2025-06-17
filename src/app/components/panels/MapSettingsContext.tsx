"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MapImageSettings {
  size: 'cover' | 'contain' | 'auto' | 'custom';
  position: 'center' | 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  customWidth: number;
  customHeight: number;
  lockAspectRatio: boolean;
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
  imageGallery: string[];
  addToImageGallery: (url: string) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
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
    lockAspectRatio: true
  });
  const [mapNameSettings, setMapNameSettings] = useState<MapNameSettings>({
    content: '',
    show: false,
    position: 'center'
  });
  const [backgroundImage, setBackgroundImage] = useState('/media/parchment.jpeg');
  const [imageGallery, setImageGallery] = useState<string[]>([
    '/media/map.jpg',
    '/media/parchment.jpeg',
    '/media/404.jpeg',
  ]);
  const [editMode, setEditMode] = useState(true);

  const addToImageGallery = (url: string) => {
    if (!imageGallery.includes(url)) {
      setImageGallery(prev => [...prev, url]);
    }
  };

  // Load settings from API on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (typeof data.mapImageRoundness === 'number') setMapImageRoundness(data.mapImageRoundness);
        if (typeof data.mapScale === 'number') setMapScale(data.mapScale);
        if (typeof data.mapImage === 'string') setMapImage(data.mapImage);
        if (data.mapImageSettings) setMapImageSettings(data.mapImageSettings);
        if (data.mapNameSettings) setMapNameSettings(data.mapNameSettings);
        if (typeof data.backgroundImage === 'string') setBackgroundImage(data.backgroundImage);
        if (Array.isArray(data.imageGallery)) setImageGallery(data.imageGallery);
        if (typeof data.editMode === 'boolean') setEditMode(data.editMode);
      });
  }, []);

  // Save changes to API
  useEffect(() => {
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
        imageGallery,
        editMode
      }),
    });
  }, [mapImageRoundness, mapScale, mapImage, mapImageSettings, mapNameSettings, backgroundImage, imageGallery, editMode]);

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
      imageGallery,
      addToImageGallery,
      editMode,
      setEditMode
    }}>
      {children}
    </MapSettingsContext.Provider>
  );
}

export function useMapSettings() {
  const ctx = useContext(MapSettingsContext);
  if (!ctx) throw new Error('useMapSettings must be used within MapSettingsProvider');
  return ctx;
} 