# Bedtime Blog Backend API Documentation

## Overview

The Bedtime Blog backend is a RESTful API built with Node.js and Express.js that serves as the server-side component for a blog application. It provides authentication, user management, and post management capabilities with MySQL database integration.

**Base URL:** `https://bapi.ingasti.com` (Production) or `http://localhost:5000` (Development)

**API Version:** 1.0.0

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
   - [System Health](#system-health)
   - [Authentication Routes](#authentication-routes)
   - [Post Management](#post-management)
   - [User Management](#user-management)
   - [File Upload](#file-upload)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Security](#security)
6. [Environment Variables](#environment-variables)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens are stored in HTTP-only cookies for security.

### Authentication Flow:
1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns JWT token in HTTP-only cookie (`access_token`)
3. Protected routes verify the token from the cookie
4. Google OAuth2 authentication is also supported

### Token Format:
```javascript
{
  "id": "user_id",
  "iat": timestamp,
  "exp": timestamp
}
```

## API Endpoints

### System Health

#### GET `/health`
Health check endpoint to verify API status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600.123
}
```

#### GET `/`
Root endpoint providing basic API information.

**Response:**
```json
{
  "message": "Bedtime Blog API is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Authentication Routes

Base path: `/api/auth`

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
- **200 OK:** User created successfully
```json
"User has been created."
```
- **409 Conflict:** User already exists
```json
"User already exists!"
```
- **500 Internal Server Error:** Database error

#### POST `/api/auth/login`
Authenticate a user and receive access token.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response:**
- **200 OK:** Login successful
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```
- **400 Bad Request:** Wrong credentials
```json
"Wrong username or password!"
```
- **404 Not Found:** User not found
```json
"User not found!"
```
- **500 Internal Server Error:** Database error

**Sets Cookie:** `access_token` (HTTP-only, contains JWT)

#### POST `/api/auth/logout`
Logout user and clear authentication token.

**Response:**
- **200 OK:**
```json
"User has been logged out."
```

**Clears Cookie:** `access_token`

#### GET `/api/auth/google`
Initiate Google OAuth2 authentication flow.

**Redirects to:** Google OAuth2 consent screen

#### GET `/api/auth/google/callback`
Handle Google OAuth2 callback and authentication.

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: State parameter for security

**Response:**
- **Redirect:** `/welcome?user={encoded_user_data}` on success
- **Redirect:** `/login` on failure

### Post Management

Base path: `/api/posts`

#### GET `/api/posts`
Retrieve all posts or posts filtered by category.

**Query Parameters:**
- `cat` (optional): Filter posts by category

**Examples:**
- `GET /api/posts` - Get all posts
- `GET /api/posts?cat=technology` - Get posts in technology category

**Response:**
- **200 OK:**
```json
[
  {
    "id": 1,
    "title": "Post Title",
    "desc": "Post description/content",
    "img": "image_filename.jpg",
    "cat": "technology",
    "date": "2024-01-01T12:00:00.000Z",
    "userid": 1
  }
]
```
- **500 Internal Server Error:** Database error

#### GET `/api/posts/:id`
Retrieve a specific post by ID with user information.

**Path Parameters:**
- `id`: Post ID (integer)

**Response:**
- **200 OK:**
```json
{
  "id": 1,
  "username": "johndoe",
  "title": "Post Title",
  "desc": "Post description/content",
  "img": "post_image.jpg",
  "userImg": "user_avatar.jpg",
  "cat": "technology",
  "date": "2024-01-01T12:00:00.000Z"
}
```
- **500 Internal Server Error:** Database error

#### POST `/api/posts`
Create a new post (requires authentication).

**Authentication:** Required (JWT token in cookie)

**Request Body:**
```json
{
  "title": "string (required)",
  "desc": "string (required) - Post content",
  "img": "string (optional) - Image filename",
  "cat": "string (required) - Category",
  "date": "string (required) - ISO date string"
}
```

**Response:**
- **200 OK:**
```json
"Post has been created."
```
- **401 Unauthorized:** Not authenticated
```json
"Not authenticated!"
```
- **403 Forbidden:** Invalid token
```json
"Token is not valid!"
```
- **500 Internal Server Error:** Database error

#### PUT `/api/posts/:id`
Update an existing post (requires authentication and ownership).

**Authentication:** Required (JWT token in cookie)

**Path Parameters:**
- `id`: Post ID (integer)

**Request Body:**
```json
{
  "title": "string (required)",
  "desc": "string (required) - Post content",
  "img": "string (optional) - Image filename",
  "cat": "string (required) - Category"
}
```

**Response:**
- **200 OK:**
```json
"Post has been updated."
```
- **401 Unauthorized:** Not authenticated
```json
"Not authenticated!"
```
- **403 Forbidden:** Invalid token or not post owner
```json
"Token is not valid!"
```
- **500 Internal Server Error:** Database error

#### DELETE `/api/posts/:id`
Delete a post (requires authentication and ownership).

**Authentication:** Required (JWT token in cookie)

**Path Parameters:**
- `id`: Post ID (integer)

**Response:**
- **200 OK:**
```json
"Post has been deleted!"
```
- **401 Unauthorized:** Not authenticated
```json
"Not authenticated!"
```
- **403 Forbidden:** Invalid token or not post owner
```json
"You can delete only your post!"
```

### User Management

Base path: `/api/users`

**Note:** User management endpoints are currently under development (TODO).

### File Upload

#### POST `/api/upload`
Upload a file (typically images for posts).

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:** Form data with file field named `file`

**Response:**
- **200 OK:**
```json
"1640995200000example.jpg"
```
(Returns the generated filename)

**File Storage:**
- Files are stored in `./uploads` directory
- Filename format: `{timestamp}{original_filename}`
- Files are served statically at `/uploads/{filename}`

#### GET `/uploads/:filename`
Serve uploaded files statically.

**Path Parameters:**
- `filename`: Name of the uploaded file

**Response:**
- **200 OK:** File content
- **404 Not Found:** File not found

## Data Models

### User Model
```javascript
{
  id: integer (primary key),
  username: string (unique),
  email: string (unique),
  password: string (hashed with bcrypt),
  img: string (optional, avatar image filename)
}
```

### Post Model
```javascript
{
  id: integer (primary key),
  title: string,
  postcont: string (post content, maps to 'desc' in API),
  img: string (optional, image filename),
  cat: string (category),
  postdate: datetime (maps to 'date' in API),
  userid: integer (foreign key to users.id)
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **200 OK:** Request successful
- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Access denied (invalid token or insufficient permissions)
- **404 Not Found:** Resource not found
- **409 Conflict:** Resource already exists
- **500 Internal Server Error:** Database or server error

Error responses typically return a string message:
```json
"Error message description"
```

## Security

### Authentication Security
- JWT tokens are stored in HTTP-only cookies to prevent XSS attacks
- Passwords are hashed using bcrypt with salt rounds of 10
- JWT secret key should be properly configured in production

### CORS Configuration
The API supports CORS with the following allowed origins:
- `https://blog.ingasti.com` (Production frontend)
- `http://localhost:3000` (Development frontend)
- `http://localhost:3001` (Alternative development port)

### Cookie Security
- Production cookies should use `secure: true` and `sameSite: "none"` for HTTPS
- `httpOnly: true` prevents JavaScript access to tokens

### File Upload Security
- Files are stored with timestamped filenames to prevent conflicts
- No file type validation is currently implemented (consider adding)

## Environment Variables

The following environment variables are required:

### Database Configuration
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=blog_user
DB_KEY=database_password
DB_NAME=blog_database
```

### Google OAuth2
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### CORS Configuration
```env
CORS_ORIGIN=https://blog.ingasti.com
```

### Server Configuration
```env
PORT=5000
```

### JWT Security
```env
JWT_SECRET=your_jwt_secret_key
```

**Note:** The JWT secret is currently hardcoded as "jwtkey" in the code. This should be moved to an environment variable for production use.

## Database Schema

### Required Tables

#### users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  img VARCHAR(255)
);
```

#### posts
```sql
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  postcont TEXT NOT NULL,
  img VARCHAR(255),
  cat VARCHAR(255) NOT NULL,
  postdate DATETIME NOT NULL,
  userid INT NOT NULL,
  FOREIGN KEY (userid) REFERENCES users(id)
);
```

**Note:** There appears to be a discrepancy in the delete/update post queries which reference a `uid` column instead of `userid`. This should be corrected in the database schema or controller code.

## Production Deployment

The API is deployed using:
- **Container:** Docker with Node.js
- **Orchestration:** Kubernetes
- **Reverse Proxy:** Caddy (routes bapi.ingasti.com to the service)
- **Database:** MySQL (connection details in Kubernetes secrets)
- **CI/CD:** Jenkins pipeline for automated deployment

## Development

### Prerequisites
- Node.js 18+
- MySQL database
- npm or pnpm

### Setup
1. Install dependencies: `npm install`
2. Configure environment variables
3. Set up MySQL database with required tables
4. Run development server: `npm run dev`

### Testing
Health check: `GET /health`

---

**Last Updated:** 2024-01-01
**API Version:** 1.0.0
**Documentation Version:** 1.0.0
