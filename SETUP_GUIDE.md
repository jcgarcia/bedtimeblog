# Blog Cloud Server Setup Guide

This guide will help you deploy the blog application to your cloud server using Docker and Kubernetes, following the same successful pattern as the Ingasti website.

## 🏗️ Overview

### What We're Building
- **Frontend**: React/Vite app at `blog.ingasti.com`
- **Backend**: Node.js/Express API at `bapi.ingasti.com`
- **Database**: External Aiven MySQL (already configured)
- **Infrastructure**: Kubernetes with Docker registry (same as Ingasti)

### Key Features
- Separate containers for frontend and backend
- Health checks and monitoring
- Rolling deployments with zero downtime
- Local Docker registry for image storage
- Jenkins CI/CD pipeline

## 📋 Prerequisites

1. **Cloud server** with Kubernetes cluster running (same server as Ingasti)
2. **Jenkins** installed and configured
3. **Local Docker registry** running on `localhost:5000`
4. **DNS records** configured for `blog.ingasti.com` and `bapi.ingasti.com`
5. **SSL certificates** (using existing Let's Encrypt setup)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare the Environment

**On your cloud server**, ensure the local registry is running:
```bash
# Check if registry is running
curl http://localhost:5000/v2/_catalog

# If not running, start it:
docker run -d -p 5000:5000 --name registry --restart=always registry:2
```

### Step 2: Configure DNS Records

Add these DNS records to your domain:
```
blog.ingasti.com    A    <your-cloud-server-ip>
bapi.ingasti.com    A    <your-cloud-server-ip>
```

### Step 3: Update Reverse Proxy

Add these server blocks to your nginx configuration:

```nginx
# Frontend (blog.ingasti.com)
server {
    listen 443 ssl http2;
    server_name blog.ingasti.com;
    
    ssl_certificate /etc/letsencrypt/live/ingasti.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ingasti.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend (bapi.ingasti.com)  
server {
    listen 443 ssl http2;
    server_name bapi.ingasti.com;
    
    ssl_certificate /etc/letsencrypt/live/ingasti.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ingasti.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Step 4: Set Up Jenkins Credentials

In Jenkins, add these credentials:
1. Go to **Manage Jenkins > Manage Credentials**
2. Add **Secret Text** credentials:
   - ID: `blog-database-url`
   - Secret: Your Aiven MySQL connection string
   - ID: `blog-jwt-secret`
   - Secret: Your JWT secret key

### Step 5: Create Jenkins Pipeline

1. Create a new **Multibranch Pipeline** in Jenkins
2. Name it `Blog-Kubernetes-Pipeline`
3. Point it to your blog repository
4. Use the `Jenkinsfile.k8s` pipeline configuration

### Step 6: Update Kubernetes Secrets

**On your cloud server**, update the secrets in `k8s/namespace.yaml`:

```bash
# Encode your database URL
echo -n "your-actual-database-url" | base64

# Encode your JWT secret
echo -n "your-actual-jwt-secret" | base64

# Update the namespace.yaml file with the encoded values
```

## 🧪 Testing Deployment

### Option 1: Jenkins Pipeline (Recommended)
1. Trigger the Jenkins pipeline
2. Monitor the build progress
3. Check the deployment status

### Option 2: Manual Build and Deploy
```bash
# Clone your repository to the cloud server
git clone <your-blog-repo> blog-deployment
cd blog-deployment

# Build and push images
./build-and-push.sh

# Deploy to Kubernetes
cd k8s && ./deploy.sh latest

# Check deployment status
./health-check.sh
```

### Option 3: Docker Compose Testing
```bash
# Set environment variables
export DATABASE_URL="your-database-url"
export JWT_SECRET="your-jwt-secret"
export CORS_ORIGIN="https://blog.ingasti.com"
export VITE_API_URL="https://bapi.ingasti.com"

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔍 Verification

### Health Checks
```bash
# External health checks
curl https://blog.ingasti.com/health
curl https://bapi.ingasti.com/health

# Internal Kubernetes checks
kubectl get pods -n blog
kubectl get services -n blog
kubectl get ingress -n blog
```

### Service Status
```bash
# Check running services
kubectl get all -n blog

# Check pod logs
kubectl logs -f deployment/blog-backend -n blog
kubectl logs -f deployment/blog-frontend -n blog
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Images Not Found
```bash
# Check if images exist in registry
curl http://localhost:5000/v2/blog-frontend/tags/list
curl http://localhost:5000/v2/blog-backend/tags/list

# If missing, rebuild and push
./build-and-push.sh
```

#### 2. Pod Not Starting
```bash
# Check pod events
kubectl describe pods -n blog

# Check logs
kubectl logs -n blog -l app=blog-backend
kubectl logs -n blog -l app=blog-frontend
```

#### 3. Database Connection Issues
```bash
# Test database connection from a pod
kubectl run db-test --image=mysql:8 --rm -i --restart=Never -- \
  mysql -h your-db-host -u your-username -p your-database -e "SELECT 1"
```

#### 4. CORS Issues
- Ensure `CORS_ORIGIN` environment variable is set correctly
- Check that frontend is using the correct API URL
- Verify reverse proxy configuration

### Debug Commands
```bash
# Full health check
./health-check.sh

# Kubernetes debugging
kubectl get events -n blog --sort-by=.metadata.creationTimestamp
kubectl describe ingress -n blog
kubectl get endpoints -n blog

# Docker debugging
docker ps | grep blog
docker logs <container-id>
```

## 📊 Monitoring

### Kubernetes Resources
```bash
# Monitor pods
kubectl get pods -n blog -w

# Monitor deployments
kubectl get deployments -n blog -w

# Check resource usage
kubectl top pods -n blog
```

### Application Logs
```bash
# Stream backend logs
kubectl logs -f deployment/blog-backend -n blog

# Stream frontend logs  
kubectl logs -f deployment/blog-frontend -n blog

# Get recent events
kubectl get events -n blog --sort-by=.metadata.creationTimestamp | tail -20
```

## 🎉 Success Indicators

When everything is working correctly:

1. ✅ **External URLs responding**: `https://blog.ingasti.com` and `https://bapi.ingasti.com`
2. ✅ **Health checks passing**: Both `/health` endpoints return 200
3. ✅ **Pods running**: All pods in `blog` namespace are `Running`
4. ✅ **Services accessible**: Internal service communication working
5. ✅ **SSL certificates**: HTTPS working without errors
6. ✅ **Database connectivity**: Backend can connect to Aiven MySQL

## 📚 Next Steps

1. **Set up monitoring** with Prometheus/Grafana
2. **Configure backups** for persistent data
3. **Add more comprehensive tests** to the pipeline
4. **Implement staging environment** for testing
5. **Set up log aggregation** with ELK stack

## 🔗 Related Documentation

- [Ingasti Deployment](../Ingasti/README.md) - Similar deployment pattern
- [Cloud Server Deployment Guide](CLOUD_SERVER_DEPLOYMENT.md) - Detailed technical guide
- [Jenkins Pipeline Guide](Jenkinsfile.k8s) - Pipeline configuration
- [Docker Configuration](docker-compose.prod.yml) - Container setup

---

**Remember**: All deployment operations must be performed on the cloud server, not locally. This ensures consistency and proper access to the Kubernetes cluster and Docker registry.
