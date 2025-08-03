# Blog Publishing System: Environment, Architecture, and Troubleshooting

## 1. System Architecture

### Components
- **Backend API**: Node.js/Express, connects to PostgreSQL, deployed via Docker/Kubernetes, uses singleton pg.Pool.
- **Database**: PostgreSQL, table `sys_api_keys` stores API keys (`service_name`, `api_key_encrypted`, `is_active`).
- **API Key Validation**: Middleware loads key from DB (`blog_publish_api_key`), attaches to `req.apiKeys.publishApiKey`.
- **Publishing Tool**: Node.js CLI, sends markdown to `/api/publish/markdown` with `X-API-Key` header.
- **Deployment**: CI/CD via Jenkins, runs Docker/Kubernetes deploys.
- **Config**: API key must be active in DB, backend must connect to correct DB, no caching of old keys.

### Key Files
- `api/controllers/publish.js`: Handles publish endpoint, checks `req.apiKeys.publishApiKey`.
- `api/middleware/systemConfig.js`: Loads config and API keys from DB.
- `api/utils/systemConfig.js`: Implements `getApiKey`, queries `sys_api_keys`.
- `tools/blog-publish.js`: CLI publishing tool.

## 2. API Key Validation Flow
- API key is sent in `X-API-Key` header by the publishing tool.
- Backend middleware loads `blog_publish_api_key` from `sys_api_keys` where `is_active=true`.
- Key is attached to `req.apiKeys.publishApiKey`.
- Controller compares incoming key to `req.apiKeys.publishApiKey`.
- If match: request proceeds. If not: 401 Unauthorized.

## 3. Deployment & Configuration
- **Database connection**: Set via environment variable (e.g., `DATABASE_URL`).
- **API key management**: Update `sys_api_keys` table, set `is_active=true`.
- **Restart backend** after changing API key in DB to ensure reload.
- **Jenkins**: Used for CI/CD, triggers Docker/K8s deploys.

## 4. Troubleshooting Steps

### 401 Invalid API Key
1. Confirm API key in DB matches the one used by the publishing tool.
2. Ensure `is_active=true` for the key in `sys_api_keys`.
3. Restart backend to reload API key from DB.
4. Check backend logs for DB connection or key loading errors.
5. Ensure backend is connected to the correct DB/schema.
6. Test with publishing tool:
   ```bash
   node Tech/Blog/code/tools/blog-publish.js Tech/Blog/code/tools/test-post.md --api-url https://bapi.ingasti.com/api --api-key <your-key>
   ```

### Backend Not Using Updated Key
- Restart backend service/container.
- Check for multiple running backend instances.
- Ensure no old `.env` or config files are overriding DB connection.

### Database Connection Issues
- Check `DATABASE_URL` or equivalent env variable in backend deployment.
- Confirm DB host, user, password, and schema are correct.

## 5. Reference: Key SQL
```sql
SELECT * FROM public.sys_api_keys WHERE service_name = 'blog_publish_api_key';
```

## 6. Reference: Key Environment Variables
- `DATABASE_URL` (backend DB connection)
- `PUBLISH_API_KEY` (legacy, should not be used if DB is source of truth)

---

This file documents the full environment, architecture, and troubleshooting for the blog publishing system. Update as needed for future changes.
