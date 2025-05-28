# Bedtime Blog CI/CD Automation & Deployment Guide

Here is a summary of all code and configuration in the workspace relevant to automating CI/CD with Jenkins and deploying the blog online (AWS, OCI, or Ubuntu):

**Monorepo Structure & Build Scripts**
- /package.json: root scripts for dev/build/test using pnpm and concurrently.
- /pnpm-workspace.yaml: declares workspaces for client and api.
- /client/package.json: scripts for dev/build/preview (Vite).
- /api/package.json: scripts for start/dev (Node/Express).

**Backend Entrypoint & Configuration**
- /api/index.js: Express server, API routes, Passport.js, Multer for uploads, listens on port 8800.
- /api/db.js: MySQL connection using environment variables.
- /api/runMigrations.js, /api/testDbConnection.js: for DB setup/health in CI/CD.

**Frontend Entrypoint & Build**
- /client/src/main.jsx, /client/vite.config.js, /client/index.html: main React/Vite entrypoints.
- /client/public/, /client/src/media/: static assets and media.

**Environment Variables**
- No .env files found, but code expects them for DB and OAuth credentials (see /api/db.js and README.md).

**Ports**
- Frontend: 5173 (Vite default)
- Backend: 8800 (Express)

**No Existing Automation/Deployment Scripts**
- No Jenkinsfile, Dockerfile, docker-compose, nginx, or systemd files found in the codebase.
- You will need to create Jenkinsfiles, Dockerfiles, or systemd/nginx configs for your deployment target.

**Relevant Documentation**
- README.md: describes install, build, and run steps for both client and api.
- DeployAutomaton.md: contains a detailed guide (in progress) for Jenkins CI/CD, deployment options (Ubuntu, AWS, OCI), and example scripts.

**Summary**
- All automation and deployment must be added by you (Jenkinsfile, Dockerfile, nginx/systemd configs).
- The codebase is ready for CI/CD and cloud deployment, but you must supply the automation scripts.


## Relevant Code and Files for CI/CD and Deployment

### Monorepo Structure & Build Scripts

- **/package.json**
  - Contains root scripts:
    - `dev`: `concurrently -k "pnpm --filter=api dev" "cd client && pnpm dev"`
    - `build`: `vite build`
    - `preview`: `vite preview`
- **/pnpm-workspace.yaml**
  - Declares the two workspaces: `client` and `api`
- **/client/package.json**
  - `dev`: `vite`
  - `build`: `vite build`
  - `preview`: `vite preview`
- **/api/package.json**
  - `start`: `node index.js`
  - `dev`: `nodemon index.js`

### Backend Entrypoint & Configuration

- **/api/index.js**: Express server, API routes, Passport.js, Multer for uploads, listens on port 8800.
- **/api/db.js**: MySQL connection using environment variables (host, user, password, db).
- **/api/runMigrations.js** and **/api/testDbConnection.js**: Useful for DB setup/health in CI/CD.

### Frontend Entrypoint & Build

- **/client/src/main.jsx**, **/client/vite.config.js**, **/client/index.html**: Main React/Vite entrypoints.
- **/client/public/** and **/client/src/media/**: Static assets and media.

### Environment Variables

- No `.env` files found, but README and code expect them for DB and OAuth credentials.
- `/api/db.js` expects `process.env.DB_KEY` for DB password.

### Ports

- **Frontend:** 5173 (Vite default)
- **Backend:** 8800 (Express)

### Automation/Deployment Scripts

- **No Docker, Nginx, or systemd files found**
  - You will need to create your own Dockerfile, docker-compose, or systemd/nginx configs for production.
- **No Jenkinsfile or CI/CD scripts found**
  - You will need to create a Jenkins pipeline (declarative or scripted) to automate:
    - Checkout
    - Install dependencies (`pnpm install`)
    - Build frontend (`cd client && pnpm build`)
    - Start backend (`cd api && pnpm start`)
    - (Optional) Run tests, migrations, etc.

### Deployment

- **For AWS/OCI:** You can use EC2, Lightsail, or a container service.
- **For Ubuntu:** Use systemd for process management, Nginx as a reverse proxy, and set up environment variables.

### Summary of What You’ll Need to Automate

- Install Node.js and pnpm on your build/deploy host.
- Set up environment variables for backend (DB, JWT, OAuth).
- In Jenkins:
  - Checkout code
  - `pnpm install`
  - `cd client && pnpm build`
  - `cd api && pnpm install`
  - (Optional) Run DB migrations
  - Start backend (`pnpm start` or via systemd/pm2)
  - Serve frontend static files (e.g., with Nginx or Express static middleware)
- For cloud: Open ports 80/443 (frontend), 8800 (API, or proxy it).
- For local Ubuntu: Use systemd for backend, Nginx for frontend/static, and set up SSL if needed.

---

No existing automation or deployment scripts are present in the codebase. You will need to create Jenkinsfiles, Dockerfiles, or systemd/nginx configs as appropriate for your chosen deployment target.


# CI/CD Automation & Deployment Guide for Bedtime Blog

This guide explains how to automate CI/CD for the Bedtime Blog project using Jenkins and how to deploy it on AWS, Oracle Cloud (OCI), or a local Ubuntu host.

---

## 1. Relevant Codebase Structure for CI/CD

- **Monorepo:** Managed with `pnpm` workspaces (`pnpm-workspace.yaml`)
- **Backend:** `/api` (Node.js/Express, MySQL, Passport.js, Multer)
- **Frontend:** `/client` (React, Vite)
- **Scripts:**
  - Root: `pnpm dev`, `pnpm build`, `pnpm preview`
  - Backend: `pnpm dev` (nodemon), `pnpm start`
  - Frontend: `pnpm dev`, `pnpm build`, `pnpm preview`
- **Ports:**
  - Frontend: 5173
  - Backend: 8800

---

## 2. Jenkins Pipeline (Jenkinsfile Example)

Place a `Jenkinsfile` at the root of your repo:

```groovy
pipeline {
  agent any
  environment {
    NODE_ENV = 'production'
    // Add DB and OAuth secrets here or use Jenkins credentials
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Install Dependencies') {
      steps {
        sh 'pnpm install'
      }
    }
    stage('Build Frontend') {
      steps {
        sh 'cd client && pnpm build'
      }
    }
    stage('Test (Optional)') {
      steps {
        sh 'pnpm test || true' // Add real tests if available
      }
    }
    stage('Deploy') {
      steps {
        // For local/VM: use SSH, rsync, or scp to deploy build and restart services
        // For cloud: use AWS CLI, OCI CLI, or Docker as needed
        echo 'Deploy step here'
      }
    }
  }
}
```

---

## 3. Deployment Options

### A. Local Ubuntu Host

1. **Install dependencies:**
   ```sh
   sudo apt update && sudo apt install -y nodejs npm mysql-client
   npm install -g pnpm
   ```
2. **Configure environment:**
   - Set up `.env` in `/api` with DB and OAuth credentials.
3. **Start backend:**
   ```sh
   cd api
   pnpm install
   pnpm dev &
   ```
4. **Build and serve frontend:**
   ```sh
   cd client
   pnpm install
   pnpm build
   pnpm preview &
   ```
5. **(Optional) Use Nginx/Apache** as a reverse proxy for production.

### B. AWS (EC2, ECS, Elastic Beanstalk, S3+CloudFront)

- **EC2:**
  - Use the same steps as Ubuntu, automate with Jenkins and SSH.
- **ECS/Elastic Beanstalk:**
  - Build Docker images for `api` and `client`, push to ECR, deploy with ECS task definitions or Elastic Beanstalk.
- **S3 + CloudFront:**
  - For static frontend, upload `client/dist` to S3 and serve via CloudFront. Backend runs on EC2/ECS.

### C. Oracle Cloud Infrastructure (OCI)

- **Compute Instance:**
  - Same as Ubuntu.
- **OKE (Kubernetes):**
  - Build Docker images, push to OCIR, deploy with Kubernetes manifests.
- **Object Storage:**
  - For static frontend, upload build to OCI Object Storage and serve via CDN.

---

## 4. Example deploy.sh Script

```bash
#!/bin/bash
# Stop existing processes (if using pm2 or similar)
# pm2 stop bedtime-blog || true

# Pull latest code (if not using Jenkins checkout)
# git pull origin main

# Install dependencies
pnpm install

# Build frontend
cd client
pnpm build
cd ..

# Restart backend (example with pm2)
cd api
pnpm install
pm2 restart index.js --name bedtime-blog-api || pm2 start index.js --name bedtime-blog-api
```

---

## 5. Additional Notes

- **Environment Variables:** Set all required variables for DB, JWT, and OAuth in your CI/CD or server environment.
- **Database:** Ensure your cloud MySQL DB is accessible from the backend.
- **Media Uploads:** For production, consider using cloud storage for uploads.
- **Security:** Never commit secrets to the repo. Use Jenkins credentials or environment variables.
- **Monitoring:** Use PM2, systemd, or Docker for process management and restarts.

---

For more improvements, see [`docs/Improvements.md`](docs/Improvements.md).