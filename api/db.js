import pkg from 'pg';
const { Pool } = pkg;

// ---
// Jenkins Credentials Mapping (required):
// db-host      → PGHOST
// db-port      → PGPORT
// db-user      → PGUSER
// db-key       → PGPASSWORD
// db-name      → PGDATABASE
// ---

const REQUIRED_ENV_VARS = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];

function checkEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required DB environment variables: ${missing.join(', ')}.\n\nMake sure Jenkins credentials are mapped as follows:\n  db-host → PGHOST\n  db-port → PGPORT\n  db-user → PGUSER\n  db-key → PGPASSWORD\n  db-name → PGDATABASE`);
  }
}

// Singleton pool instance
let pool;
export function getDbPool() {
  if (!pool) {
    checkEnvVars();
    pool = new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
      // Connection pool configuration
      max: 20, // Maximum number of connections in the pool
      min: 2,  // Minimum number of connections to keep alive
      idle: 10000, // Close connections after 10 seconds of inactivity
      acquire: 60000, // Maximum time to try getting connection
      connectionTimeoutMillis: 10000, // Connection timeout
      idleTimeoutMillis: 30000, // How long to keep idle connections
      // Graceful shutdown
      allowExitOnIdle: true
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    // Log pool statistics periodically (optional, for debugging)
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        console.log(`DB Pool Stats: Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
      }, 30000);
    }
  }
  return pool;
}

// Graceful shutdown function
export async function closeDbPool() {
  if (pool) {
    console.log('Closing database pool...');
    await pool.end();
    pool = null;
    console.log('Database pool closed.');
  }
}