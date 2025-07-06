import { z } from 'zod';

// Settings schemas
export const MapImageSettingsSchema = z.object({
  size: z.enum(['cover', 'contain', 'auto', 'custom']).default('contain'),
  position: z.enum(['center', 'top-left', 'top-center', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right']).default('center'),
  customWidth: z.number().default(4000),
  customHeight: z.number().default(3000),
  lockAspectRatio: z.boolean().default(true),
  showBorder: z.boolean().default(false),
  borderColor: z.string().default('#000000')
});

export const MapNameSettingsSchema = z.object({
  content: z.string().default(''),
  show: z.boolean().default(false),
  position: z.enum(['center', 'top-left', 'top-right', 'bottom-right', 'bottom-left']).default('center')
});

export const SettingsSchema = z.object({
  mapImageRoundness: z.number().default(100),
  mapScale: z.number().default(17.4),
  mapImage: z.string().default('/media/map.jpg'),
  mapImageSettings: MapImageSettingsSchema.default({
    size: 'contain',
    position: 'center',
    customWidth: 4000,
    customHeight: 3000,
    lockAspectRatio: true,
    showBorder: false,
    borderColor: '#000000'
  }),
  mapNameSettings: MapNameSettingsSchema.default({
    content: '',
    show: false,
    position: 'center'
  }),
  backgroundImage: z.string().default('/media/parchment.jpeg'),
  backgroundColor: z.string().default('#000000'),
  imageGallery: z.array(z.string()).default([
    '/media/map.jpg',
    '/media/parchment.jpeg',
    '/media/404.jpeg',
  ]),
  editMode: z.boolean().default(true),
  startYear: z.number().default(2024),
  showTimeline: z.boolean().default(true),
  showTimelineWhenZoomed: z.boolean().default(true),
  showSettingsWhenZoomed: z.boolean().default(true)
});

// Export types
export type Settings = z.infer<typeof SettingsSchema>;
export type MapImageSettings = z.infer<typeof MapImageSettingsSchema>;
export type MapNameSettings = z.infer<typeof MapNameSettingsSchema>;

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  mapImageRoundness: 100,
  mapScale: 17.4,
  mapImage: '/media/map.jpg',
  mapImageSettings: {
    size: 'contain',
    position: 'center',
    customWidth: 4000,
    customHeight: 3000,
    lockAspectRatio: true,
    showBorder: false,
    borderColor: '#000000'
  },
  mapNameSettings: {
    content: '',
    show: false,
    position: 'center'
  },
  backgroundImage: '/media/parchment.jpeg',
  backgroundColor: '#000000',
  imageGallery: [
    '/media/map.jpg',
    '/media/parchment.jpeg',
    '/media/404.jpeg',
  ],
  editMode: true,
  startYear: 2024,
  showTimeline: true,
  showTimelineWhenZoomed: true,
  showSettingsWhenZoomed: true
};

export const SETTINGS_KEY = 'main'; 