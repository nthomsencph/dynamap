import { z } from 'zod';
import type {
  ProminenceRange,
  LabelPosition,
  ElementIcon,
  LabelCollisionStrategy,
} from '@/types/elements';

// Create Zod schema from the existing Region type with proper defaults
export const RegionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  label: z.string().optional(),
  showLabel: z.boolean().optional(),
  labelPosition: z
    .any()
    .default({ direction: 'Center', offset: 10 }) as z.ZodType<LabelPosition>,
  description: z.string().optional(),
  image: z.string().optional(),
  color: z.string().default('#ffffff'),
  prominence: z
    .any()
    .default({ lower: 0, upper: 10 }) as z.ZodType<ProminenceRange>,
  icon: z.string().default('MdTerrain') as z.ZodType<ElementIcon>,
  type: z.string(),
  elementType: z.literal('region'),
  geom: z.array(z.tuple([z.number(), z.number()])),
  fields: z.record(z.string()).default({}),
  creationYear: z.number(),
  showBorder: z.boolean().default(true),
  showHighlight: z.boolean().default(true),
  area: z.number().optional(),
  areaFadeDuration: z.number().optional(),
  labelCollisionStrategy: z
    .any()
    .optional() as z.ZodType<LabelCollisionStrategy>,
});

// Schema for database input with JSON serialization
export const RegionDbSchema = RegionSchema.transform(data => ({
  ...data,
  label: data.label || data.name,
  showLabel: data.showLabel !== false,
  labelPosition: JSON.stringify(data.labelPosition),
  prominence: JSON.stringify(data.prominence),
  fields: JSON.stringify(data.fields),
  geom: data.geom, // Keep geom as array for PostGIS processing
}));

// Export types
export type RegionInput = z.infer<typeof RegionSchema>;
export type RegionDbInput = z.infer<typeof RegionDbSchema>;
