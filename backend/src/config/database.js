const { Pool } = require('pg');

const dbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
  };

const pool = new Pool({
  ...dbConfig,
  // Disable SSL for Docker-to-Docker communication (internal network)
  // Enable it if connecting to a remote RDS instance in production
  ssl: process.env.NODE_ENV === 'production' && process.env.DB_HOST !== 'db'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

// Test connection ---- 
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

module.exports = pool;