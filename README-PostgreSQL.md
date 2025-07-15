# 🐘 PostgreSQL Blog Configuration System

This project has been **converted from MySQL to PostgreSQL** for better reliability and performance. All configuration and API key management is now handled by a secure PostgreSQL database.

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)
```bash
# Clone and navigate to the project
cd /home/jcgarcia/docs/Tech/Blog/code

# Run the quick setup script
./quick-setup-postgresql.sh
```

### Option 2: Local PostgreSQL
```bash
# Ensure PostgreSQL is installed and running
sudo systemctl start postgresql

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=blog
export DB_USER=postgres
export DB_PASSWORD=your_password

# Run the setup script
./database/setup-postgresql.sh
```

## 📋 What's Changed

### ✅ **From MySQL to PostgreSQL**
- **Database Driver**: `mysql2` → `pg`
- **Connection Pooling**: MySQL connection → PostgreSQL connection pool
- **Data Types**: Enhanced with JSONB, INET, and better array support
- **Performance**: Improved query performance and concurrent connections

### ✅ **Enhanced Features**
- **JSONB Support**: Flexible audit logging with structured data
- **INET Type**: Proper IP address storage and validation
- **Array Support**: Native array handling for permissions and tags
- **Triggers**: Automatic timestamp updates
- **Extensions**: UUID support for better primary keys

### ✅ **Security Improvements**
- **Encrypted API Keys**: AES-256-CBC encryption
- **Audit Logging**: Complete change tracking with JSONB
- **Connection Pooling**: Secure, efficient database connections
- **Environment Variables**: Secure configuration management

## 🗂️ Database Schema

### Tables Created
1. **`sys_config`** - System configuration values
2. **`sys_api_keys`** - Encrypted API key storage
3. **`sys_config_audit`** - Audit log with JSONB data

### Key Features
- **Automatic Timestamps**: Created/updated timestamps with triggers
- **Flexible Data Types**: String, number, boolean, JSON support
- **Encryption Support**: Optional encryption for sensitive config
- **Usage Tracking**: API key usage count and last used timestamps
- **Audit Trail**: Complete change history with IP and user agent

## 🔧 Configuration Management

### Command Line Interface
```bash
# List all configurations
node tools/system-config.js config:list

# Get specific configuration
node tools/system-config.js config:get blog.api_url

# Set configuration (with type)
node tools/system-config.js config:set blog.posts_per_page 20 number

# Set encrypted configuration
node tools/system-config.js config:set secret.key "sensitive-value" string --encrypted

# Set JSON configuration
node tools/system-config.js config:set blog.tags '["tech", "nodejs", "postgresql"]' json
```

### API Key Management
```bash
# Set API key (automatically encrypted)
node tools/system-config.js api-key:set openai "sk-your-openai-key"

# Set API key with description
node tools/system-config.js api-key:set anthropic "your-key" --description "Anthropic Claude API"

# List API keys (keys are hidden)
node tools/system-config.js api-key:list

# Test API key
node tools/system-config.js api-key:test openai
```

### Audit and Monitoring
```bash
# View audit log
node tools/system-config.js audit:log

# View system statistics
node tools/system-config.js stats

# Health check
node tools/system-config.js health
```

## 💻 Programmatic Usage

### Basic Configuration
```javascript
import SystemConfigManager from './api/utils/systemConfig.js';

const config = new SystemConfigManager();

// Get configuration
const apiUrl = await config.getConfig('blog.api_url');
const postsPerPage = await config.getConfig('blog.posts_per_page'); // Returns number
const tags = await config.getConfig('blog.tags'); // Returns array from JSON

// Set configuration
await config.setConfig('blog.title', 'My Blog', 'string');
await config.setConfig('blog.enabled', true, 'boolean');
await config.setConfig('blog.metadata', { author: 'John' }, 'json');
```

### API Key Management
```javascript
// Get API key (automatically decrypted)
const openaiKey = await config.getApiKey('openai');

// Set API key (automatically encrypted)
await config.setApiKey('openai', 'sk-your-key', 'OpenAI API Key');

// Validate API key
const validation = await config.validateApiKey(someKey);
if (validation.valid) {
  console.log('Valid key for service:', validation.serviceName);
}
```

### Advanced Features
```javascript
// Get all configurations
const allConfigs = await config.getAllConfigs();

// Get system statistics
const stats = await config.getStats();

// Get audit log
const auditLog = await config.getAuditLog(50, 0); // 50 entries, offset 0

// Test connection
const connectionTest = await config.testConnection();
```

## 🔐 Security Features

### Encryption
- **API Keys**: Automatically encrypted with AES-256-CBC
- **Sensitive Config**: Optional encryption for configuration values
- **Secure Keys**: 32-byte encryption keys from environment variables

### Audit Logging
- **Complete History**: All changes tracked with timestamps
- **User Context**: IP address and user agent logging
- **Structured Data**: JSONB format for flexible audit queries
- **Access Tracking**: API key usage and access logging

### Database Security
- **Connection Pooling**: Efficient and secure connections
- **SSL Support**: Optional SSL/TLS encryption
- **User Management**: Dedicated database users with limited permissions
- **Environment Variables**: Secure credential management

## 🐳 Docker Development

### Start PostgreSQL
```bash
# Start PostgreSQL only
docker compose -f docker-compose.postgresql.yml up -d postgres

# Start with pgAdmin (optional)
docker compose -f docker-compose.postgresql.yml --profile admin up -d
```

### Database Access
```bash
# Connect to database
docker exec -it blog-postgres psql -U postgres -d blog

# View logs
docker compose -f docker-compose.postgresql.yml logs postgres

# Stop services
docker compose -f docker-compose.postgresql.yml down
```

### pgAdmin Access
- **URL**: http://localhost:8080
- **Email**: admin@blog.local
- **Password**: adminpassword

## 🔧 Environment Variables

Create a `.env.local` file:
```bash
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blog
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false

# Configuration encryption key (32 characters)
CONFIG_ENCRYPTION_KEY=your_32_character_encryption_key_here

# Blog API Configuration
BLOG_API_URL=https://bapi.ingasti.com
BLOG_USER_ID=1
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Test database connection
node test-postgresql.js

# Check system health
node tools/system-config.js health

# View system statistics
node tools/system-config.js stats
```

### Backup and Recovery
```bash
# Create backup
docker exec blog-postgres pg_dump -U postgres -d blog > backup.sql

# Restore backup
docker exec -i blog-postgres psql -U postgres -d blog < backup.sql
```

### Performance Monitoring
```sql
-- Check connection pool status
SELECT * FROM pg_stat_activity WHERE datname = 'blog';

-- View table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

## 🚨 Troubleshooting

### Common Issues

**Connection Failed**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs blog-postgres

# Test connection
psql -h localhost -p 5432 -U postgres -d blog -c "SELECT 1;"
```

**Permission Denied**
```bash
# Check database permissions
docker exec -it blog-postgres psql -U postgres -d blog -c "\du"

# Grant permissions
docker exec -it blog-postgres psql -U postgres -d blog -c "GRANT ALL PRIVILEGES ON DATABASE blog TO postgres;"
```

**Migration Issues**
```bash
# Check if tables exist
docker exec -it blog-postgres psql -U postgres -d blog -c "\dt sys_*"

# Recreate tables
docker exec -it blog-postgres psql -U postgres -d blog -f database/system_config_schema_postgresql.sql
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg (Node.js driver) Documentation](https://node-postgres.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

## 🎯 Next Steps

1. **Test the System**: Run `node test-postgresql.js`
2. **Configure API Keys**: Add your OpenAI, Anthropic, etc. keys
3. **Set Configuration**: Update blog settings and system config
4. **Start Development**: Run `pnpm dev` to start your application
5. **Monitor**: Use pgAdmin or command-line tools to monitor performance

---

**🎉 Your blog system is now powered by PostgreSQL!** Enjoy the enhanced performance, reliability, and advanced features that PostgreSQL provides.
