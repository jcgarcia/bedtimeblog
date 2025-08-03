import { getDbPool } from "../db.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for markdown file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/markdown");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept markdown files
    if (file.mimetype === 'text/markdown' || 
        file.mimetype === 'text/plain' || 
        path.extname(file.originalname).toLowerCase() === '.md') {
      cb(null, true);
    } else {
      cb(new Error('Only markdown files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Parse frontmatter from markdown content
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {},
      content: content
    };
  }
  
  const frontmatterText = match[1];
  const bodyContent = match[2];
  
  // Parse YAML-like frontmatter
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Handle arrays (tags)
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
      }
      
      frontmatter[key] = value;
    }
  }
  
  return {
    frontmatter,
    content: bodyContent.trim()
  };
}

// Validate required frontmatter fields
function validateFrontmatter(frontmatter) {
  const required = ['title', 'description'];
  const missing = required.filter(field => !frontmatter[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required frontmatter fields: ${missing.join(', ')}`);
  }
  
  return true;
}

// Extract category from tags or frontmatter
function extractCategory(frontmatter) {
  // Priority: explicit category field, first tag, default
  if (frontmatter.category) {
    return frontmatter.category;
  }
  
  if (frontmatter.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0) {
    return frontmatter.tags[0];
  }
  
  return 'general';
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Main publish function
export const publishMarkdownPost = (req, res) => {
  const uploadSingle = upload.single('markdown');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No markdown file provided' });
    }
    const pool = getDbPool();
    try {
      // Read the uploaded file
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      // Parse frontmatter and content
      const { frontmatter, content } = parseFrontmatter(fileContent);
      // Validate frontmatter
      validateFrontmatter(frontmatter);
      // Extract post data
      const title = frontmatter.title;
      const description = frontmatter.description;
      const category = extractCategory(frontmatter);
      const postDate = frontmatter.date ? new Date(frontmatter.date) : new Date();
      const slug = generateSlug(title);
      // Handle authentication (allow API key or JWT token)
      let userId = null;
      const apiKey = req.headers['x-api-key'];
      const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
      if (apiKey) {
        // Use API key from database configuration
        const validApiKey = req.apiKeys?.publishApiKey;
        if (!validApiKey || apiKey !== validApiKey) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
        // Use default user ID from system configuration
        userId = parseInt(req.systemConfig?.blogUserId) || 1;
      } else if (token) {
        // JWT token authentication
        try {
          const userInfo = jwt.verify(token, "jwtkey");
          userId = userInfo.id;
        } catch (jwtErr) {
          return res.status(403).json({ error: 'Invalid token' });
        }
      } else {
        return res.status(401).json({ error: 'Authentication required' });
      }
      // Prepare database query
      const q = "INSERT INTO posts(`title`, `postcont`, `img`, `cat`, `postdate`, `userid`) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;";
      const values = [title, content, frontmatter.image || '', category, postDate, userId];
      // Insert into database
      const result = await pool.query(q, values);
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Post published successfully',
        postId: result.rows[0].id,
        title: title,
        category: category,
        publishedAt: postDate
      });
    } catch (parseErr) {
      console.error('Parse error:', parseErr);
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: parseErr.message });
    }
  });
};

// Alternative endpoint for publishing via raw markdown content (no file upload)
export const publishMarkdownContent = (req, res) => {
  (async () => {
    const pool = getDbPool();
    try {
      const { markdownContent } = req.body;
      if (!markdownContent) {
        return res.status(400).json({ error: 'Markdown content is required' });
      }
      // Parse frontmatter and content
      const { frontmatter, content } = parseFrontmatter(markdownContent);
      // Validate frontmatter
      validateFrontmatter(frontmatter);
      // Extract post data
      const title = frontmatter.title;
      const description = frontmatter.description;
      const category = extractCategory(frontmatter);
      const postDate = frontmatter.date ? new Date(frontmatter.date) : new Date();
      const slug = generateSlug(title);
      // Handle authentication
      let userId = null;
      const apiKey = req.headers['x-api-key'];
      const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
      if (apiKey) {
        // Use API key from database configuration
        const validApiKey = req.apiKeys?.publishApiKey;
        if (!validApiKey || apiKey !== validApiKey) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
        // Use default user ID from system configuration
        userId = parseInt(req.systemConfig?.blogUserId) || 1;
      } else if (token) {
        try {
          const userInfo = jwt.verify(token, "jwtkey");
          userId = userInfo.id;
        } catch (jwtErr) {
          return res.status(403).json({ error: 'Invalid token' });
        }
      } else {
        return res.status(401).json({ error: 'Authentication required' });
      }
      // Prepare database query
      const q = "INSERT INTO posts(`title`, `postcont`, `img`, `cat`, `postdate`, `userid`) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;";
      const values = [title, content, frontmatter.image || '', category, postDate, userId];
      // Insert into database
      const result = await pool.query(q, values);
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Post published successfully',
        postId: result.rows[0].id,
        title: title,
        category: category,
        publishedAt: postDate
      });
    } catch (parseErr) {
      console.error('Parse error:', parseErr);
      return res.status(400).json({ error: parseErr.message });
    }
  })();
};
