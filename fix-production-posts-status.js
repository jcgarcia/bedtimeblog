#!/usr/bin/env node

// Fix Production Posts Status
// This script connects to the production database and sets the status field for existing posts

import { getDbPool, closeDbPool } from './api/db.js';

async function fixPostsStatus() {
  console.log('🔧 Starting production database posts status fix...');
  
  try {
    const pool = getDbPool();
    
    // First, let's see what we're working with
    console.log('📊 Checking current posts status...');
    const checkQuery = `
      SELECT id, title, status, published_at, created_at 
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    const checkResult = await pool.query(checkQuery);
    
    console.log('Current posts status:');
    checkResult.rows.forEach(post => {
      console.log(`  ID ${post.id}: "${post.title}" - Status: ${post.status || 'NULL'}`);
    });
    
    // Count posts with draft status (should be published since they were created by publishing tool)
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE status = 'draft'
    `;
    const countResult = await pool.query(countQuery);
    const postsToFix = parseInt(countResult.rows[0].count);
    
    console.log(`\n📈 Found ${postsToFix} posts with 'draft' status that should be 'published'`);
    
    if (postsToFix === 0) {
      console.log('✅ All posts already have proper status values!');
      return;
    }
    
    // Update all draft posts to 'published'
    // (Since they were published using the publishing tool)
    console.log('🔄 Updating draft posts status to "published"...');
    const updateQuery = `
      UPDATE posts 
      SET status = 'published' 
      WHERE status = 'draft'
    `;
    
    const updateResult = await pool.query(updateQuery);
    
    console.log(`✅ Updated ${updateResult.rowCount} posts to "published" status`);
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifyQuery = `
      SELECT status, COUNT(*) as count 
      FROM posts 
      GROUP BY status 
      ORDER BY status
    `;
    const verifyResult = await pool.query(verifyQuery);
    
    console.log('Posts by status after fix:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} posts`);
    });
    
    console.log('\n🎉 Production posts status fix completed successfully!');
    console.log('The Post Management system should now work correctly.');
    
  } catch (error) {
    console.error('❌ Error fixing posts status:', error);
    process.exit(1);
  } finally {
    await closeDbPool();
  }
}

// Run the fix
fixPostsStatus()
  .then(() => {
    console.log('\n✨ Script completed. You can now refresh the Operations Panel to see the changes.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
