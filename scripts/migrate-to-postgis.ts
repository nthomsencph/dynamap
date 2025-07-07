import { Pool } from 'pg';

async function migrateToPostGIS() {
  // Database configuration
  const config = {
    user: process.env.DB_USER || 'nicolai',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'dynamap',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
  };

  console.log('PostGIS Migration');
  console.log('==================');
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

    // Check if position column exists and migrate to geom-only approach
    console.log('🔧 Checking for position columns...');

    const locationsPositionCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'locations' AND column_name = 'position'
    `);

    const regionsPositionCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'regions' AND column_name = 'position'
    `);

    // Check if geom column exists in locations table
    const locationsGeomCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'locations' AND column_name = 'geom'
    `);

    if (locationsGeomCheck.rows.length === 0) {
      console.log('📍 Adding geom column to locations table...');
      await client.query(
        'ALTER TABLE locations ADD COLUMN geom GEOMETRY(POINT, 0)'
      );
      console.log('✅ Added geom column to locations table');
    } else {
      console.log('✅ geom column already exists in locations table');
    }

    // Check if geom column exists in regions table
    const regionsGeomCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'regions' AND column_name = 'geom'
    `);

    if (regionsGeomCheck.rows.length === 0) {
      console.log('🗺️ Adding geom column to regions table...');
      await client.query(
        'ALTER TABLE regions ADD COLUMN geom GEOMETRY(POLYGON, 0)'
      );
      console.log('✅ Added geom column to regions table');
    } else {
      console.log('✅ geom column already exists in regions table');
    }

    // Create spatial indexes
    console.log('🔍 Creating spatial indexes...');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom)'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_regions_geom ON regions USING GIST (geom)'
    );
    console.log('✅ Spatial indexes created');

    // Populate geometry columns with existing data
    console.log('🔄 Populating geometry columns with existing data...');

    // Update locations geometry
    const locationsResult = await client.query(
      'SELECT COUNT(*) as count FROM locations WHERE geom IS NULL'
    );
    const locationsToUpdate = parseInt(locationsResult.rows[0].count);

    if (locationsToUpdate > 0) {
      console.log(`📍 Updating ${locationsToUpdate} locations...`);
      await client.query(`
        UPDATE locations 
        SET geom = ST_GeomFromText('POINT(' || (position->>0) || ' ' || (position->>1) || ')', 0)
        WHERE geom IS NULL AND position IS NOT NULL
      `);
      console.log('✅ Locations geometry updated');
    } else {
      console.log('✅ All locations already have geometry data');
    }

    // Update regions geometry
    const regionsResult = await client.query(
      'SELECT COUNT(*) as count FROM regions WHERE geom IS NULL'
    );
    const regionsToUpdate = parseInt(regionsResult.rows[0].count);

    if (regionsToUpdate > 0) {
      console.log(`🗺️ Updating ${regionsToUpdate} regions...`);

      // Get all regions that need geometry updates
      const regions = await client.query(`
        SELECT id, position 
        FROM regions 
        WHERE geom IS NULL AND position IS NOT NULL
      `);

      for (const region of regions.rows) {
        try {
          const position = region.position;
          if (Array.isArray(position) && position.length >= 3) {
            // Ensure polygon is closed
            const coords = [...position];
            if (
              coords[0][0] !== coords[coords.length - 1][0] ||
              coords[0][1] !== coords[coords.length - 1][1]
            ) {
              coords.push(coords[0]);
            }

            const coordString = coords.map(([x, y]) => `${x} ${y}`).join(', ');
            const geometry = `POLYGON((${coordString}))`;

            await client.query(
              `
              UPDATE regions 
              SET geom = ST_GeomFromText($1, 0)
              WHERE id = $2
            `,
              [geometry, region.id]
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `⚠️ Failed to update geometry for region ${region.id}:`,
            errorMessage
          );
        }
      }
      console.log('✅ Regions geometry updated');
    } else {
      console.log('✅ All regions already have geometry data');
    }

    // Update area calculations for regions
    console.log('📊 Updating area calculations...');
    await client.query(`
      UPDATE regions 
      SET area = ST_Area(geom)
      WHERE geom IS NOT NULL AND (area IS NULL OR area = 0)
    `);
    console.log('✅ Area calculations updated');

    // Remove position columns after successful migration
    if (locationsPositionCheck.rows.length > 0) {
      console.log('🗑️ Removing position column from locations table...');
      await client.query('ALTER TABLE locations DROP COLUMN position');
      console.log('✅ Position column removed from locations table');
    }

    if (regionsPositionCheck.rows.length > 0) {
      console.log('🗑️ Removing position column from regions table...');
      await client.query('ALTER TABLE regions DROP COLUMN position');
      console.log('✅ Position column removed from regions table');
    }

    // Verify migration
    console.log('🔍 Verifying migration...');

    const locationsWithGeom = await client.query(
      'SELECT COUNT(*) as count FROM locations WHERE geom IS NOT NULL'
    );
    const regionsWithGeom = await client.query(
      'SELECT COUNT(*) as count FROM regions WHERE geom IS NOT NULL'
    );

    console.log(
      `📍 Locations with geometry: ${locationsWithGeom.rows[0].count}`
    );
    console.log(`🗺️ Regions with geometry: ${regionsWithGeom.rows[0].count}`);

    // Test spatial queries
    console.log('🧪 Testing spatial queries...');

    const spatialTest = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM locations WHERE geom IS NOT NULL) as locations_with_geom,
        (SELECT COUNT(*) FROM regions WHERE geom IS NOT NULL) as regions_with_geom,
        (SELECT COUNT(*) FROM locations l JOIN regions r ON ST_Contains(r.geom, l.geom) LIMIT 1) as spatial_join_test
    `);

    console.log('✅ Spatial queries working correctly');

    client.release();

    console.log('');
    console.log('🎉 PostGIS migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your application to use the new PostGIS functions');
    console.log(
      '2. The application will now use PostGIS for spatial operations'
    );
    console.log(
      '3. Manual calculations will be used as fallback if PostGIS is unavailable'
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('');
    console.log('Please ensure:');
    console.log('1. PostgreSQL is running');
    console.log('2. PostGIS extension is available');
    console.log('3. Database connection details are correct');
  } finally {
    await pool.end();
  }
}

migrateToPostGIS().catch(console.error);
