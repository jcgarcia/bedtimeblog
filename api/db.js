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
      // Optimized connection pool configuration
      max: 10, // Reduced from 20 - maximum number of connections in the pool
      min: 1,  // Reduced from 2 - minimum number of connections to keep alive
      idle: 5000, // Reduced from 10000 - Close connections after 5 seconds of inactivity
      acquire: 30000, // Reduced from 60000 - Maximum time to try getting connection
      connectionTimeoutMillis: 5000, // Reduced from 10000 - Connection timeout
      idleTimeoutMillis: 10000, // Reduced from 30000 - How long to keep idle connections
      // Graceful shutdown
      allowExitOnIdle: true,
      // Additional cleanup settings
      statement_timeout: 30000, // 30 second statement timeout
      query_timeout: 25000, // 25 second query timeout
      keepAlive: true,
      keepAliveInitialDelayMillis: 0
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    // Enhanced connection monitoring
    pool.on('connect', (client) => {
      console.log('New database connection established');
    });

    pool.on('remove', (client) => {
      console.log('Database connection removed from pool');
    });

    // Log pool statistics periodically (optional, for debugging)
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        console.log(`DB Pool Stats: Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
      }, 30000);
    }

    // Set up graceful shutdown handlers
    const gracefulShutdown = async () => {
      console.log('Received shutdown signal, closing database pool...');
      await closeDbPool();
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts
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