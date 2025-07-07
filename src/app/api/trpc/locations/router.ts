import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getDatabase } from '@/database';
import { LocationDbSchema } from './types';
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationParents,
} from '@/database/locations';

export const locationsRouter = router({
  getAll: publicProcedure
    .input(z.object({ year: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await getAllLocations(client, input?.year);
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
        return await getLocationById(client, input.id, input.year);
      } finally {
        client.release();
      }
    }),

  create: publicProcedure
    .input(LocationDbSchema)
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await createLocation(client, input);
      } finally {
        client.release();
      }
    }),

  update: publicProcedure
    .input(LocationDbSchema)
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const client = await db.connect();
      try {
        return await updateLocation(client, input);
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
        return await deleteLocation(client, input.id);
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
        return await getLocationParents(client, input.id, input.year);
      } finally {
        client.release();
      }
    }),
});
