import { z } from 'zod';
import { router, publicProcedure } from './trpc';
import { getDatabase } from '@/database';
import {
  getTimeline,
  getAllEpochs,
  createEpoch,
  updateEpoch,
  deleteEpoch,
  getAllEntries,
  upsertEntry,
  deleteEntry,
  getNotesForYear,
  createNote,
  updateNote,
  deleteNote,
  recordChange,
  deleteChange,
  purgeTimeline,
} from '@/database/timeline';
import type { TimelineEntry, TimelineChange } from '@/types/timeline';

// Timeline router
export const timelineRouter = router({
  // Get full timeline data
  getAll: publicProcedure.query(async () => {
    const pool = await getDatabase();
    const client = await pool.connect();
    try {
      return await getTimeline(client);
    } finally {
      client.release();
    }
  }),

  // Epoch operations
  getEpochs: publicProcedure.query(async () => {
    const pool = await getDatabase();
    const client = await pool.connect();
    try {
      return await getAllEpochs(client);
    } finally {
      client.release();
    }
  }),

  createEpoch: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        startYear: z.number(),
        endYear: z.number(),
        color: z.string().optional(),
        yearPrefix: z.string().optional(),
        yearSuffix: z.string().optional(),
        restartAtZero: z.boolean().optional(),
        showEndDate: z.boolean().optional(),
        reverseYears: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        return await createEpoch(client, input);
      } finally {
        client.release();
      }
    }),

  updateEpoch: publicProcedure
    .input(
      z.object({
        id: z.string(),
        updates: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          startYear: z.number().optional(),
          endYear: z.number().optional(),
          color: z.string().optional(),
          yearPrefix: z.string().optional(),
          yearSuffix: z.string().optional(),
          restartAtZero: z.boolean().optional(),
          showEndDate: z.boolean().optional(),
          reverseYears: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        const result = await updateEpoch(client, input.id, input.updates);
        if (!result) {
          throw new Error('Epoch not found');
        }
        return result;
      } finally {
        client.release();
      }
    }),

  deleteEpoch: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        const success = await deleteEpoch(client, input.id);
        if (!success) {
          throw new Error('Epoch not found');
        }
        return { success: true };
      } finally {
        client.release();
      }
    }),

  // Entry operations
  getEntries: publicProcedure.query(async () => {
    const pool = await getDatabase();
    const client = await pool.connect();
    try {
      return await getAllEntries(client);
    } finally {
      client.release();
    }
  }),

  upsertEntry: publicProcedure
    .input(
      z.object({
        year: z.number(),
        age: z.string().nullable().optional(),
        notes: z
          .array(
            z.object({
              title: z.string(),
              description: z.string(),
            })
          )
          .optional(),
        changes: z
          .object({
            modified: z.object({
              locations: z.record(z.any()),
              regions: z.record(z.any()),
            }),
            deleted: z.object({
              locations: z.array(z.string()),
              regions: z.array(z.string()),
            }),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        return await upsertEntry(client, input as TimelineEntry);
      } finally {
        client.release();
      }
    }),

  deleteEntry: publicProcedure
    .input(z.object({ year: z.number() }))
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        const success = await deleteEntry(client, input.year);
        if (!success) {
          throw new Error('Timeline entry not found');
        }
        return { success: true };
      } finally {
        client.release();
      }
    }),

  // Note operations
  getNotesForYear: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        return await getNotesForYear(client, input.year);
      } finally {
        client.release();
      }
    }),

  createNote: publicProcedure
    .input(
      z.object({
        year: z.number(),
        title: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        return await createNote(client, input.year, {
          title: input.title,
          description: input.description,
        });
      } finally {
        client.release();
      }
    }),

  updateNote: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        const result = await updateNote(client, input.id, {
          title: input.title,
          description: input.description,
        });
        if (!result) {
          throw new Error('Note not found');
        }
        return result;
      } finally {
        client.release();
      }
    }),

  deleteNote: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        const success = await deleteNote(client, input.id);
        if (!success) {
          throw new Error('Note not found');
        }
        return { success: true };
      } finally {
        client.release();
      }
    }),

  // Change operations
  recordChange: publicProcedure
    .input(
      z.object({
        year: z.number(),
        elementId: z.string(),
        elementType: z.enum(['location', 'region']),
        changeType: z.enum(['updated', 'deleted']),
        changes: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        await recordChange(client, input as TimelineChange);
        return { success: true };
      } finally {
        client.release();
      }
    }),

  deleteChange: publicProcedure
    .input(
      z.object({
        year: z.number(),
        elementId: z.string(),
        elementType: z.enum(['location', 'region']),
      })
    )
    .mutation(async ({ input }) => {
      const pool = await getDatabase();
      const client = await pool.connect();
      try {
        const success = await deleteChange(
          client,
          input.year,
          input.elementId,
          input.elementType
        );
        if (!success) {
          throw new Error('Change not found');
        }
        return { success: true };
      } finally {
        client.release();
      }
    }),

  // Utility operations
  purge: publicProcedure.mutation(async () => {
    const pool = await getDatabase();
    const client = await pool.connect();
    try {
      await purgeTimeline(client);
      return { success: true };
    } finally {
      client.release();
    }
  }),
});
