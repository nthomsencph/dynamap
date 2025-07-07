import { router, publicProcedure } from '../trpc';
import { getDatabase } from '@/database';
import { SettingsSchema } from './types';
import { getSettings, updateSettings } from '@/database/settings';

export const settingsRouter = router({
  get: publicProcedure.query(async () => {
    const db = await getDatabase();
    const client = await db.connect();
    try {
      return await getSettings(client);
    } finally {
      client.release();
    }
  }),

  update: publicProcedure.input(SettingsSchema).mutation(async ({ input }) => {
    const db = await getDatabase();
    const client = await db.connect();
    try {
      return await updateSettings(client, input);
    } finally {
      client.release();
    }
  }),
});
