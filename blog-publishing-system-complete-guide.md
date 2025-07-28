# Blog Publishing System: Complete Step-by-Step Guide

## 1. Set Up Environment Variables
Before running any setup or publishing tool, export the following variables in your shell:

```bash
export PGHOST='ingasti-pg-ingasti.c.aivencloud.com'
export PGPORT='25306'
export PGDATABASE='blog'
export PGUSER='avnadmin'
export PGPASSWORD='your_postgres_password'
export PGSSLMODE='require'
export BLOG_API_KEY='your_api_key'
export BLOG_API_URL='https://bapi.ingasti.com/api'
export BLOG_USER_ID='1'
```
Replace `your_postgres_password` and `your_api_key` with your actual credentials.

## 2. Run the Database Setup Script
Navigate to the database setup directory and run the setup script:

```bash
cd /home/jcgarcia/docs/Tech/Blog/code/database
./setup-existing-db.sh
```
This script will:
- Test the PostgreSQL connection
- Create configuration tables
- Generate and store a secure API key
- Install dependencies
- Test the configuration system

## 3. Create a Test Markdown Article
Navigate to the tools directory and create a test Markdown file:

```bash
cd /home/jcgarcia/docs/Tech/Blog/code/tools

echo '---' > test-post.md
echo 'title: Test Post' >> test-post.md
echo 'description: A test post' >> test-post.md
echo '---' >> test-post.md
echo '# Hello World' >> test-post.md
```

## 4. Publish the Article
Run the publishing tool with all required parameters:

```bash
./blog-publish test-post.md --api-url "$BLOG_API_URL" --api-key "$BLOG_API_KEY"
```
Or, if your environment variables are set, you can simply run:
```bash
./blog-publish test-post.md
```

## 5. Verify the System
Check the output for success messages. To verify configuration and API keys:

```bash
node system-config.js config:list
node system-config.js apikey:list
node system-config.js stats
```

## 6. Troubleshooting
If you encounter errors:
- Double-check all environment variables are set and correct
- Ensure the API endpoint (`BLOG_API_URL`) is reachable
- Ensure your API key is valid and matches the one stored in the database
- Check for network/firewall issues
- Review error messages for details

## 7. Additional Notes
- Always use the standard PostgreSQL variable names: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE`
- Use `BLOG_API_KEY` for the API key and `BLOG_API_URL` for the API endpoint
- You can pass `--api-url` and `--api-key` as CLI options if you prefer
- All tools and scripts expect these variable names for consistent operation

---
**Your blog publishing system is now ready for secure and reliable use!**
