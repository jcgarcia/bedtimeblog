# 📝 Bedtime Blog Publishing Tool - Complete User Guide

## 🌟 Overview

The Bedtime Blog Publishing Tool is a powerful CLI utility that allows you to publish Markdown blog posts with YAML frontmatter directly to your blog. It features automatic configuration loading, validation, multiple publishing methods, and comprehensive error handling.

---

## 🚀 Global Installation (Use from Anywhere)

### Method 1: Install Globally with pnpm (Recommended)

```bash
# Navigate to the tools directory
cd /home/jcgarcia/docs/Tech/Blog/code/tools

# Install globally using pnpm
pnpm install -g .

# Verify installation
blog-publish --help
```

### Method 2: Create a Global Symlink

```bash
# Make the script executable
chmod +x /home/jcgarcia/docs/Tech/Blog/code/tools/blog-publish.js

# Create a symlink in your PATH
sudo ln -sf /home/jcgarcia/docs/Tech/Blog/code/tools/blog-publish.js /usr/local/bin/blog-publish

# Verify installation
blog-publish --help
```

### Method 3: Add to PATH via Bash Profile

```bash
# Add to your ~/.bashrc or ~/.zshrc
echo 'export PATH="/home/jcgarcia/docs/Tech/Blog/code/tools:$PATH"' >> ~/.bashrc

# Reload your shell
source ~/.bashrc

# Make the script executable
chmod +x /home/jcgarcia/docs/Tech/Blog/code/tools/blog-publish.js

# Use directly
blog-publish.js --help
```

---

## 📋 Prerequisites

- **Node.js** v18+ 
- **pnpm** package manager
- Valid API key for authentication
- Proper database connectivity (auto-configured)

---

## 📝 Markdown File Format

Your blog posts must use the following structure:

```markdown
---
title: "Your Compelling Blog Post Title"
description: "A concise description of your post content"
date: 2025-08-04
tags: [technology, tutorial, guide]
category: tech
author: "Your Name"
slug: custom-url-slug  # Optional - auto-generated if not provided
---

# Your Main Heading

Write your blog post content here using standard Markdown syntax.

## Subheadings

- **Bold text**
- *Italic text*
- `Code snippets`
- [Links](https://example.com)

### Code Blocks

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

### Images

![Alt text](https://example.com/image.jpg)

### Lists

1. Numbered items
2. In order

- Bullet points
- Unordered lists

> Blockquotes for emphasis

---

**Footer information or call-to-action**
```

### 📋 Frontmatter Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `title` | ✅ **Yes** | Post title (used for SEO and display) | `"Complete Guide to Node.js"` |
| `description` | ✅ **Yes** | Post summary (used for SEO meta) | `"Learn Node.js from basics to advanced"` |
| `date` | ❌ No | Publication date (auto-generated if omitted) | `2025-08-04` or `2025-08-04T10:30:00Z` |
| `tags` | ❌ No | Array of tags for categorization | `[javascript, node, tutorial]` |
| `category` | ❌ No | Primary category (defaults to first tag) | `programming` |
| `author` | ❌ No | Author name | `"John Doe"` |
| `slug` | ❌ No | Custom URL slug (auto-generated from title) | `my-awesome-post` |

---

## 🎯 Usage Instructions

### Basic Usage

```bash
# Publish a post (file upload method)
blog-publish ./my-post.md

# Publish with content method (faster)
blog-publish ./my-post.md --content
```

### Advanced Usage with Options

```bash
# Custom API URL
blog-publish ./post.md --api-url https://my-api.com/api

# Custom API key
blog-publish ./post.md --api-key your-api-key-here

# Combined options
blog-publish ./post.md --content --api-key your-key --api-url https://custom.api.com/api

# Show help
blog-publish --help
```

### Multiple Files Publishing

```bash
# Publish multiple posts (using shell wildcards)
for file in posts/*.md; do
  echo "Publishing $file..."
  blog-publish "$file" --content
  sleep 2  # Avoid rate limiting
done
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the tools directory or your home directory:

```bash
# API Configuration
BLOG_API_URL=https://bapi.ingasti.com/api
BLOG_API_KEY=your-api-key-here
BLOG_USER_ID=1

# PostgreSQL Database (for config loading)
PGHOST=your-database-host
PGPORT=25306
PGDATABASE=blog
PGUSER=your-username
PGPASSWORD=your-password
PGSSLMODE=require
```

### Configuration Priority

The tool loads configuration in this order (highest to lowest priority):

1. **Command line arguments** (`--api-key`, `--api-url`)
2. **Environment variables** (`.env.local`, `.env`)
3. **Database configuration** (auto-loaded)
4. **Default values** (fallback)

---

## 🎛️ Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--help` | Show help message and exit | `blog-publish --help` |
| `--api-url <url>` | Override API base URL | `--api-url https://api.example.com` |
| `--api-key <key>` | Override API key | `--api-key abc123def456` |
| `--content` | Use content method (faster, no file upload) | `--content` |

---

## 📊 Publishing Methods

### Method 1: File Upload (Default)

```bash
blog-publish ./my-post.md
```

- **How it works**: Uploads the markdown file as multipart form data
- **Pros**: Handles large files well, preserves original formatting
- **Cons**: Slightly slower due to file upload

### Method 2: Content Publishing (Recommended)

```bash
blog-publish ./my-post.md --content
```

- **How it works**: Reads file content and sends as JSON
- **Pros**: Faster, more efficient, better for automation
- **Cons**: May have size limitations for very large posts

---

## ✅ Validation Process

The tool automatically validates your post before publishing:

### 1. **File Existence Check**
- Verifies the markdown file exists
- Checks file permissions

### 2. **Frontmatter Validation**
- Ensures YAML frontmatter is present
- Validates required fields (`title`, `description`)
- Warns about missing optional fields

### 3. **Content Structure Check**
- Verifies markdown syntax
- Checks for basic formatting issues

### 4. **API Authentication**
- Validates API key
- Checks API endpoint accessibility

---

## 🔍 Monitoring and Health Checks

### Database Health Check

```bash
# Check database connection and pool status
curl https://bapi.ingasti.com/health/db

# Detailed connection information
curl https://bapi.ingasti.com/health/db/connections
```

### API Health Check

```bash
# Basic API health
curl https://bapi.ingasti.com/health
```

---

## 🎯 Examples and Use Cases

### Example 1: Quick Blog Post

```bash
# Create a simple post
cat > quick-post.md << 'EOF'
---
title: "Today's Tech Update"
description: "Quick thoughts on the latest technology trends"
date: 2025-08-04
tags: [tech, update, thoughts]
---

# Today's Tech Update

Just a quick post about what I learned today...

## Key Points

- Point 1
- Point 2
- Point 3

That's all for today!
EOF

# Publish it
blog-publish quick-post.md --content
```

### Example 2: Tutorial Series

```bash
# Create a comprehensive tutorial
cat > tutorial-part-1.md << 'EOF'
---
title: "Node.js Tutorial - Part 1: Getting Started"
description: "Complete beginner's guide to Node.js development"
date: 2025-08-04
tags: [nodejs, tutorial, javascript, beginner]
category: tutorial
author: "Tech Writer"
---

# Node.js Tutorial - Part 1: Getting Started

Welcome to our comprehensive Node.js tutorial series...

## Prerequisites

Before we begin, make sure you have:

1. Basic JavaScript knowledge
2. A computer with internet access
3. A text editor

## Installation

\`\`\`bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

## Your First Node.js Program

\`\`\`javascript
console.log("Hello, Node.js!");
\`\`\`

[Continue to Part 2 →](link-to-part-2)
EOF

# Publish the tutorial
blog-publish tutorial-part-1.md --content
```

### Example 3: Automated Publishing Script

```bash
#!/bin/bash
# auto-publish.sh - Automated publishing script

POSTS_DIR="./drafts"
PUBLISHED_DIR="./published"

# Create directories if they don't exist
mkdir -p "$PUBLISHED_DIR"

# Publish all markdown files in drafts
for post in "$POSTS_DIR"/*.md; do
  if [ -f "$post" ]; then
    echo "📝 Publishing: $(basename "$post")"
    
    # Publish the post
    if blog-publish "$post" --content; then
      echo "✅ Success! Moving to published directory..."
      mv "$post" "$PUBLISHED_DIR/"
      echo "🎉 Published: $(basename "$post")"
    else
      echo "❌ Failed to publish: $(basename "$post")"
    fi
    
    # Wait 3 seconds between posts to avoid rate limiting
    sleep 3
  fi
done

echo "📊 Publishing complete!"
```

---

## ❗ Troubleshooting

### Common Issues and Solutions

#### 1. **"API key is required" Error**

```bash
# Solution 1: Set environment variable
export BLOG_API_KEY="your-api-key-here"

# Solution 2: Use command line option
blog-publish ./post.md --api-key your-api-key-here

# Solution 3: Check .env.local file
cat .env.local | grep BLOG_API_KEY
```

#### 2. **"File not found" Error**

```bash
# Check file exists
ls -la your-post.md

# Use absolute path
blog-publish /full/path/to/your-post.md

# Check current directory
pwd
```

#### 3. **"Frontmatter validation failed" Error**

```bash
# Check frontmatter format
head -10 your-post.md

# Ensure proper YAML structure
---
title: "Your Title"
description: "Your description"
---
```

#### 4. **"Database connection error"**

```bash
# Check database health
curl https://bapi.ingasti.com/health/db

# Use CLI options to bypass database config
blog-publish ./post.md --api-key your-key --api-url https://bapi.ingasti.com/api
```

#### 5. **"Permission denied" Error**

```bash
# Make script executable
chmod +x /usr/local/bin/blog-publish

# Check PATH
echo $PATH | grep blog-publish
```

---

## 🔧 Advanced Features

### Custom API Endpoints

```bash
# Use custom development API
blog-publish ./post.md --api-url http://localhost:5000/api

# Use staging environment
blog-publish ./post.md --api-url https://staging-api.example.com/api
```

### Batch Operations

```bash
# Publish all posts in a directory
find ./posts -name "*.md" -exec blog-publish {} --content \;

# Publish with custom delay
for post in posts/*.md; do
  blog-publish "$post" --content
  echo "Waiting 5 seconds..."
  sleep 5
done
```

### Integration with Git Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash
# Auto-publish changed markdown files

changed_posts=$(git diff --cached --name-only --diff-filter=AM | grep '\.md$')

for post in $changed_posts; do
  if [[ $post == posts/* ]]; then
    echo "📝 Auto-publishing: $post"
    blog-publish "$post" --content
  fi
done
```

---

## 📈 Performance Tips

### 1. **Use Content Method for Speed**
```bash
# Faster - recommended for automation
blog-publish ./post.md --content
```

### 2. **Optimize Image Sizes**
- Keep images under 1MB when possible
- Use compressed formats (WebP, optimized JPEG)
- Consider external image hosting

### 3. **Batch Publishing Guidelines**
```bash
# Add delays to avoid rate limiting
sleep 2  # 2 seconds between posts

# Monitor API health during batch operations
curl https://bapi.ingasti.com/health/db
```

---

## 🔒 Security Best Practices

### 1. **Protect Your API Key**
```bash
# Never commit API keys to version control
echo "*.env*" >> .gitignore

# Use environment variables in production
export BLOG_API_KEY="your-secure-api-key"

# Rotate API keys regularly
```

### 2. **Validate Content Before Publishing**
```bash
# Always review your posts
cat your-post.md | head -20

# Check for sensitive information
grep -i "password\|secret\|key" your-post.md
```

### 3. **Use HTTPS Endpoints Only**
```bash
# Always use HTTPS in production
BLOG_API_URL=https://bapi.ingasti.com/api  # ✅ Secure
BLOG_API_URL=http://api.example.com/api   # ❌ Insecure
```

---

## 📞 Support and Additional Tools

### Related Tools in the Suite

```bash
# System configuration management
node system-config.js

# Bulk publishing script
./bulk-publish.sh

# Post scheduler
node post-scheduler.js

# Blog configuration helper
./blog-config.sh
```

### Get Help

```bash
# Show detailed help
blog-publish --help

# Check tool version
blog-publish --version

# Test installation
blog-publish --test
```

### Health Monitoring URLs

- **API Health**: https://bapi.ingasti.com/health
- **Database Health**: https://bapi.ingasti.com/health/db
- **Connection Details**: https://bapi.ingasti.com/health/db/connections
- **Blog Frontend**: https://blog.ingasti.com

---

## 🎉 Success Indicators

When everything works correctly, you'll see:

```bash
✅ Configuration loaded from database
✅ Markdown file validation passed
📄 Publishing: your-post.md
✅ Post published successfully!
📝 Title: Your Post Title
🏷️  Category: your-category
🆔 Post ID: 123
📅 Published: 8/4/2025, 10:30:00 AM

🎉 Post published successfully
📝 Post ID: 123
📌 Title: Your Post Title
🏷️  Category: your-category
📅 Published: 2025-08-04T08:30:00.000Z
```

Your post is now live at: **https://blog.ingasti.com**

---

*Last updated: August 4, 2025*  
*Tool version: 1.0.0*  
*Database connection improvements: ✅ Active*
