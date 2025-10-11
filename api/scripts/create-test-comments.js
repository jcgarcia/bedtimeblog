#!/usr/bin/env node

// Script to create test comments for development/testing
import { getDbPool } from '../db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = getDbPool();

async function createTestComments() {
  try {
    console.log('Creating test comments...');
    
    // First, let's check what social users we have
    const socialUsersResult = await pool.query('SELECT id, username, display_name FROM social_users LIMIT 5');
    console.log('Available social users:', socialUsersResult.rows);
    
    // If we don't have enough social users, create some from regular users
    if (socialUsersResult.rows.length < 2) {
      console.log('Creating more social users from regular users...');
      
      const regularUsers = await pool.query('SELECT id, username, email, first_name, last_name FROM users WHERE id IN (2, 5) LIMIT 2');
      
      for (const user of regularUsers.rows) {
        const displayName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username;
        
        await pool.query(`
          INSERT INTO social_users (cognito_sub, username, email, display_name, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (username) DO NOTHING
        `, [`fake-cognito-${user.id}`, user.username, user.email, displayName, true]);
        
        console.log(`Created social user for ${user.username}`);
      }
    }
    
    // Get social users for testing
    const socialUserResult = await pool.query('SELECT id FROM social_users ORDER BY id LIMIT 1');
    const socialUserId = socialUserResult.rows[0].id;
    
    // Check what posts exist
    const postsResult = await pool.query('SELECT id, title FROM posts WHERE status = \'published\' LIMIT 5');
    console.log('Available posts:', postsResult.rows);
    
    if (postsResult.rows.length === 0) {
      console.log('No published posts found for commenting.');
      return;
    }
    
    const postId = postsResult.rows[0].id;
    console.log(`Creating test comments for post ${postId}...`);
    
    // Create test comments
    const testComments = [
      {
        content: 'This is a great post! Thanks for sharing this information.',
        parentId: null
      },
      {
        content: 'I really enjoyed reading this. Looking forward to more content like this.',
        parentId: null
      },
      {
        content: 'Very informative and well-written. Keep up the good work!',
        parentId: null
      }
    ];
    
    // Insert test comments
    for (const comment of testComments) {
      const result = await pool.query(`
        INSERT INTO comments (post_id, user_id, parent_id, content, is_approved, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `, [postId, socialUserId, comment.parentId, comment.content, true]);
      
      console.log(`Created comment ${result.rows[0].id}: "${comment.content.substring(0, 50)}..."`);
    }
    
    // Create a reply to the first comment
    const firstCommentResult = await pool.query('SELECT id FROM comments WHERE post_id = $1 ORDER BY created_at LIMIT 1', [postId]);
    if (firstCommentResult.rows.length > 0) {
      const parentCommentId = firstCommentResult.rows[0].id;
      
      await pool.query(`
        INSERT INTO comments (post_id, user_id, parent_id, content, is_approved, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [postId, socialUserId, parentCommentId, 'I totally agree with your comment! Thanks for the insight.', true]);
      
      console.log('Created a reply comment');
    }
    
    // Update comment count for the post
    const countResult = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = $1 AND is_deleted = false', [postId]);
    const commentCount = parseInt(countResult.rows[0].count);
    
    await pool.query('UPDATE posts SET comment_count = $1 WHERE id = $2', [commentCount, postId]);
    
    console.log(`Updated post ${postId} comment count to ${commentCount}`);
    
    // Test the query that the API uses
    console.log('\nTesting API query...');
    const apiTestResult = await pool.query(`
      SELECT 
        c.id, c.post_id, c.parent_id, c.content, c.is_approved,
        c.created_at, c.updated_at, c.user_id,
        su.username, su.display_name
      FROM comments c
      LEFT JOIN social_users su ON c.user_id = su.id
      WHERE c.post_id = $1 AND c.is_deleted = false
      ORDER BY c.created_at ASC
    `, [postId]);
    
    console.log(`API query returned ${apiTestResult.rows.length} comments:`);
    apiTestResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Content: "${row.content.substring(0, 50)}...", User: ${row.display_name} (${row.username})`);
    });
    
    console.log('\nTest comments created successfully!');
    
  } catch (error) {
    console.error('Error creating test comments:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createTestComments();