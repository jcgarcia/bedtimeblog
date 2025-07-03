---
title: "Jenkins Docker Pipeline Setup for Blog Project"
date: 2025-06-27
tags: [jenkins, docker, ci/cd, blog, containerization, automation]
categories: [Tech, DevOps, Documentation]
description: "Complete setup guide and reference for Jenkins pipeline with Docker containerization for the blog project"
---

# Jenkins Docker Pipeline Setup for Blog Project

This document provides a comprehensive reference for the Jenkins pipeline and Docker containerization setup for the blog project. Use this as a quick reference whenever you need to understand or troubleshoot the CI/CD pipeline.

## 📋 **Quick Reference**

### **🚀 Jenkins Job Setup**
**Need to create the Jenkins task/job?** → Jump to [⚙️ Jenkins Job Configuration](#️-jenkins-job-configuration) section for complete step-by-step instructions.

### **Project Structure**
```
Tech/Blog/code/
├── api/                    # Node.js Express backend
│   ├── Dockerfile         # Backend container configuration
│   ├── package.json       # Backend dependencies
│   └── index.js           # Main backend entry point
├── client/                # React Vite frontend
│   ├── Dockerfile         # Frontend container configuration
│   ├── nginx.conf         # Nginx configuration for production
│   └── package.json       # Frontend dependencies
├── docker-compose.yml     # Multi-container orchestration
├── Jenkinsfile           # CI/CD pipeline definition
└── README.md
```

### **Port Mapping Strategy**
| Environment | Frontend | Backend | Purpose |
|-------------|----------|---------|---------|
| Docker Compose | 3000:80 | 5000:5000 | Integration testing |
| Individual Tests | 3001:80 | 5001:5000 | Isolated container testing |
| Production | 3000:80 | 5000:5000 | Live deployment |

---

## 🚀 **Jenkins Pipeline Overview**

### **Pipeline Stages**
1. **Checkout** - Pull latest code from repository
2. **Build & Test (Docker Compose)** - Test both containers together
3. **Health Check (Docker Compose)** - Verify services are responding
4. **Build Individual Docker Images** - Create separate container images
5. **Test Individual Containers** - Test containers in isolation
6. **Push to GitHub Container Registry** - Store images for deployment (main/master only)
7. **Deploy Production Containers** - Deploy live containers (main/master only)

### **Branch Strategy**
- **All Branches**: Build and test with Docker Compose + individual containers
- **Main/Master Only**: Deploy to production + push to GitHub Container Registry
- **Feature Branches**: Testing only, no deployment

---

## 🔧 **Required Jenkins Credentials**

Configure these in Jenkins → Manage Jenkins → Manage Credentials:

| Credential ID | Type | Description | Example |
|---------------|------|-------------|---------|
| `database-url` | Secret Text | Aiven MySQL connection string | `mysql://user:pass@host:port/db` |
| `jwt-secret` | Secret Text | JWT authentication secret | `your-secure-jwt-secret` |
| `github-user` | Secret Text | GitHub username | `yourusername` |
| `github-token` | Secret Text | GitHub personal access token | `ghp_xxxxxxxxxxxx` |

### **Setting Up Credentials**
1. Go to Jenkins Dashboard → Manage Jenkins → Manage Credentials
2. Select "Global" domain
3. Click "Add Credentials"
4. Choose "Secret text" as Kind
5. Enter the secret value and ID
6. Save and repeat for each credential

---

## 🐳 **Docker Configuration Details**

### **Backend Container (api/)**
```dockerfile
# Key features:
- Node.js 20 Alpine base image
- pnpm package manager
- curl installed for health checks
- Non-root user for security
- Health check endpoint: /health
- Production optimized dependencies
```

### **Frontend Container (client/)**
```dockerfile
# Key features:
- Multi-stage build (Node.js + Nginx)
- Vite build system
- Nginx Alpine for production serving
- Static file serving optimization
- Gzip compression enabled
- Security headers configured
```

### **Docker Compose Configuration**
```yaml
# Key features:
- Service dependency management (frontend waits for backend)
- Environment variable injection from Jenkins
- Health checks with retry logic
- CORS configuration for local development
- Proper port mapping for testing
```

---

## 🌐 **Environment Variables**

### **Backend Environment Variables**
- `DATABASE_URL` - MySQL connection string (from Jenkins credentials)
- `JWT_SECRET` - JWT signing secret (from Jenkins credentials)
- `CORS_ORIGIN` - Frontend URL for CORS (set by pipeline)
- `NODE_ENV` - Set to "production"
- `PORT` - Backend port (5000)

### **Frontend Environment Variables**
- `NEXT_PUBLIC_API_URL` - Backend API URL (set by pipeline)

### **Pipeline Environment Variables**
- `COMPOSE_PROJECT_NAME` - Unique project name per build
- `IMAGE_TAG` - Unique tag: branch-buildnumber-commithash
- `REGISTRY` - GitHub Container Registry URL

---

## 🏥 **Health Check Endpoints**

### **Backend Health Checks**
- **Primary**: `GET /health` - Detailed health status with uptime
- **Fallback**: `GET /` - Basic API availability check
- **Response**: JSON with status, timestamp, and uptime

### **Frontend Health Checks**
- **Endpoint**: `GET /` (served by Nginx)
- **Content**: HTML content verification
- **Nginx**: Serves static React build from `/usr/share/nginx/html`

---

## 🔍 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Pipeline Fails at Docker Compose Stage**
```bash
# Check Jenkins credentials are properly set
# Verify DATABASE_URL format: mysql://user:pass@host:port/database
# Ensure JWT_SECRET is properly configured
```

#### **Health Checks Fail**
```bash
# Backend not responding:
docker logs <container-name>  # Check backend logs
curl http://localhost:5000/health  # Test health endpoint manually

# Frontend HTTP not responding:
docker logs <container-name>  # Check nginx logs
curl http://localhost:3000  # Test frontend HTTP manually

# Frontend HTTPS not responding:
curl -k https://localhost:443  # Test HTTPS manually (ignore cert warnings for localhost)
docker exec <container-name> ls -la /etc/ssl/certs/  # Verify certificates are mounted
```

#### **SSL Certificate Issues**
```bash
# Verify certificates exist on host:
sudo ls -la /etc/letsencrypt/live/ingasti.com/

# Check certificate validity:
sudo openssl x509 -in /etc/letsencrypt/live/ingasti.com/fullchain.pem -text -noout

# Test certificate mounting in container:
docker exec blog-frontend-prod ls -la /etc/ssl/certs/
docker exec blog-frontend-prod ls -la /etc/ssl/private/

# Check nginx configuration in container:
docker exec blog-frontend-prod nginx -t
```

#### **CORS and Domain Issues**
```bash
# Check CORS configuration:
curl -H "Origin: https://blog.ingasti.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://bapi.ingasti.com/

# Verify environment variables in containers:
docker exec blog-backend-prod env | grep CORS
docker exec blog-frontend-prod env | grep API_URL
```

#### **Host Nginx Proxy Issues**
```bash
# Test host nginx configuration:
sudo nginx -t

# Check nginx error logs:
sudo tail -f /var/log/nginx/error.log

# Verify nginx sites are enabled:
sudo ls -la /etc/nginx/sites-enabled/

# Test proxy functionality:
curl -H "Host: blog.ingasti.com" http://localhost:3000
curl -H "Host: bapi.ingasti.com" http://localhost:5000
```

#### **Container Build Failures**
```bash
# Backend build issues:
cd api && pnpm install  # Test dependency installation
docker build -t test-backend -f api/Dockerfile ./api

# Frontend build issues:
cd client && pnpm install && pnpm build  # Test build process
docker build -t test-frontend -f client/Dockerfile ./client

# SSL certificate mounting issues:
docker run --rm -v /etc/letsencrypt/live/ingasti.com:/test alpine ls -la /test
```

#### **Database Connection Issues**
```bash
# Verify DATABASE_URL format and credentials
# Check Aiven MySQL instance is accessible
# Ensure firewall allows connections from your Jenkins server
# Test database connection from container:
docker exec blog-backend-prod node -e "console.log(process.env.DATABASE_URL)"
```

---

## 📊 **Pipeline Success Indicators**

### **Successful Pipeline Output**
```
✅ Docker Compose health checks passed!
✅ Individual container tests passed!
✅ Images pushed to GitHub Container Registry!
✅ Production containers deployed!
🌐 Access your blog at http://localhost:3000
```

### **What Gets Deployed**
- **Frontend**: React app served by Nginx on port 3000
- **Backend**: Node.js API on port 5000
- **Containers**: Named `blog-frontend-prod` and `blog-backend-prod`
- **Registry**: Images pushed to `ghcr.io/yourusername/your-blog-repo`

---

## ⚙️ **Jenkins Job Configuration**

### **Step 1: Prerequisites**
Before creating the Jenkins job, ensure:
- Jenkins is installed and running
- Required plugins are installed:
  - Pipeline plugin
  - Multibranch Pipeline plugin
  - GitHub plugin
  - Credentials Binding plugin
  - Docker Pipeline plugin (optional but recommended)
- Jenkins user has Docker permissions: `sudo usermod -aG docker jenkins`
- Docker and Docker Compose are installed on the Jenkins server

### **Step 2: Create Multibranch Pipeline Job**

#### **2.1 Create New Job**
1. Go to Jenkins Dashboard
2. Click **"New Item"**
3. Enter job name: `blog-docker-pipeline` (or your preferred name)
4. Select **"Multibranch Pipeline"**
5. Click **"OK"**

#### **2.2 Configure Branch Sources**
1. In the job configuration, under **"Branch Sources"**:
   - Click **"Add source"** → **"Git"**
   - **Project Repository**: Enter your repository URL
     ```
     https://github.com/yourusername/your-blog-repo.git
     ```
   - **Credentials**: Select your GitHub credentials (see Step 3 below)
   - **Behaviors**: Add **"Discover branches"** → **"All branches"**

#### **2.3 Build Configuration**
1. **Script Path**: Leave as `Jenkinsfile` (default)
2. **Scan Multibranch Pipeline Triggers**:
   - Check **"Periodically if not otherwise run"**
   - Set interval: `1 minute` or `5 minutes`

#### **2.4 Property Strategy** (Optional)
- Select **"All branches get the same properties"** for consistent behavior

### **Step 3: Configure GitHub Credentials**

#### **3.1 Create GitHub Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click **"Generate new token (classic)"**
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `write:packages` (Upload packages to GitHub Package Registry)
   - `read:packages` (Download packages from GitHub Package Registry)
4. Copy the generated token

#### **3.2 Add GitHub Credentials to Jenkins**
1. Jenkins Dashboard → **Manage Jenkins** → **Manage Credentials**
2. Select **"Global"** domain
3. Click **"Add Credentials"**
4. Configure:
   - **Kind**: Username with password
   - **Username**: Your GitHub username
   - **Password**: The personal access token from step 3.1
   - **ID**: `github-credentials`
   - **Description**: `GitHub access for blog pipeline`

### **Step 4: Configure Database and Application Secrets**

#### **4.1 Database URL Credential**
1. **Add Credentials** → **Secret text**
2. **Secret**: Your Aiven MySQL connection string
   ```
   mysql://username:password@host:port/database_name
   ```
3. **ID**: `database-url`
4. **Description**: `Aiven MySQL connection string`

#### **4.2 JWT Secret Credential**
1. **Add Credentials** → **Secret text**
2. **Secret**: Your JWT secret (generate a secure random string)
   ```bash
   # Generate a secure JWT secret:
   openssl rand -base64 32
   ```
3. **ID**: `jwt-secret`
4. **Description**: `JWT signing secret`

#### **4.3 GitHub Container Registry Credentials**
1. **Add Credentials** → **Secret text**
2. **Secret**: Your GitHub username
3. **ID**: `github-user`
4. **Description**: `GitHub username for container registry`

5. **Add Credentials** → **Secret text**
6. **Secret**: Same GitHub personal access token from step 3.1
7. **ID**: `github-token`
8. **Description**: `GitHub token for container registry`

### **Step 5: Configure Webhooks (Optional but Recommended)**

#### **5.1 Get Jenkins Webhook URL**
Your Jenkins webhook URL format:
```
http://your-jenkins-server:8080/github-webhook/
```

#### **5.2 Configure GitHub Webhook**
1. Go to your GitHub repository
2. Settings → **Webhooks**
3. Click **"Add webhook"**
4. Configure:
   - **Payload URL**: `http://your-jenkins-server:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Which events**: Select **"Just the push event"**
   - **Active**: ✅ Checked
5. Click **"Add webhook"**

### **Step 6: Update Registry URL in Jenkinsfile**

Before running the pipeline, update the registry URL in your Jenkinsfile:

```groovy
// In /home/jcgarcia/docs/Tech/Blog/code/Jenkinsfile
// Change this line:
REGISTRY = 'ghcr.io/yourusername/your-blog-repo'

// To your actual GitHub username and repository:
REGISTRY = 'ghcr.io/your-actual-username/your-actual-repo-name'
```

### **Step 7: Test the Configuration**

#### **7.1 Manual Pipeline Trigger**
1. Go to your Jenkins job
2. Click **"Scan Multibranch Pipeline Now"**
3. Jenkins should discover your branches and start building

#### **7.2 Verify Credentials**
1. Check the build console output for any credential-related errors
2. Ensure all environment variables are properly injected

#### **7.3 First Build Checklist**
- [ ] Pipeline discovers all branches
- [ ] Credentials are properly loaded
- [ ] Docker commands execute without permission errors
- [ ] Containers build successfully
- [ ] Health checks pass
- [ ] Images push to GitHub Container Registry (for main/master)

### **Step 8: Job Configuration Summary**

#### **Final Job Configuration Overview**
```yaml
Job Type: Multibranch Pipeline
Branch Source: Git (GitHub repository)
Credentials: github-credentials
Script Path: Jenkinsfile
Scan Triggers: Periodically (1-5 minutes)
Build Triggers: GitHub webhook (optional)
```

#### **Required Credentials Summary**
| Credential ID | Type | Purpose | Value Example |
|---------------|------|---------|---------------|
| `github-credentials` | Username/Password | Repository access | username + token |
| `database-url` | Secret Text | Database connection | `mysql://user:pass@host:port/db` |
| `jwt-secret` | Secret Text | JWT signing | Random base64 string |
| `github-user` | Secret Text | Container registry | GitHub username |
| `github-token` | Secret Text | Container registry | GitHub token |

### **Step 9: Monitoring and Maintenance**

#### **9.1 Monitor First Builds**
1. Watch console output for each stage
2. Verify containers start successfully
3. Check health check endpoints manually:
   ```bash
   curl http://your-jenkins-server:3000  # Frontend
   curl http://your-jenkins-server:5000  # Backend
   curl http://your-jenkins-server:5000/health  # Backend health
   ```

#### **9.2 Common First-Run Issues**
- **Docker permission denied**: Add jenkins user to docker group
- **Credential not found**: Check credential IDs match Jenkinsfile
- **Port conflicts**: Ensure ports 3000, 3001, 5000, 5001 are available
- **GitHub registry push fails**: Verify token has package write permissions

---

## 🔒 **HTTPS and SSL Certificate Configuration**

### **SSL Certificate Setup**
Your blog project is configured to use HTTPS with the existing Let's Encrypt wildcard certificate for `ingasti.com`.

#### **Certificate Location**
```bash
# Certificate files on the server:
/etc/letsencrypt/live/ingasti.com/fullchain.pem  # Full certificate chain
/etc/letsencrypt/live/ingasti.com/privkey.pem    # Private key
```

#### **Domain Configuration**
- **Frontend**: `https://blog.ingasti.com` (port 443)
- **Backend API**: `https://bapi.ingasti.com` (port 443, proxied to container port 5000)

### **Container SSL Configuration**

#### **Frontend Container (client/)**
- **HTTP Port**: 80 (redirects to HTTPS)
- **HTTPS Port**: 443 (with SSL termination)
- **SSL Certificates**: Mounted from host `/etc/letsencrypt/live/ingasti.com/`
- **Docker Compose HTTPS Port**: 3443 (for testing)
- **Production HTTPS Port**: 443 (mapped from container)

#### **Backend Container (api/)**
- **Container Port**: 5000 (HTTP only)
- **SSL Termination**: Handled by host Nginx reverse proxy
- **CORS Origins**: Configured for `https://blog.ingasti.com`

### **Port Mapping with HTTPS**
| Environment | Frontend HTTP | Frontend HTTPS | Backend | Purpose |
|-------------|---------------|----------------|---------|---------|
| Docker Compose | 3000:80 | 3443:443 | 5000:5000 | Integration testing |
| Individual Tests | 3001:80 | 3444:443 | 5001:5000 | Isolated testing |
| Production | 3000:80 | 443:443 | 5000:5000 | Live deployment |

### **Host Nginx Configuration**

#### **Setup Required on Host Server**
1. **Create Nginx configurations for both domains**:
   ```bash
   # Copy the provided configurations
   sudo cp nginx-frontend-proxy.conf /etc/nginx/sites-available/blog.ingasti.com
   sudo cp nginx-backend-proxy.conf /etc/nginx/sites-available/bapi.ingasti.com
   
   # Enable the sites
   sudo ln -s /etc/nginx/sites-available/blog.ingasti.com /etc/nginx/sites-enabled/
   sudo ln -s /etc/nginx/sites-available/bapi.ingasti.com /etc/nginx/sites-enabled/
   
   # Test and reload Nginx
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **DNS Configuration**:
   - `blog.ingasti.com` → Your server IP
   - `bapi.ingasti.com` → Your server IP

#### **Nginx Proxy Features**
- **HTTPS Redirection**: All HTTP traffic redirected to HTTPS
- **SSL Termination**: SSL handled by host Nginx, not containers
- **Security Headers**: HSTS, CSP, and other security headers
- **CORS Support**: Proper CORS headers for API requests

### **Environment Variables for HTTPS**
```groovy
// In Jenkinsfile - Production Environment Variables
CORS_ORIGIN = 'https://blog.ingasti.com'
NEXT_PUBLIC_API_URL = 'https://bapi.ingasti.com'
```

### **SSL Certificate Renewal**
```bash
# Let's Encrypt certificates are auto-renewed
# Verify renewal works:
sudo certbot renew --dry-run

# After renewal, restart containers to reload certificates:
docker restart blog-frontend-prod
```

---

## ✅ **What's Been Updated for HTTPS Support**

This section summarizes all the changes made to enable HTTPS with SSL certificates for the blog project.

### **1. Frontend Container (client/)**
- **Nginx Configuration**: Updated `client/nginx.conf` to serve HTTPS on port 443 with HTTP→HTTPS redirect
- **SSL Certificate Mounting**: Containers now mount your Let's Encrypt certificates from `/etc/letsencrypt/live/ingasti.com/`
- **Security Headers**: Enhanced security headers including HSTS, CSP, and improved CORS policies
- **Port Exposure**: Both HTTP (80) and HTTPS (443) ports exposed in Dockerfile
- **Docker Volumes**: SSL certificate directories created and mounted properly

### **2. Backend Container (api/)**
- **CORS Configuration**: Updated `api/index.js` to allow multiple origins including `https://blog.ingasti.com`
- **Multiple Origins Support**: Handles both production HTTPS and development HTTP domains
- **Environment Variables**: Production configuration uses HTTPS URLs by default
- **SSL Compatibility**: Backend remains HTTP but works behind HTTPS proxy

### **3. Jenkins Pipeline Updates**
- **HTTPS Health Checks**: Pipeline now tests both HTTP and HTTPS endpoints during deployment
- **SSL Certificate Mounting**: Production containers automatically mount real Let's Encrypt certificates
- **Domain Configuration**: Uses production domains (`blog.ingasti.com`, `bapi.ingasti.com`) instead of localhost
- **Environment Variables**: Updated `CORS_ORIGIN` and `NEXT_PUBLIC_API_URL` for HTTPS
- **Enhanced Testing**: Separate test ports for HTTPS (3444, 3443) during CI/CD
- **Production Deployment**: HTTPS-enabled containers for main/master branch deployments

### **4. Docker Compose Configuration**
- **SSL Volume Mounts**: Automatically mounts certificates from `/etc/letsencrypt/live/ingasti.com/`
- **HTTPS Port Mapping**: Added port 3443 for HTTPS testing in compose environment
- **Environment Variables**: Updated default API URLs to use HTTPS (`https://bapi.ingasti.com`)
- **Health Check Updates**: Modified to test both HTTP and HTTPS endpoints
- **Service Dependencies**: Maintained proper startup order with SSL support

### **5. Host Nginx Reverse Proxy**
- **Frontend Proxy**: Created `nginx-frontend-proxy.conf` for `blog.ingasti.com`
- **Backend Proxy**: Created `nginx-backend-proxy.conf` for `bapi.ingasti.com`
- **SSL Termination**: Host Nginx handles HTTPS termination and proxies to containers
- **CORS Headers**: Proper CORS configuration at proxy level for API requests
- **Security Configuration**: Modern SSL/TLS configuration with security headers
- **HTTP Redirect**: Automatic HTTP to HTTPS redirection for both domains

### **6. New Files and Scripts**
- **`nginx-frontend-proxy.conf`**: Host Nginx configuration for frontend domain
- **`nginx-backend-proxy.conf`**: Host Nginx configuration for backend API domain
- **`setup-nginx-ssl.sh`**: Automated script to configure host Nginx with HTTPS
- **Enhanced Documentation**: Updated `JENKINS_DOCKER_SETUP.md` with HTTPS sections

### **7. Security Enhancements**
- **HSTS Headers**: Strict Transport Security enabled for both domains
- **Enhanced CSP**: Content Security Policy updated for HTTPS resources
- **Certificate Management**: Automatic mounting and renewal support
- **CORS Security**: Restricted origins to production domains only
- **SSL/TLS Configuration**: Modern cipher suites and protocols (TLSv1.2, TLSv1.3)

### **8. Domain and URL Updates**
- **Frontend Domain**: `https://blog.ingasti.com` (production)
- **Backend Domain**: `https://bapi.ingasti.com` (production)
- **API Endpoints**: All frontend API calls now use HTTPS backend URL
- **Environment Variables**: Production values updated throughout pipeline
- **Testing URLs**: Separate HTTPS testing ports for CI/CD validation

### **9. Port Configuration Changes**
| Component | Before | After | Purpose |
|-----------|--------|-------|---------|
| Frontend Production | 3000:80 | 3000:80, 443:443 | HTTP + HTTPS |
| Frontend Testing | 3001:80 | 3001:80, 3444:443 | HTTP + HTTPS |
| Frontend Compose | 3000:80 | 3000:80, 3443:443 | HTTP + HTTPS |
| Backend | 5000:5000 | 5000:5000 (unchanged) | HTTP (behind HTTPS proxy) |

### **10. Certificate Integration**
- **Certificate Path**: `/etc/letsencrypt/live/ingasti.com/fullchain.pem`
- **Private Key Path**: `/etc/letsencrypt/live/ingasti.com/privkey.pem`
- **Mount Points**: Containers mount certificates as read-only volumes
- **Renewal Support**: Certificates automatically available after Let's Encrypt renewal
- **Validation**: Pipeline includes certificate validation steps

---

## 🎨 **Architecture Diagram Reference**

The blog project includes a comprehensive architecture diagram (`blog-architecture.drawio`) that visualizes the complete system infrastructure and data flows.

### **📊 Architecture Diagram Features**

#### **Complete System Overview:**
- **User Traffic Flow**: From internet users through DNS to your cloud server
- **HTTPS Setup**: SSL certificate integration and reverse proxy configuration
- **Container Architecture**: Frontend and backend Docker containers
- **CI/CD Pipeline**: Jenkins integration with GitHub
- **Database Connection**: Aiven MySQL cloud database

#### **🏗️ Key Components Illustrated:**

##### **1. External Components:**
- 🌐 Internet Users
- 🔍 DNS (blog.ingasti.com, bapi.ingasti.com)
- 🗄️ Aiven MySQL (Cloud Database)
- 📚 GitHub Repository

##### **2. Cloud Server Infrastructure:**
- 🔐 Let's Encrypt SSL Certificates
- 🔀 Host Nginx Reverse Proxy (SSL Termination)
- 🔧 Jenkins CI/CD (Port 8080)
- 🐳 Docker Engine
- 🏗️ Docker Compose

##### **3. Container Layer:**
- 🌐 **Frontend Container**: React + Vite + Nginx Alpine
- 🔧 **Backend Container**: Node.js + Express API
- **Port Mappings**: Clear visualization of all ports
- **SSL Certificate Mounting**: Volume mounts shown

##### **4. Data Flow Arrows:**
- HTTPS requests routing
- SSL certificate usage
- Container orchestration
- API communication
- Database connections
- CI/CD pipeline flows

#### **📋 Interactive Elements:**
- **Color-coded Components**: Different colors for different types of services
- **Port Labels**: Clear port numbering (80, 443, 3000, 5000, 8080)
- **Environment Indicators**: Production, Development, CI/CD
- **Comprehensive Legend**: Explains all symbols and flows
- **Volume Mounts**: Dashed lines showing SSL certificate mounting

### **🔧 How to Use the Diagram:**

#### **1. Access the Diagram:**
```bash
# File location:
/home/jcgarcia/docs/Tech/Blog/code/blog-architecture.drawio

# Open online at:
https://app.diagrams.net/
# Then: File > Open > Select the .drawio file
```

#### **2. Edit and Customize:**
- Modify components as your architecture evolves
- Add new containers or services
- Update port mappings
- Adjust colors and styling
- Add new data flows or connections

#### **3. Export Options:**
- **PNG/JPEG**: For documentation and presentations
- **PDF**: For formal documentation
- **SVG**: For web integration
- **Embed**: In markdown files or wikis

### **📝 Architecture Flow Highlights:**

#### **Security Flow:**
```
Internet → DNS → Host Nginx (SSL Termination) → Docker Containers
```

#### **Container Communication:**
```
Frontend Container ↔ Backend Container ↔ Aiven MySQL
```

#### **CI/CD Flow:**
```
GitHub → Jenkins → Docker Engine → Container Deployment
```

#### **SSL Certificate Chain:**
```
Let's Encrypt → Host Nginx → Frontend Container (Volume Mount)
```

### **🎯 Diagram Use Cases:**

#### **Team Onboarding:**
- Visual overview of complete system
- Understanding component relationships
- Learning data flow patterns
- Identifying security boundaries

#### **Troubleshooting:**
- Trace request paths through system
- Identify potential failure points
- Understand SSL/TLS termination
- Debug container connectivity

#### **Infrastructure Planning:**
- Planning system upgrades
- Adding new components
- Scaling considerations
- Security assessments

#### **Documentation and Presentations:**
- Stakeholder presentations
- Technical documentation
- System design reviews
- Compliance documentation

### **📐 Diagram Components Legend:**
| Symbol | Meaning | Color Code |
|--------|---------|------------|
| 🌐 | User-facing components | Light Blue |
| 🔐 | Security/SSL components | Yellow |
| 🔀 | Proxy/Load balancing | Green |
| 🐳 | Docker/Container components | Blue |
| 🔧 | Backend/API services | Purple |
| 🗄️ | Database services | Yellow |
| 📚 | Version control/Repository | Red |

### **🔄 Diagram Maintenance:**

#### **Regular Updates:**
- **After Infrastructure Changes**: Update components and connections
- **New Services Added**: Include new containers or services
- **Port Changes**: Update port mappings and labels
- **Security Updates**: Reflect SSL/TLS configuration changes

#### **Version Control:**
- Keep diagram in sync with code changes
- Document major architectural decisions
- Tag diagram versions with releases
- Maintain change history in commit messages

---
