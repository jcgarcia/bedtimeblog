# Pre-deployment Checklist for Bedtime Blog Kubernetes

## 🚀 Production Readiness Checklist

### Recent Updates (August 2025)
- ✅ **Admin Panel UI/UX Fixed** - TopBar logout redundancy removed, complete user management system implemented
- ✅ **Security Enhanced** - Complete Argon2 migration for all password operations
- ✅ **User Management** - Professional CRUD interface with real database integration
- 📋 **Build Triggered** - Latest changes pushed to k8s branch (commit: ba45fc4)

### Infrastructure Prerequisites
- [ ] Kubernetes cluster is running and accessible
- [ ] Nginx Ingress Controller is installed and configured
- [ ] cert-manager is installed for SSL certificate management
- [ ] Docker registry is accessible (localhost:5000 or external)
- [ ] Jenkins server has Kubernetes cluster access
- [ ] DNS records are configured for domains:
  - [ ] blog.ingasti.com → Kubernetes ingress IP
  - [ ] bapi.ingasti.com → Kubernetes ingress IP

### External Services
- [ ] Aiven MySQL database is configured and accessible
- [ ] Database connection string is ready
- [ ] Google OAuth application is configured with correct callback URLs:
  - [ ] https://bapi.ingasti.com/api/auth/google/callback
- [ ] Google OAuth credentials are available

### Security Configuration
- [ ] Strong JWT secret is generated (at least 32 characters)
- [ ] All secrets are base64 encoded for Kubernetes
- [ ] SSL certificates are configured for both domains
- [ ] Network policies are reviewed and appropriate
- [ ] Container security contexts are non-root

### Application Configuration
- [ ] Frontend environment variables are set correctly
- [ ] Backend environment variables are set correctly
- [ ] CORS origins are configured for production domains
- [ ] Upload directories and permissions are configured
- [ ] Health check endpoints are working
- ✅ **Admin Panel Configuration** - User management API endpoints secured with admin middleware
- ✅ **Password Security** - All password operations use Argon2 hashing

### Kubernetes Resources
- [ ] Namespace `blog` is created
- [ ] Secrets are created in `k8s/namespace.yaml`
- [ ] ConfigMaps are configured correctly
- [ ] Persistent volumes are configured (if needed)
- [ ] Network policies are applied
- [ ] Resource limits and requests are appropriate
- [ ] HPA (Horizontal Pod Autoscaler) is configured
- [ ] PDB (Pod Disruption Budget) is configured

### CI/CD Pipeline
- [ ] Jenkins credentials are configured:
  - [ ] `blog-database-url`
  - [ ] `blog-jwt-secret`
- [ ] Jenkins pipeline has access to Kubernetes cluster
- [ ] Docker registry push permissions are configured
- [ ] Pipeline stages are tested individually

### Monitoring and Logging
- [ ] Application logs are accessible via kubectl
- [ ] Health check endpoints respond correctly
- [ ] Performance monitoring is configured
- [ ] Backup strategy is in place

### Testing
- [ ] Docker images build successfully
- [ ] Containers start without errors
- [ ] Health checks pass
- [ ] Frontend can connect to backend
- [ ] Database connections work
- [ ] File uploads work correctly
- [ ] Authentication flow works
- ✅ **Admin Panel Testing** - User management CRUD operations verified
- ✅ **Security Testing** - Argon2 password hashing validated across all tools

### Documentation
- [ ] Production README is updated
- [ ] Environment variables are documented
- [ ] Deployment procedures are documented
- [ ] Troubleshooting guide is available
- [ ] Backup and recovery procedures are documented

## 🔧 Deployment Commands

### Build and Push Images
```bash
# Build backend
cd api
docker build -f Dockerfile.k8s -t localhost:5000/blog-backend:latest .
docker push localhost:5000/blog-backend:latest

# Build frontend
cd ../client
docker build -f Dockerfile.k8s -t localhost:5000/blog-frontend:latest .
docker push localhost:5000/blog-frontend:latest
```

### Deploy to Kubernetes
```bash
# Deploy using script
cd k8s
./deploy.sh

# Or deploy manually
kubectl apply -f namespace.yaml
kubectl apply -f storage.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f network-policy.yaml
```

### Verify Deployment
```bash
# Check pods
kubectl get pods -n blog

# Check services
kubectl get svc -n blog

# Check ingress
kubectl get ingress -n blog

# Test health endpoints
curl -f https://bapi.ingasti.com/health
curl -f https://blog.ingasti.com/health
```

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Rollback backend
kubectl rollout undo deployment/blog-backend -n blog

# Rollback frontend
kubectl rollout undo deployment/blog-frontend -n blog

# Check rollout status
kubectl rollout status deployment/blog-backend -n blog
kubectl rollout status deployment/blog-frontend -n blog
```

### Scale Down for Maintenance
```bash
# Scale to 0 replicas
kubectl scale deployment blog-backend --replicas=0 -n blog
kubectl scale deployment blog-frontend --replicas=0 -n blog

# Scale back up
kubectl scale deployment blog-backend --replicas=2 -n blog
kubectl scale deployment blog-frontend --replicas=2 -n blog
```

### Debug Pod Issues
```bash
# Describe problematic pods
kubectl describe pods -n blog

# Check pod logs
kubectl logs -f deployment/blog-backend -n blog
kubectl logs -f deployment/blog-frontend -n blog

# Get shell access
kubectl exec -it deployment/blog-backend -n blog -- /bin/sh
```

## 📊 Performance Monitoring

### Resource Usage
```bash
# Check resource usage
kubectl top pods -n blog
kubectl top nodes

# Check HPA status
kubectl get hpa -n blog
```

### Application Metrics
```bash
# Backend health and metrics
curl -s https://bapi.ingasti.com/health | jq .

# Frontend health
curl -s https://blog.ingasti.com/health
```

## 🔐 Security Checklist

- [ ] All containers run as non-root users
- [ ] Secrets are not exposed in environment variables
- [ ] Network policies restrict unnecessary traffic
- [ ] SSL/TLS is enabled for all external traffic
- [ ] Regular security updates are applied
- [ ] Vulnerability scanning is performed
- [ ] Access logs are monitored
- [ ] Failed authentication attempts are tracked

## 📝 Post-Deployment Tasks

- [ ] Verify all services are running
- [ ] Test user authentication flow
- [ ] Test file upload functionality
- [ ] Test database connectivity
- [ ] Monitor application logs for errors
- [ ] Set up monitoring alerts
- [ ] Document any issues encountered
- [ ] Update team on deployment status

## 🎯 Success Criteria

Deployment is considered successful when:
- [ ] All pods are running and ready
- [ ] Health checks pass for both services
- [ ] Frontend is accessible at https://blog.ingasti.com
- [ ] Backend API is accessible at https://bapi.ingasti.com
- [ ] Authentication works correctly
- [ ] File uploads work correctly
- [ ] Database connectivity is established
- [ ] SSL certificates are valid
- [ ] No errors in application logs

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Version**: ___________
**Notes**: ___________
