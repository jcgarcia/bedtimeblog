# Google OAuth Quick Setup Reference

## 🔧 Prerequisites
- Google Cloud Console access
- SSH access to `oracledev` server
- Blog repository locally

## 🚀 Quick Setup Steps

### 1. Google Console Setup
```
1. Go to: console.cloud.google.com
2. APIs & Services → Library → Enable Google+ API
3. APIs & Services → Credentials → Create OAuth 2.0 Client
4. App type: Web application
5. Redirect URI: https://bapi.ingasti.com/api/auth/google/callback
6. Save Client ID and Secret
```

### 2. Update Local Secrets
```bash
# Generate base64 encoded values
./setup-google-oauth.sh

# Edit k8s/blog-secrets.yaml with real values
```

### 3. Deploy to Production
```bash
# Copy and apply secrets
scp k8s/blog-secrets.yaml oracledev:~/blog-secrets.yaml
ssh oracledev "kubectl apply -f ~/blog-secrets.yaml"

# Restart backend
ssh oracledev "kubectl rollout restart deployment/blog-backend -n blog"

# Verify
ssh oracledev "kubectl get pods -n blog"
```

### 4. Test
- Visit: https://blog.ingasti.com/login
- Click "Login with Google"
- Should redirect to Google OAuth

## 🔍 Troubleshooting
```bash
# Check backend logs
ssh oracledev "kubectl logs deployment/blog-backend -n blog"

# Check environment variables
ssh oracledev "kubectl exec deployment/blog-backend -n blog -- env | grep GOOGLE"
```

## 📁 Files Modified
- `k8s/blog-secrets.yaml` - OAuth credentials
- `k8s/backend-deployment.yaml` - Environment variables
- `api/index.js` - OAuth callback URL

## ⚠️ Security Notes
- Never commit real OAuth credentials
- Use placeholder values in Git
- Base64 encoding is for Kubernetes format, not security
