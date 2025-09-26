# Bedtime Blog - Kubernetes Production Deployment

This repository contains the production-ready Kubernetes deployment for the Bedtime Blog application.

## Architecture

- **Frontend**: React/Vite application served by Nginx
- **Backend**: Node.js/Express API with MySQL database
- **Database**: External Aiven MySQL (managed service)
- **Reverse Proxy**: Nginx Ingress Controller
- **CI/CD**: Jenkins pipeline with Docker registry
- **Storage**: Persistent volumes for file uploads

## Prerequisites

### Infrastructure Requirements
- Kubernetes cluster (v1.21+)
- Nginx Ingress Controller
- cert-manager for SSL certificates
- Docker registry (local or external)
- Jenkins server with Kubernetes access

### Domain Configuration
- `bedtime.ingasti.com` - Frontend application
- `bapi.ingasti.com` - Backend API

### External Services
- Aiven MySQL database (or compatible MySQL service)
- Google OAuth application (for authentication)

## Quick Start

### 1. Configure Secrets

Update the base64-encoded secrets in `k8s/namespace.yaml`:

```bash
# Encode your database URL
echo -n "mysql://user:password@host:port/database" | base64

# Encode your JWT secret
echo -n "your-strong-jwt-secret" | base64

# Encode Google OAuth credentials
echo -n "your-google-client-id" | base64
echo -n "your-google-client-secret" | base64
```

### 2. Build and Push Images

```bash
# Build backend image
cd api
docker build -f Dockerfile.k8s -t localhost:5000/blog-backend:latest .
docker push localhost:5000/blog-backend:latest

# Build frontend image
cd ../client
docker build -f Dockerfile.k8s -t localhost:5000/blog-frontend:latest .
docker push localhost:5000/blog-frontend:latest
```

### 3. Deploy to Kubernetes

```bash
# Option 1: Using the deployment script
cd k8s
./deploy.sh

# Option 2: Manual deployment
kubectl apply -f namespace.yaml
kubectl apply -f storage.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f network-policy.yaml
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -n blog

# Check services
kubectl get svc -n blog

# Check ingress
kubectl get ingress -n blog

# View logs
kubectl logs -f deployment/blog-backend -n blog
kubectl logs -f deployment/blog-frontend -n blog
```

## CI/CD Pipeline

### Jenkins Pipeline

The Jenkins pipeline (`Jenkinsfile.k8s`) automates:

1. **Build Phase**:
   - Builds Docker images for frontend and backend
   - Tags images with build number and git commit hash

2. **Test Phase**:
   - Tests container health endpoints
   - Validates image functionality

3. **Deploy Phase**:
   - Pushes images to Docker registry
   - Deploys to Kubernetes cluster
   - Waits for deployment readiness

4. **Verification Phase**:
   - Performs health checks
   - Validates service availability

### Required Jenkins Credentials

Set these as Jenkins secret text credentials:

- `blog-database-url`: MySQL connection string
- `blog-jwt-secret`: JWT secret for authentication

### Triggering Deployment

```bash
# Via Jenkins (recommended)
# Pipeline is triggered automatically on git push to k8s branch

# Manual trigger
curl -X POST "http://your-jenkins-server/job/blog-k8s-deployment/build"
```

## Configuration

### Environment Variables

#### Backend (`api/`)
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `CORS_ORIGIN`: Frontend domain (https://bedtime.ingasti.com)
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (production)

#### Frontend (`client/`)
- `VITE_API_URL`: Backend API URL (https://bapi.ingasti.com)

### Kubernetes Resources

#### Namespace: `blog`
- Contains all blog-related resources
- Includes secrets and configmaps

#### Deployments
- `blog-backend`: 2 replicas with auto-scaling (2-10 pods)
- `blog-frontend`: 2 replicas with auto-scaling (2-10 pods)

#### Services
- `blog-backend-service`: Internal service (ClusterIP)
- `blog-frontend-service`: Internal service (ClusterIP)

#### Ingress
- `blog-backend-ingress`: External access to API
- `blog-frontend-ingress`: External access to frontend
- SSL termination with Let's Encrypt certificates

#### Storage
- `blog-uploads-pvc`: Persistent volume for file uploads (10Gi)
- `blog-database-pvc`: Reserved for future database deployment (5Gi)

### Security Features

- **Non-root containers**: All containers run as non-root users
- **Network policies**: Restrict pod-to-pod communication
- **SSL/TLS**: Automated certificate management
- **Resource limits**: CPU and memory limits prevent resource exhaustion
- **Health checks**: Liveness and readiness probes
- **Pod disruption budgets**: Maintain availability during updates

## Monitoring and Maintenance

### Health Checks

```bash
# Application health
curl -f https://bapi.ingasti.com/health
curl -f https://bedtime.ingasti.com/health

# Kubernetes health
kubectl get pods -n blog
kubectl describe pods -n blog
```

### Logs

```bash
# Backend logs
kubectl logs -f deployment/blog-backend -n blog

# Frontend logs
kubectl logs -f deployment/blog-frontend -n blog

# Previous pod logs
kubectl logs -f deployment/blog-backend -n blog --previous
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment blog-backend --replicas=5 -n blog

# Auto-scaling is configured via HPA
kubectl get hpa -n blog
```

### Updates

```bash
# Update image version
kubectl set image deployment/blog-backend blog-backend=localhost:5000/blog-backend:new-version -n blog

# Rolling update status
kubectl rollout status deployment/blog-backend -n blog

# Rollback if needed
kubectl rollout undo deployment/blog-backend -n blog
```

## Troubleshooting

### Common Issues

1. **Pods not starting**:
   ```bash
   kubectl describe pods -n blog
   kubectl logs -f deployment/blog-backend -n blog
   ```

2. **Database connection issues**:
   - Verify `DATABASE_URL` secret
   - Check network connectivity
   - Ensure MySQL service is accessible

3. **Image pull errors**:
   - Verify Docker registry accessibility
   - Check image tags and names
   - Ensure registry credentials (if required)

4. **Ingress not working**:
   - Check ingress controller status
   - Verify DNS configuration
   - Check certificate status

### Debug Commands

```bash
# Pod shell access
kubectl exec -it deployment/blog-backend -n blog -- /bin/sh

# Network debugging
kubectl run debug --image=busybox -it --rm -- /bin/sh

# Test internal connectivity
kubectl run test-backend --image=busybox --rm -it -- wget -qO- http://blog-backend-service.blog.svc.cluster.local/health

# Check events
kubectl get events -n blog --sort-by=.metadata.creationTimestamp
```

## Security Considerations

1. **Secrets Management**:
   - Use Kubernetes secrets for sensitive data
   - Consider external secret management (Vault, AWS Secrets Manager)
   - Rotate secrets regularly

2. **Network Security**:
   - Network policies restrict pod communication
   - Use TLS for all external communication
   - Consider service mesh for advanced security

3. **Container Security**:
   - Run as non-root user
   - Use minimal base images
   - Regularly update dependencies
   - Scan images for vulnerabilities

4. **Access Control**:
   - Implement RBAC for Kubernetes access
   - Use service accounts with minimal permissions
   - Regular audit of access permissions

## Performance Optimization

1. **Resource Tuning**:
   - Monitor resource usage
   - Adjust CPU/memory limits
   - Optimize HPA settings

2. **Database Optimization**:
   - Use connection pooling
   - Implement query optimization
   - Consider read replicas

3. **Caching**:
   - Implement Redis for session storage
   - Use CDN for static assets
   - Enable application-level caching

## Backup Strategy

1. **Database Backups**:
   - Automated Aiven backups
   - Test restore procedures
   - Document recovery process

2. **Persistent Volume Backups**:
   - Regular snapshots of upload volumes
   - Test volume restoration
   - Document backup retention policy

3. **Configuration Backups**:
   - Version control all Kubernetes manifests
   - Backup secrets and configmaps
   - Document deployment procedures

## Support

For issues and questions:
- Check the troubleshooting section
- Review application logs
- Consult Kubernetes documentation
- Contact the development team

## Contributing

1. Create feature branch from `k8s`
2. Make changes and test locally
3. Update documentation
4. Submit pull request
5. Deploy via CI/CD pipeline

---

**Last Updated**: July 2025
**Version**: 1.0.0
**Maintainer**: DevOps Team
