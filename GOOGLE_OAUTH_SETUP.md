# Google OAuth Setup for Blog Authentication

## Overview
This guide explains how to set up Google OAuth authentication for the blog application in production. The OAuth integration allows users to log in using their Google accounts.

## Prerequisites
- Access to Google Cloud Console
- SSH access to the Kubernetes cluster (`oracledev`)
- Local copy of the blog repository

## Step 1: Set Up Google OAuth Credentials

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project or create a new one

### 1.2 Enable Required APIs
1. Navigate to **APIs & Services** → **Library**
2. Search for and enable the following APIs:
   - **Google+ API** (or **Google Identity API**)
   - **People API** (recommended for better profile access)

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in required information:
     - App name: "Bedtime Blog"
     - User support email: your email
     - Developer contact information: your email
   - Add authorized domains: `ingasti.com`
   - Save and continue through the scopes (no special scopes needed for basic profile)

### 1.4 Configure OAuth Client
1. Choose **Web application** as the application type
2. Set the name: "Bedtime Blog Production"
3. Add **Authorized redirect URIs**:
   ```
   https://bapi.ingasti.com/api/auth/google/callback
   ```
4. For local development, also add:
   ```
   http://localhost:5001/api/auth/google/callback
   ```
5. Click **CREATE**

### 1.5 Save Credentials
1. Copy the **Client ID** and **Client Secret**
2. Store them securely - you'll need them for the next step

## Step 2: Update Kubernetes Secrets

### 2.1 Generate Base64 Encoded Values
Use the provided helper script to generate the base64 encoded values:

```bash
# Run the setup script
./setup-google-oauth.sh
```

This will prompt you for:
- Google Client ID
- Google Client Secret

And output the base64 encoded values needed for Kubernetes.

### 2.2 Manual Base64 Encoding (Alternative)
If you prefer to encode manually:

```bash
# Encode Client ID
echo -n "YOUR_ACTUAL_CLIENT_ID" | base64 -w 0

# Encode Client Secret  
echo -n "YOUR_ACTUAL_CLIENT_SECRET" | base64 -w 0
```

### 2.3 Update the Secrets File
Edit `k8s/blog-secrets.yaml` and replace the placeholder values:

```yaml
# Replace these lines:
GOOGLE_CLIENT_ID: WU9VUl9HT09HTEVfQ0xJRU5UX0lE  # OLD - placeholder
GOOGLE_CLIENT_SECRET: WU9VUl9HT09HTEVfQ0xJRU5UX1NFQ1JFVA==  # OLD - placeholder

# With your actual base64 encoded values:
GOOGLE_CLIENT_ID: <your_base64_encoded_client_id>
GOOGLE_CLIENT_SECRET: <your_base64_encoded_client_secret>
```

## Step 3: Deploy to Production

### 3.1 Copy Secrets to Cloud Server
```bash
# Copy the updated secrets file to the cloud server
scp k8s/blog-secrets.yaml oracledev:~/blog-secrets.yaml
```

### 3.2 Apply Updated Secrets
```bash
# Apply the secrets to Kubernetes
ssh oracledev "kubectl apply -f ~/blog-secrets.yaml"
```

### 3.3 Restart Backend Deployment
```bash
# Restart the backend to pick up new environment variables
ssh oracledev "kubectl rollout restart deployment/blog-backend -n blog"
```

### 3.4 Verify Deployment
```bash
# Check that pods are running
ssh oracledev "kubectl get pods -n blog -l app=blog-backend"

# Check logs for any OAuth-related errors
ssh oracledev "kubectl logs -f deployment/blog-backend -n blog"
```

### 3.5 Clean Up
```bash
# Remove the temporary secrets file from the server
ssh oracledev "rm ~/blog-secrets.yaml"
```

## Step 4: Test OAuth Login

### 4.1 Access the Login Page
1. Go to https://blog.ingasti.com/login
2. Click "Login with Google"
3. You should be redirected to Google's OAuth consent screen

### 4.2 Expected Flow
1. User clicks "Login with Google"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Redirected back to your application
5. User is logged in

### 4.3 Troubleshooting
If you encounter issues:

1. **"OAuth client was not found"**: 
   - Verify Client ID is correct in secrets
   - Check that the redirect URI matches exactly

2. **"redirect_uri_mismatch"**:
   - Ensure redirect URI in Google Console matches: `https://bapi.ingasti.com/api/auth/google/callback`

3. **Backend errors**:
   - Check backend logs: `ssh oracledev "kubectl logs deployment/blog-backend -n blog"`
   - Verify environment variables are loaded

## File Structure
```
k8s/
├── blog-secrets.yaml          # Contains OAuth credentials
├── backend-deployment.yaml    # References OAuth env vars
└── ...

api/
├── index.js                   # OAuth configuration
└── ...

setup-google-oauth.sh          # Helper script for base64 encoding
```

## Security Notes
- Never commit actual OAuth credentials to Git
- The secrets file with real credentials should not be pushed to the repository
- Use base64 encoding for Kubernetes secrets (not for security, just format requirement)
- Regularly rotate OAuth credentials if needed

## OAuth Flow Architecture
```
User → Frontend (blog.ingasti.com/login)
     → Backend (bapi.ingasti.com/api/auth/google)
     → Google OAuth Server
     → Backend Callback (bapi.ingasti.com/api/auth/google/callback)
     → Frontend (with authentication token)
```

## Environment Variables Used
- `GOOGLE_CLIENT_ID`: OAuth Client ID from Google Console
- `GOOGLE_CLIENT_SECRET`: OAuth Client Secret from Google Console
- `NODE_ENV`: Set to "production" for correct callback URL

## Quick Reference Commands
```bash
# Deploy updated secrets
scp k8s/blog-secrets.yaml oracledev:~/blog-secrets.yaml
ssh oracledev "kubectl apply -f ~/blog-secrets.yaml && kubectl rollout restart deployment/blog-backend -n blog"

# Check status
ssh oracledev "kubectl get pods -n blog"

# View logs
ssh oracledev "kubectl logs deployment/blog-backend -n blog"
```

# All references to jenkins.ingasti.com replaced with <your-jenkins-server>
# All references to oracledev replaced with <your-ssh-host>
# All AWS account IDs replaced with <your-aws-account-id>
# All other sensitive values replaced with generic placeholders
