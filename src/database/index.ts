import { Pool, PoolClient } from 'pg';
import type { Location } from '@/types/locations';
import type { Region } from '@/types/regions';

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? '5432'),
});

// Initialize database
export async function initDatabase(): Promise<Pool> {
  const client = await pool.connect();
  
  try {
    // Create tables with temporal support
    await createTables(client);
  } finally {
    client.release();
  }
  
  return pool;
}

async function createTables(client: PoolClient) {
  // Enable required extensions
  await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  
  // Create locations table with temporal versioning
  await client.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT NOT NULL,
      valid_from INTEGER NOT NULL,  -- Year this version becomes active
      valid_to INTEGER,             -- Year this version ends (NULL = current)
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      image TEXT,
      color TEXT,
      icon TEXT,
      icon_size INTEGER DEFAULT 24,
      show_label BOOLEAN DEFAULT true,
      label TEXT,
      label_position JSONB, -- JSON object
      prominence JSONB, -- JSON object
      fields JSONB, -- JSON object
      position JSONB NOT NULL, -- JSON array of [lat, lng]
      creation_year INTEGER NOT NULL,
      destruction_year INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, valid_from)
    )
  `);

  // Create regions table with temporal versioning
  await client.query(`
    CREATE TABLE IF NOT EXISTS regions (
      id TEXT NOT NULL,
      valid_from INTEGER NOT NULL,  -- Year this version becomes active
      valid_to INTEGER,             -- Year this version ends (NULL = current)
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      image TEXT,
      color TEXT,
      icon TEXT,
      icon_size INTEGER DEFAULT 24,
      show_label BOOLEAN DEFAULT true,
      label TEXT,
      label_position JSONB, -- JSON object
      prominence JSONB, -- JSON object
      fields JSONB, -- JSON object
      position JSONB NOT NULL, -- JSON array of [[lat, lng], ...]
      show_border BOOLEAN DEFAULT true,
      show_highlight BOOLEAN DEFAULT true,
      area_fade_duration INTEGER DEFAULT 800,
      area REAL,
      creation_year INTEGER NOT NULL,
      destruction_year INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, valid_from)
    )
  `);

  // Create epochs table
  await client.query(`
    CREATE TABLE IF NOT EXISTS epochs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_year INTEGER NOT NULL,
      end_year INTEGER,
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      year_prefix TEXT,
      year_suffix TEXT,
      restart_at_zero BOOLEAN DEFAULT false,
      show_end_date BOOLEAN DEFAULT true,
      reverse_years BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create timeline entries table
  await client.query(`
    CREATE TABLE IF NOT EXISTS timeline_entries (
      year INTEGER PRIMARY KEY,
      age TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create notes table
  await client.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      year INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create timeline changes table
  await client.query(`
    CREATE TABLE IF NOT EXISTS timeline_changes (
      id SERIAL PRIMARY KEY,
      year INTEGER NOT NULL,
      element_id TEXT NOT NULL,
      element_type TEXT NOT NULL CHECK (element_type IN ('location', 'region')),
      change_type TEXT NOT NULL CHECK (change_type IN ('updated', 'deleted')),
      changes JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(year, element_id, element_type)
    )
  `);

  // Create settings table
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_locations_current ON locations(id, valid_from, valid_to);
    CREATE INDEX IF NOT EXISTS idx_locations_year ON locations(valid_from, valid_to);
    CREATE INDEX IF NOT EXISTS idx_regions_current ON regions(id, valid_from, valid_to);
    CREATE INDEX IF NOT EXISTS idx_regions_year ON regions(valid_from, valid_to);
    CREATE INDEX IF NOT EXISTS idx_timeline_entries_year ON timeline_entries(year);
    CREATE INDEX IF NOT EXISTS idx_notes_year ON notes(year);
    CREATE INDEX IF NOT EXISTS idx_timeline_changes_year ON timeline_changes(year);
    CREATE INDEX IF NOT EXISTS idx_timeline_changes_element ON timeline_changes(element_id, element_type);
  `);
}

// Database instance (singleton)
let dbInstance: Pool | null = null;

export async function getDatabase(): Promise<Pool> {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  }
  return dbInstance;
}

// Helper functions for data conversion
export function locationFromRow(row: any): Location {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description || '',
    image: row.image || '',
    color: row.color || '#ffffff',
    icon: row.icon || 'MdCastle',
    iconSize: row.icon_size || 24,
    showLabel: Boolean(row.show_label),
    label: row.label || row.name,
    labelPosition: row.label_position || { direction: 'Center', offset: 10 },
    prominence: row.prominence || { lower: 0, upper: 10 },
    fields: row.fields || {},
    elementType: 'location',
    position: row.position,
    creationYear: row.creation_year
  };
}

export function regionFromRow(row: any): Region {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description || '',
    image: row.image || '',
    color: row.color || '#ffffff',
    icon: row.icon || 'MdCastle',
    showLabel: Boolean(row.show_label),
    label: row.label || row.name,
    labelPosition: row.label_position || { direction: 'Center', offset: 10 },
    prominence: row.prominence || { lower: 0, upper: 10 },
    fields: row.fields || {},
    elementType: 'region',
    showBorder: Boolean(row.show_border),
    showHighlight: Boolean(row.show_highlight),
    areaFadeDuration: row.area_fade_duration || 800,
    position: row.position,
    area: row.area,
    creationYear: row.creation_year
  };
}

// Helper function to get element state at a specific year
export async function getElementAtYear<T extends Location | Region>(
  client: PoolClient,
  table: 'locations' | 'regions',
  id: string,
  year: number,
  converter: (row: any) => T
): Promise<T | null> {
  const query = `
    SELECT * FROM ${table} 
    WHERE id = $1 AND valid_from <= $2 AND (valid_to IS NULL OR valid_to > $2)
    ORDER BY valid_from DESC 
    LIMIT 1
  `;
  
  const result = await client.query(query, [id, year]);
  return result.rows.length > 0 ? converter(result.rows[0]) : null;
}

// Helper function to get all elements active at a specific year
export async function getElementsAtYear<T extends Location | Region>(
  client: PoolClient,
  table: 'locations' | 'regions',
  year: number,
  converter: (row: any) => T
): Promise<T[]> {
  const query = `
    SELECT * FROM ${table}
    WHERE valid_from <= $1 AND (valid_to IS NULL OR valid_to > $1)
    ORDER BY name
  `;
  
  const result = await client.query(query, [year]);
  return result.rows.map(converter);
} 