#!/usr/bin/env node

import argon2 from 'argon2';
import pg from 'pg';

const { Client } = pg;

// Build connection string from environment variables
const config = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
};

console.log('🔧 Connecting to database...');
console.log(`Host: ${config.host}:${config.port}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);

const client = new Client(config);

async function resetPassword() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Hash the new password with Argon2
    const newPassword = '025C0j0nesDeMic0.@';
    console.log('🔐 Hashing password with Argon2...');
    const hashedPassword = await argon2.hash(newPassword);

    // Update the user
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE username = $2
      RETURNING id, username, email, role
    `;

    const result = await client.query(updateQuery, [hashedPassword, 'jcsa025']);

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('✅ Password updated successfully!');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   New Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword().catch(console.error);
