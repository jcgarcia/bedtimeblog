-- Migration script to fix existing posts status
-- Run this once to set proper status for existing posts

-- Set all posts with published_at date to 'published' status
UPDATE posts 
SET status = 'published' 
WHERE published_at IS NOT NULL 
  AND (status IS NULL OR status = '');

-- Set all posts without published_at to 'draft' status  
UPDATE posts 
SET status = 'draft' 
WHERE published_at IS NULL 
  AND (status IS NULL OR status = '');

-- Set published_at for posts that don't have it but should be published
-- (posts created via old schema that should be considered published)
UPDATE posts 
SET published_at = created_at,
    status = 'published'
WHERE published_at IS NULL 
  AND created_at IS NOT NULL
  AND (title IS NOT NULL AND title != '')
  AND (content IS NOT NULL AND content != '');

-- Display results
SELECT 
  status,
  COUNT(*) as post_count,
  MIN(created_at) as oldest_post,
  MAX(created_at) as newest_post
FROM posts 
GROUP BY status
ORDER BY status;

-- Show sample posts to verify
SELECT 
  id, 
  title, 
  status, 
  created_at, 
  published_at,
  CASE 
    WHEN status = 'published' THEN '✅ Published'
    WHEN status = 'draft' THEN '📝 Draft'
    ELSE '❓ Unknown'
  END as status_display
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;
