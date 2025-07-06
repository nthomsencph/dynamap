import type { PoolClient } from 'pg';
import { SettingsSchema, DEFAULT_SETTINGS, SETTINGS_KEY } from '@/app/api/trpc/settings/types';

export async function getSettings(client: PoolClient) {
  const result = await client.query(
    'SELECT value FROM settings WHERE key = $1',
    [SETTINGS_KEY]
  );
  if (result.rows.length > 0) {
    return JSON.parse(result.rows[0].value);
  }
  return DEFAULT_SETTINGS;
}

export async function updateSettings(client: PoolClient, input: any) {
  // Use UPSERT to update or insert settings
  await client.query(
    `INSERT INTO settings (key, value, updated_at) 
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) 
     DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [SETTINGS_KEY, JSON.stringify(input)]
  );
  return input;
} 