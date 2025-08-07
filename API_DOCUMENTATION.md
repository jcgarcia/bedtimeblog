# Bedtime Blog API Documentation

**Base URL**: `https://bapi.ingasti.com`

## Table of Contents
- [Health & Status Endpoints](#health--status-endpoints)
- [Posts API](#posts-api)
- [Settings API](#settings-api)
- [Authentication API](#authentication-api)
- [Publishing API](#publishing-api)
- [Users API](#users-api)
- [Admin API](#admin-api)
- [File Upload API](#file-upload-api)
- [Testing Guide](#testing-guide)

---

## Health & Status Endpoints

### 1. Basic Health Check
**Endpoint**: `GET /health`

**Description**: Returns the API health status, uptime, and timestamp.

**Example**:
```bash
curl -s https://bapi.ingasti.com/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T17:44:58.184Z",
  "uptime": 1970.861380171
}
```

### 2. Database Health Check
**Endpoint**: `GET /health/db`

**Description**: Returns detailed database connection status and performance metrics.

**Example**:
```bash
curl -s https://bapi.ingasti.com/health/db
```

**Response**:
```json
{
  "status": "healthy",
  "responseTime": "2ms",
  "serverTime": "2025-08-06T17:49:12.219Z",
  "postgresVersion": "PostgreSQL 16.9 on x86_64-pc-linux-gnu...",
  "poolStats": {
    "totalCount": 1,
    "idleCount": 1,
    "waitingCount": 0
  },
  "databaseConnections": {
    "total_connections": "5",
    "active_connections": "1",
    "idle_connections": "4",
    "idle_in_transaction": "0"
  },
  "timestamp": "2025-08-06T17:49:12.226Z"
}
```

### 3. Database Connection Info
**Endpoint**: `GET /health/db/connections`

**Description**: Returns detailed database connection pool information for debugging.

---

## Posts API

### 1. Get All Posts
**Endpoint**: `GET /api/posts`

**Description**: Retrieves all blog posts with full metadata including author and category information.

**Example**:
```bash
curl -s https://bapi.ingasti.com/api/posts
```

**Response Structure**:
```json
[
  {
    "id": 8,
    "title": "Direct API Test Success",
    "slug": "direct-api-test-success",
    "excerpt": null,
    "content": "# Direct API Publishing Test...",
    "content_html": null,
    "featured_image": null,
    "meta_title": null,
    "meta_description": null,
    "author_id": 2,
    "category_id": 1,
    "status": "draft",
    "visibility": "public",
    "password": null,
    "published_at": "2025-08-04T08:26:00.000Z",
    "scheduled_at": null,
    "reading_time": null,
    "view_count": 0,
    "like_count": 0,
    "comment_count": 0,
    "is_featured": false,
    "allow_comments": true,
    "seo_score": null,
    "created_at": "2025-08-04T08:24:27.200Z",
    "updated_at": "2025-08-06T16:01:42.655Z",
    "username": "jcgarcia",
    "first_name": "jcgarcia",
    "last_name": "",
    "email": "jcgarcia@example.com",
    "category_name": "Technology",
    "category_slug": "technology"
  }
]
```

### 2. Get Single Post
**Endpoint**: `GET /api/posts/:id`

**Description**: Retrieves a specific post by its ID.

**Example**:
```bash
curl -s https://bapi.ingasti.com/api/posts/8
```

**Response**: Same structure as individual post from the posts array above.

### 3. Create New Post
**Endpoint**: `POST /api/posts`

**Description**: Creates a new blog post.

**Headers**: `Content-Type: application/json`

### 4. Update Post
**Endpoint**: `PUT /api/posts/:id`

**Description**: Updates an existing post.

### 5. Delete Post
**Endpoint**: `DELETE /api/posts/:id`

**Description**: Deletes a post by its ID.

---

## Settings API

### 1. Get Social Media Links
**Endpoint**: `GET /api/settings/social`

**Description**: Retrieves all configured social media links.

**Example**:
```bash
curl -s https://bapi.ingasti.com/api/settings/social
```

**Response**:
```json
{
  "facebook": "https://facebook.com/bedtimeblog",
  "twitter": "https://twitter.com/bedtimeblog",
  "instagram": "",
  "threads": ""
}
```

### 2. Update Social Media Links
**Endpoint**: `PUT /api/settings/social`

**Description**: Updates social media link configurations.

**Headers**: `Content-Type: application/json`

**Example**:
```bash
curl -X PUT https://bapi.ingasti.com/api/settings/social \
  -H "Content-Type: application/json" \
  -d '{
    "facebook": "https://facebook.com/myblog",
    "twitter": "https://twitter.com/myblog",
    "instagram": "https://instagram.com/myblog",
    "threads": "https://threads.net/@myblog"
  }'
```

**Response**:
```json
{
  "message": "Social media links updated successfully",
  "links": {
    "facebook": "https://facebook.com/myblog",
    "twitter": "https://twitter.com/myblog"
  }
}
```

---

## Publishing API

**Base Route**: `/api/publish`

**Description**: Handles content publishing operations, used by the CLI publishing tool.

---

## Users API

**Base Route**: `/api/users`

**Description**: Manages user profiles and user-related operations.

---

## Admin API

**Base Route**: `/api/admin`

**Description**: Administrative functions and privileged operations.

---

## File Upload API

### Upload File
**Endpoint**: `POST /api/upload`

**Description**: Handles file uploads (images, documents, etc.).

**Content-Type**: `multipart/form-data`

**Form Field**: `file`

---

## Authentication API

**Base Route**: `/api/auth`

### Available Endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

---

## Testing Guide

### Quick Health Check
```bash
# Basic API status
curl -s https://bapi.ingasti.com/health

# Database connectivity
curl -s https://bapi.ingasti.com/health/db
```

### Posts Testing
```bash
# Get all posts
curl -s https://bapi.ingasti.com/api/posts | jq '.[0:2]'

# Get specific post
curl -s https://bapi.ingasti.com/api/posts/8 | jq '.title, .category_name'

# Get post count
curl -s https://bapi.ingasti.com/api/posts | jq 'length'
```

### Social Media Settings Testing
```bash
# Get current social links
curl -s https://bapi.ingasti.com/api/settings/social

# Update social links (requires authentication)
curl -X PUT https://bapi.ingasti.com/api/settings/social \
  -H "Content-Type: application/json" \
  -d '{"facebook":"https://facebook.com/test","twitter":"https://twitter.com/test"}'
```

### Performance Testing
```bash
# Check response time
time curl -s https://bapi.ingasti.com/health

# Database performance
curl -s https://bapi.ingasti.com/health/db | jq '.responseTime'

# Connection pool status
curl -s https://bapi.ingasti.com/health/db | jq '.poolStats'
```

### Verified Working Endpoints (August 6, 2025)
```bash
# ✅ Health endpoints
curl -s https://bapi.ingasti.com/health
curl -s https://bapi.ingasti.com/health/db

# ✅ Posts API
curl -s https://bapi.ingasti.com/api/posts
curl -s https://bapi.ingasti.com/api/posts/8

# ✅ Social Media Settings API
curl -s https://bapi.ingasti.com/api/settings/social
curl -X PUT https://bapi.ingasti.com/api/settings/social \
  -H "Content-Type: application/json" \
  -d '{"facebook":"https://facebook.com/bedtimeblog","twitter":"https://twitter.com/bedtimeblog"}'

# ❌ Non-existent endpoints return 404
curl -s https://bapi.ingasti.com/api/categories
# Returns: Cannot GET /api/categories
```

---

## Error Responses

### 404 Not Found
When an endpoint doesn't exist:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/nonexistent</pre>
</body>
</html>
```

### JSON Error Responses
Most API endpoints return JSON error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-06T17:49:12.226Z"
}
```

---

## CORS Configuration

The API supports cross-origin requests from:
- `https://blog.ingasti.com` (production frontend)
- `http://localhost:3000` (development)
- `http://localhost:3001` (alternative dev port)
- `http://localhost:5173` (Vite dev server)

---

## Authentication

Some endpoints require authentication. The API supports:
- Session-based authentication
- Google OAuth 2.0
- API key authentication (for publishing tools)

---

## Monitoring

- **Health Checks**: Available at `/health` and `/health/db`
- **Uptime Monitoring**: Use `/health` endpoint
- **Performance Monitoring**: Database response times available at `/health/db`
- **Connection Pool Monitoring**: Pool statistics at `/health/db`

---

## Production URLs

- **API Base**: `https://bapi.ingasti.com`
- **Frontend**: `https://blog.ingasti.com`
- **Status Page**: `https://bapi.ingasti.com/health`

---

## Support

For API support or issues:
1. Check the health endpoints first
2. Review error responses for specific error codes
3. Monitor database connection pool status
4. Check CORS configuration for frontend integration issues

*Last Updated: August 6, 2025*

### Query Parameters for GET /api/posts
- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 10)
- `category` - Filter by category
- `published` - Filter by published status (true/false)
- `author` - Filter by author ID

### Testing Examples

#### Get All Posts
```bash
curl https://bapi.ingasti.com/api/posts
```

#### Get Posts with Pagination
```bash
curl "https://bapi.ingasti.com/api/posts?page=1&limit=5"
```

#### Get Posts by Category
```bash
curl "https://bapi.ingasti.com/api/posts?category=technology"
```

#### Get Specific Post
```bash
curl https://bapi.ingasti.com/api/posts/1
```

#### Create New Post (Requires Authentication)
```bash
curl -X POST https://bapi.ingasti.com/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My New Post",
    "content": "This is the content of my post",
    "category": "technology",
    "published": false
  }'
```

---

## 3. Users API

### Endpoints
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user (authenticated)
- `DELETE /api/users/:id` - Delete user (admin only)

### Testing Examples

#### Get All Users (Admin Required)
```bash
curl https://bapi.ingasti.com/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### Get Specific User
```bash
curl https://bapi.ingasti.com/api/users/1
```

---

## 4. Publishing API

### Endpoints
- `POST /api/publish/publish-post/:id` - Publish a specific post
- `POST /api/publish/bulk-publish` - Bulk publish posts
- `GET /api/publish/status/:id` - Get publish status of a post

### Testing Examples

#### Publish a Post
```bash
curl -X POST https://bapi.ingasti.com/api/publish/publish-post/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Bulk Publish Posts
```bash
curl -X POST https://bapi.ingasti.com/api/publish/bulk-publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "postIds": [1, 2, 3, 4]
  }'
```

#### Check Publish Status
```bash
curl https://bapi.ingasti.com/api/publish/status/1
```

---

## 5. Settings API (Social Media Management)

### Endpoints
- `GET /api/settings/social` - Get social media links
- `PUT /api/settings/social` - Update social media links (authenticated)

### Testing Examples

#### Get Social Media Links
```bash
curl https://bapi.ingasti.com/api/settings/social
```

**Expected Response:**
```json
{
  "facebook": "https://facebook.com/yourblog",
  "twitter": "https://twitter.com/yourblog",
  "instagram": "https://instagram.com/yourblog",
  "threads": "https://threads.net/@yourblog"
}
```

#### Update Social Media Links
```bash
curl -X PUT https://bapi.ingasti.com/api/settings/social \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "facebook": "https://facebook.com/myblog",
    "twitter": "https://twitter.com/myblog",
    "instagram": "https://instagram.com/myblog",
    "threads": "https://threads.net/@myblog"
  }'
```

---

## 6. Health Check API

### Endpoints
- `GET /api/health` - API health check
- `GET /api/health/db` - Database health check

### Testing Examples

#### API Health Check
```bash
curl https://bapi.ingasti.com/api/health
```

#### Database Health Check
```bash
curl https://bapi.ingasti.com/api/health/db
```

---

## Authentication

### JWT Token Usage
Most endpoints that modify data require authentication. Include the JWT token in the Authorization header:

```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Getting a JWT Token
1. Register or login using the auth endpoints
2. Extract the token from the response
3. Use it in subsequent requests

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **General endpoints:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 5 requests per 15 minutes per IP

---

## Testing Tools

### Recommended Tools
1. **cURL** - Command line testing (examples above)
2. **Postman** - GUI-based API testing
3. **HTTPie** - User-friendly command line tool
4. **Browser** - For GET endpoints

### HTTPie Examples
```bash
# Install HTTPie
pip install httpie

# Get posts
http GET https://bapi.ingasti.com/api/posts

# Post with JSON
http POST https://bapi.ingasti.com/api/auth/login username=testuser password=test123
```

---

## API Modules Implementation

### File Structure
```
api/
├── index.js              # Main server file
├── db.js                 # Database connection
├── controllers/          # Business logic
│   ├── auth.js          # Authentication logic
│   ├── post.js          # Post management logic
│   ├── user.js          # User management logic
│   ├── publish.js       # Publishing logic
│   └── settings.js      # Settings management logic
├── routes/              # Route definitions
│   ├── auth.js          # Auth routes
│   ├── posts.js         # Post routes
│   ├── users.js         # User routes
│   ├── publish.js       # Publish routes
│   └── settings.js      # Settings routes
└── middleware/          # Custom middleware
    └── systemConfig.js  # System configuration
```

### Database Schema
The API uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `posts` - Blog posts and content
- `categories` - Post categories
- `settings` - System configuration (including social media links)

---

## Quick Testing Script

Save this as `test-api.sh` for quick API testing:

```bash
#!/bin/bash

BASE_URL="https://bapi.ingasti.com"

echo "=== Testing Blog API ==="
echo

echo "1. Health Check:"
curl -s "$BASE_URL/api/health" | jq .
echo

echo "2. Get Posts:"
curl -s "$BASE_URL/api/posts?limit=3" | jq .
echo

echo "3. Get Social Media Settings:"
curl -s "$BASE_URL/api/settings/social" | jq .
echo

echo "4. Database Health:"
curl -s "$BASE_URL/api/health/db" | jq .
echo

echo "=== API Testing Complete ==="
```

Run with: `chmod +x test-api.sh && ./test-api.sh`

---

## Support and Troubleshooting

### Common Issues
1. **CORS Errors:** The API includes CORS headers for browser requests
2. **Authentication:** Ensure JWT tokens are valid and not expired
3. **Rate Limiting:** Wait if you receive 429 status codes
4. **SSL/TLS:** All requests must use HTTPS

### Getting Help
- Check the server logs for detailed error messages
- Verify your request format matches the examples
- Ensure proper authentication for protected endpoints

---

*Last Updated: August 6, 2025*
*API Version: 1.0*
