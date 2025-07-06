# 🚀 Jenkins Server - Quick Deployment Commands

## 📋 Prerequisites Check
```bash
# Verify kubectl access
kubectl version --client
kubectl cluster-info

# Check Docker registry
curl -s http://localhost:5000/v2/_catalog

# Check git repository
git clone https://github.com/jcgarcia/bedtimeblog.git
cd bedtimeblog
git checkout k8s
```

## 🔧 Update Production Secrets

**Edit `k8s/namespace.yaml` and update these base64 encoded values:**

```bash
# Database URL (Aiven MySQL)
echo -n "mysql://avnadmin:YOUR_PASSWORD@mysql-service.aivencloud.com:PORT/defaultdb" | base64

# JWT Secret (32+ characters)
echo -n "bedtime-blog-super-secure-jwt-secret-2025" | base64

# Google OAuth
echo -n "YOUR_GOOGLE_CLIENT_ID" | base64
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | base64
```

## 🚀 Manual Deployment Commands

### Build and Push Images
```bash
cd /path/to/bedtimeblog
git checkout k8s

# Build backend
docker build -f api/Dockerfile.k8s -t localhost:5000/blog-backend:latest ./api
docker push localhost:5000/blog-backend:latest

# Build frontend
docker build -f client/Dockerfile.k8s -t localhost:5000/blog-frontend:latest ./client
docker push localhost:5000/blog-frontend:latest
```

### Deploy to Kubernetes
```bash
cd k8s

# Make script executable
chmod +x deploy.sh

# Deploy everything
./deploy.sh

# Or manual deployment
kubectl apply -f namespace.yaml
kubectl apply -f storage.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f network-policy.yaml
```

## 🔍 Verification Commands

```bash
# Check deployment status
kubectl get pods -n blog
kubectl get svc -n blog
kubectl get ingress -n blog

# Check health
curl -f https://bapi.ingasti.com/health
curl -f https://blog.ingasti.com/health

# View logs
kubectl logs -f deployment/blog-backend -n blog
kubectl logs -f deployment/blog-frontend -n blog

# Check certificates
kubectl get certificates -n blog
```

## 🎯 Jenkins Pipeline Setup

### Add Jenkins Credentials
1. Go to Jenkins Dashboard → Manage Jenkins → Credentials
2. Add these Secret Text credentials:
   - **ID**: `blog-database-url`
   - **Secret**: Your Aiven MySQL connection string
   
   - **ID**: `blog-jwt-secret`
   - **Secret**: Your JWT secret

### Create Pipeline Job
1. New Item → Pipeline
2. Pipeline → Pipeline script from SCM
3. SCM: Git
4. Repository URL: `https://github.com/jcgarcia/bedtimeblog.git`
5. Branch: `k8s`
6. Script Path: `Jenkinsfile.k8s`

## 🚨 Emergency Commands

### Rollback
```bash
kubectl rollout undo deployment/blog-backend -n blog
kubectl rollout undo deployment/blog-frontend -n blog
```

### Scale Down
```bash
kubectl scale deployment blog-backend --replicas=0 -n blog
kubectl scale deployment blog-frontend --replicas=0 -n blog
```

### Debug
```bash
# Describe problematic pods
kubectl describe pods -n blog

# Get shell access
kubectl exec -it deployment/blog-backend -n blog -- /bin/sh

# Check events
kubectl get events -n blog --sort-by=.metadata.creationTimestamp
```

## 📊 Monitoring

```bash
# Resource usage
kubectl top pods -n blog
kubectl top nodes

# Auto-scaling status
kubectl get hpa -n blog

# Network policies
kubectl get networkpolicies -n blog
```

## 🔄 Update Deployment

```bash
# Build new version
docker build -f api/Dockerfile.k8s -t localhost:5000/blog-backend:v2.0 ./api
docker push localhost:5000/blog-backend:v2.0

# Update deployment
kubectl set image deployment/blog-backend blog-backend=localhost:5000/blog-backend:v2.0 -n blog

# Check rollout
kubectl rollout status deployment/blog-backend -n blog
```

---

**Target URLs:**
- Frontend: https://blog.ingasti.com
- Backend: https://bapi.ingasti.com

**Key Files:**
- `k8s/namespace.yaml` - Update secrets here
- `Jenkinsfile.k8s` - CI/CD pipeline
- `k8s/deploy.sh` - Automated deployment script
