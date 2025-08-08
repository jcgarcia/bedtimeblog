# Database Schema Documentation

## Overview
This project uses **PostgreSQL** as the primary database. The schema was migrated from MySQL, and this document ensures consistent usage of the current PostgreSQL schema.

## ⚠️ IMPORTANT: Single Schema Usage
**Only use the PostgreSQL schema column names below.** Do not use legacy MySQL column names.

## Posts Table Schema

### Current PostgreSQL Schema (✅ USE THIS)
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    content_html TEXT,
    featured_image VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description TEXT,
    author_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    password VARCHAR(255),
    published_at TIMESTAMP,
    scheduled_at TIMESTAMP,
    reading_time INTEGER,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,
    seo_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Status Field Values
- `'draft'` - Post is not published (default)
- `'published'` - Post is live and visible
- `'scheduled'` - Post is scheduled for future publication
- `'archived'` - Post is archived/hidden

### Visibility Field Values
- `'public'` - Visible to all users (default)
- `'private'` - Visible only to author
- `'protected'` - Password protected

## ❌ Legacy MySQL Schema (DO NOT USE)
These column names were used in the old MySQL schema and should NOT be used:
- `postcont` → Use `content`
- `postdate` → Use `published_at` or `created_at`
- `userid` → Use `author_id`
- `uid` → Use `author_id`
- `cat` → Use `category_id`
- `desc` → Use `content` or `excerpt`
- `img` → Use `featured_image`

## API Controllers Status

### ✅ Controllers Using Correct Schema
- **publish.js** - Publishing tool (markdown upload) ✅
- **post.js** - getPosts() and getPost() functions ✅

### ❌ Controllers Using Legacy Schema (NEEDS FIX)
- **post.js** - addPost(), deletePost(), updatePost() functions ❌

## Database Queries

### Correct Query Examples
```sql
-- Insert new post
INSERT INTO posts (title, slug, content, author_id, published_at, status) 
VALUES ($1, $2, $3, $4, $5, 'published');

-- Get posts with author and category
SELECT p.*, u.username, u.first_name, u.last_name, c.name as category_name 
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status = 'published'
ORDER BY p.published_at DESC;

-- Update post
UPDATE posts SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP 
WHERE id = $3 AND author_id = $4;

-- Delete post
DELETE FROM posts WHERE id = $1 AND author_id = $2;
```

### Frontend Status Handling
```javascript
// Correct status detection for existing posts
const isDraft = !post.status || post.status === 'draft' || post.status === '';
const isPublished = post.status === 'published';

// Default status display
const displayStatus = post.status || 'Draft';
```

## Migration Notes
- All existing posts should have their status set to 'published' if they were created via the publishing tool
- Posts without a status field should be considered drafts
- The publishing tool correctly sets `published_at` timestamp and `status = 'published'`

## File References
- Schema Definition: `/database/blog_schema_postgresql.sql`
- Publishing Tool: `/api/controllers/publish.js` ✅
- Legacy Controller: `/api/controllers/post.js` (needs update)
- Frontend: `/client/src/pages/ops/Ops.jsx`

## Next Steps
1. Fix legacy post controller to use PostgreSQL schema
2. Ensure all API endpoints use consistent column names
3. Update any remaining MySQL references
4. Test post creation/editing via web interface
