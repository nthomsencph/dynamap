import { z } from 'zod';
import type { ProminenceRange, LabelPosition, ElementIcon, LabelCollisionStrategy } from '@/types/elements';

// Create Zod schema from the existing Location type with proper defaults
export const LocationSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  label: z.string().optional(),
  showLabel: z.boolean().optional(),
  labelPosition: z.any().default({ direction: 'Center', offset: 10 }) as z.ZodType<LabelPosition>,
  description: z.string().optional(),
  image: z.string().optional(),
  color: z.string().default('#ffffff'),
  prominence: z.any().default({ lower: 0, upper: 10 }) as z.ZodType<ProminenceRange>,
  icon: z.string().default('MdCastle') as z.ZodType<ElementIcon>,
  type: z.string(),
  elementType: z.literal('location'),
  position: z.tuple([z.number(), z.number()]),
  fields: z.record(z.string()).default({}),
  creationYear: z.number(),
  iconSize: z.number().default(24),
  labelCollisionStrategy: z.any().optional() as z.ZodType<LabelCollisionStrategy>,
});

// Schema for database input with JSON serialization
export const LocationDbSchema = LocationSchema.transform((data) => ({
  ...data,
  label: data.label || data.name,
  showLabel: data.showLabel !== false,
  labelPosition: JSON.stringify(data.labelPosition),
  prominence: JSON.stringify(data.prominence),
  fields: JSON.stringify(data.fields),
  position: JSON.stringify(data.position),
}));

// Export types
export type LocationInput = z.infer<typeof LocationSchema>;
export type LocationDbInput = z.infer<typeof LocationDbSchema>; 