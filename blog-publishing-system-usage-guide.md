# Blog Publishing System: Testing & Usage Guide

## Overview
This guide explains how to test and use the secure blog publishing module to upload Markdown articles from your local computer. It covers setup, publishing, and verification steps, ensuring your system is secure and operational.

---


## 1. Setup & Configuration
- Ensure your database and configuration tables are set up.
- Run the setup script if not already done:
  ```bash
  cd /home/jcgarcia/docs/Tech/Blog/code/database
  ./setup-existing-db.sh
  ```
- The script will:
  - Test database connection
  - Create configuration tables
  - Generate and store a secure API key
  - Install dependencies
  - Test the configuration system

**Important:** Before running any publishing tool, set your PostgreSQL environment variables:
```bash
export PGHOST='ingasti-pg-ingasti.c.aivencloud.com'
export PGPORT='25306'
export PGUSER='avnadmin'
export PGPASSWORD='your_password'
export PGDATABASE='defaultdb'
export PGSSLMODE='require'
```
Optionally, set your API key if needed:
```bash
export BLOG_API_KEY='your_api_key'
```

**Note:** Save the API key displayed at the end of setup. You’ll need it for publishing.

---

## 2. Creating a Markdown Article
- Go to the tools directory:
  ```bash
  cd /home/jcgarcia/docs/Tech/Blog/code/tools
  ```
- Create a test Markdown article:
  ```bash
  echo '---' > test-post.md
  echo 'title: Test Post' >> test-post.md
  echo 'description: A test post' >> test-post.md
  echo '---' >> test-post.md
  echo '# Hello World' >> test-post.md
  ```
- Or use any existing Markdown file.

---

## 3. Publishing an Article
- Use the CLI tool to publish:
  ```bash
  ./blog-publish test-post.md
  ```
- For help and options:
  ```bash
  ./blog-publish --help
  ```
- The tool will:
  - Authenticate using the API key
  - Upload the article to the database
  - Log the operation for audit

---

## 4. Verifying the System
- Check the output for success messages.
- Verify the post is stored in the database.
- List configuration and API keys:
  ```bash
  node system-config.js config:list
  node system-config.js apikey:list
  node system-config.js stats
  ```

---

## 5. Security Notes
- API keys are stored securely in the database.
- Configuration is managed centrally with audit logging.
- No .env files are needed for API keys.
- All access is logged for security monitoring.

---

## 6. Troubleshooting
- If you encounter errors during publishing, check:
  - Database credentials and connection
  - API key validity
  - Dependency installation
- Review error messages and logs for details.

---

## 7. Next Steps
- Continue publishing articles as needed.
- Use the CLI tools to manage configuration and API keys.
- Monitor audit logs for security.

---

**Your blog publishing system is now secure and ready for use!**
