import { Pool } from 'pg';

async function setupPostGIS() {
  // Database configuration
  const config = {
    user: process.env.DB_USER || 'nicolai',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'dynamap',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
  };

  console.log('PostGIS Setup');
  console.log('=============');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log('');

  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');

    // Enable PostGIS extension
    console.log('📦 Enabling PostGIS extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('✅ PostGIS extension enabled');

    // Drop existing tables (this will delete all data)
    console.log('🗑️ Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS locations CASCADE');
    await client.query('DROP TABLE IF EXISTS regions CASCADE');
    await client.query('DROP TABLE IF EXISTS timeline_entries CASCADE');
    await client.query('DROP TABLE IF EXISTS timeline_changes CASCADE');
    await client.query('DROP TABLE IF EXISTS epochs CASCADE');
    await client.query('DROP TABLE IF EXISTS notes CASCADE');
    console.log('✅ Tables dropped');

    // Create tables with PostGIS geometry columns
    console.log('🔧 Creating tables with PostGIS geometry...');

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
        geom GEOMETRY(POINT, 0) NOT NULL, -- PostGIS spatial column for custom coordinate system
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
        geom GEOMETRY(POLYGON, 0) NOT NULL, -- PostGIS spatial column for custom coordinate system
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

    // Create timeline_entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS timeline_entries (
        year INTEGER PRIMARY KEY,
        age TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create timeline_changes table
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

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables created with PostGIS geometry');

    // Create spatial indexes
    console.log('🔍 Creating spatial indexes...');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_regions_geom ON regions USING GIST (geom)'
    );
    console.log('✅ Spatial indexes created');

    // Create other indexes
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_locations_id_valid ON locations (id, valid_from, valid_to)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_regions_id_valid ON regions (id, valid_from, valid_to)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_timeline_changes_year ON timeline_changes (year)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_timeline_changes_element ON timeline_changes (element_id, element_type)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_epochs_years ON epochs (start_year, end_year)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_notes_year ON notes (year)'
    );
    console.log('✅ All indexes created');

    // Verify setup
    console.log('🔍 Verifying setup...');

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('locations', 'regions', 'timeline_entries', 'timeline_changes', 'epochs', 'notes')
      ORDER BY table_name
    `);

    console.log(
      '✅ Tables created:',
      tables.rows.map(row => row.table_name).join(', ')
    );

    const extensions = await client.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname = 'postgis'
    `);

    if (extensions.rows.length > 0) {
      console.log('✅ PostGIS extension enabled');
    } else {
      console.log('❌ PostGIS extension not found');
    }

    client.release();

    console.log('');
    console.log('🎉 PostGIS setup completed successfully!');
    console.log('');
    console.log('Your database is now ready with:');
    console.log('- PostGIS spatial extension enabled');
    console.log('- Tables with geometry columns only');
    console.log('- Spatial indexes for performance');
    console.log('- All existing data has been cleared');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('');
    console.log('Please ensure:');
    console.log('1. PostgreSQL is running');
    console.log('2. PostGIS extension is available');
    console.log('3. Database connection details are correct');
  } finally {
    await pool.end();
  }
}

setupPostGIS().catch(console.error);
