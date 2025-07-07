const { Pool } = require('pg');

async function setupDatabase() {
  // Database configuration - update these values as needed
  const config = {
    user: process.env.DB_USER || 'nicolai',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'dynamap',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
  };

  console.log('PostgreSQL Database Setup');
  console.log('========================');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log('');

  // Test connection
  const pool = new Pool(config);

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');

    // Test if database exists
    const result = await client.query('SELECT current_database()');
    console.log(`✅ Connected to database: ${result.rows[0].current_database}`);

    client.release();

    console.log('');
    console.log('Next steps:');
    console.log(
      '1. Create a .env.local file with your database configuration:'
    );
    console.log('   DB_USER=postgres');
    console.log('   DB_HOST=localhost');
    console.log('   DB_NAME=dynamap');
    console.log('   DB_PASSWORD=your_password');
    console.log('   DB_PORT=5432');
    console.log('');
    console.log('2. Run the migration: npm run migrate');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    console.log('');
    console.log('Please ensure PostgreSQL is running and the database exists.');
    console.log('You can create the database with:');
    console.log(`  createdb -U ${config.user} ${config.database}`);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);
