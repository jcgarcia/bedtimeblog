import pkg from 'pg';
const { Pool } = pkg;

// Singleton pool instance
let pool;
export function getDbPool() {
  if (!pool) {
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