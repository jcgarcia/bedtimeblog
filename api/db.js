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
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}