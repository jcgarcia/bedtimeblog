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

# Frontend not responding:
docker logs <container-name>  # Check nginx logs
curl http://localhost:3000  # Test frontend manually
```

#### **Container Build Failures**
```bash
# Backend build issues:
cd api && pnpm install  # Test dependency installation
docker build -t test-backend -f api/Dockerfile ./api

# Frontend build issues:
cd client && pnpm install && pnpm build  # Test build process
docker build -t test-frontend -f client/Dockerfile ./client
```

#### **Database Connection Issues**
```bash
# Verify DATABASE_URL format and credentials
# Check Aiven MySQL instance is accessible
# Ensure firewall allows connections from your Jenkins server
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

## 🛠 **Manual Commands Reference**

### **Local Testing Commands**
```bash
# Start with Docker Compose
cd /home/jcgarcia/docs/Tech/Blog/code
docker compose up --build -d

# Check container status
docker compose ps
docker compose logs

# Stop containers
docker compose down

# Individual container testing
docker build -t blog-backend -f api/Dockerfile ./api
docker build -t blog-frontend -f client/Dockerfile ./client
docker run -d -p 5000:5000 --name test-backend blog-backend
docker run -d -p 3000:80 --name test-frontend blog-frontend
```

### **Production Management Commands**
```bash
# Check production containers
docker ps | grep blog-

# View production logs
docker logs blog-backend-prod
docker logs blog-frontend-prod

# Restart production containers
docker restart blog-backend-prod blog-frontend-prod

# Stop production containers
docker stop blog-backend-prod blog-frontend-prod
docker rm blog-backend-prod blog-frontend-prod
```

---

## 📈 **Pipeline Monitoring**

### **Key Metrics to Monitor**
- Build success rate
- Container startup time
- Health check response time
- Image push duration
- Deployment success rate

### **Log Locations**
- **Jenkins Console**: Full pipeline execution logs
- **Container Logs**: `docker logs <container-name>`
- **Compose Logs**: `docker compose logs`

---

## 🔄 **Maintenance Tasks**

### **Regular Maintenance**
- **Weekly**: Review pipeline success rates
- **Monthly**: Update base Docker images
- **Quarterly**: Review and rotate JWT secrets
- **As Needed**: Update Jenkins credentials

### **Container Cleanup**
```bash
# Remove old test containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune
```

---

## 📞 **Support & References**

### **Documentation Links**
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

### **Quick Access URLs** (when running)
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Backend Health**: http://localhost:5000/health
- **Jenkins Dashboard**: http://your-jenkins-server:8080

---

**Last Updated**: June 27, 2025  
**Pipeline Version**: v2.0  
**Status**: ✅ Production Ready
