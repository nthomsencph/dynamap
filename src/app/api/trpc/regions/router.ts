import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getDatabase } from '@/database';
import { RegionDbSchema } from './types';
import {
  getAllRegions,
  getRegionById,
  createRegion,
  updateRegion,
  deleteRegion,
  getRegionChildren,
  getRegionParents
} from '@/database/regions';

export const regionsRouter = router({
  getAll: publicProcedure
    .input(z.object({ year: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await getAllRegions(client, input?.year);
      } finally {
        client.release();
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string(), year: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await getRegionById(client, input.id, input.year);
      } finally {
        client.release();
      }
    }),

  create: publicProcedure
    .input(RegionDbSchema)
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await createRegion(client, input);
      } finally {
        client.release();
      }
    }),

  update: publicProcedure
    .input(RegionDbSchema)
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await updateRegion(client, input);
      } finally {
        client.release();
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await deleteRegion(client, input.id);
      } finally {
        client.release();
      }
    }),

  getChildren: publicProcedure
    .input(z.object({ id: z.string(), year: z.number() }))
    .query(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await getRegionChildren(client, input.id, input.year);
      } finally {
        client.release();
      }
    }),

  getParents: publicProcedure
    .input(z.object({ id: z.string(), year: z.number() }))
    .query(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await getRegionParents(client, input.id, input.year);
      } finally {
        client.release();
      }
    })
}); 