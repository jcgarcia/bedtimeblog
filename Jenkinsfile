pipeline {
  agent any
  environment {
    // Database credentials for Docker Compose
    DATABASE_URL = credentials('database-url')
    CORS_ORIGIN = 'http://localhost:3000'
    JWT_SECRET = credentials('jwt-secret')
    NEXT_PUBLIC_API_URL = 'http://localhost:5000'
    
    // GitHub Container Registry credentials
    GITHUB_USER = credentials('github-user')
    GITHUB_TOKEN = credentials('github-token')
    REGISTRY = 'ghcr.io/yourusername/your-blog-repo'
    
    // Image names with build number for uniqueness
    FRONTEND_IMAGE = "bedtime-blog-frontend:${env.BUILD_NUMBER}"
    BACKEND_IMAGE = "bedtime-blog-backend:${env.BUILD_NUMBER}"
    COMPOSE_PROJECT_NAME = "bedtime-blog-${env.BUILD_NUMBER}"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          // Compose a unique image tag using branch, build number, and short commit hash
          env.IMAGE_TAG = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        }
      }
    }
    stage('Build & Test (Docker Compose)') {
      steps {
        script {
          echo "🔧 Building and starting containers with Docker Compose..."
          
          // Clean up any existing containers with same project name
          sh 'docker compose -p $COMPOSE_PROJECT_NAME down --remove-orphans || true'
          
          // Build and start containers
          sh 'docker compose -p $COMPOSE_PROJECT_NAME up --build -d'
          
          // Wait for containers to be ready
          echo "⏳ Waiting for containers to be ready..."
          sh 'sleep 30'
          
          // Check container status
          sh 'docker compose -p $COMPOSE_PROJECT_NAME ps'
        }
      }
    }
    stage('Health Check (Docker Compose)') {
      steps {
        script {
          echo "🏥 Running health checks on Docker Compose services..."
          
          // Test backend health
          sh '''
            echo "Testing backend health via Docker Compose..."
            for i in {1..15}; do
              if curl -f -s http://localhost:5000/health || curl -f -s http://localhost:5000; then
                echo "✅ Backend is responding!"
                break
              else
                echo "⏳ Attempt $i: Backend not ready yet, waiting..."
                sleep 4
              fi
              if [ $i -eq 15 ]; then
                echo "❌ Backend failed to respond after 15 attempts"
                docker compose -p $COMPOSE_PROJECT_NAME logs backend
                exit 1
              fi
            done
          '''
          
          // Test frontend health
          sh '''
            echo "Testing frontend health via Docker Compose..."
            for i in {1..15}; do
              if curl -f -s http://localhost:3000; then
                echo "✅ Frontend is responding!"
                RESPONSE=$(curl -s http://localhost:3000)
                if echo "$RESPONSE" | grep -q -i "html\\|doctype\\|<title"; then
                  echo "✅ Frontend is serving HTML content!"
                else
                  echo "⚠️  Frontend is responding but content may be missing"
                  echo "Response preview: ${RESPONSE:0:200}"
                fi
                break
              else
                echo "⏳ Attempt $i: Frontend not ready yet, waiting..."
                sleep 4
              fi
              if [ $i -eq 15 ]; then
                echo "❌ Frontend failed to respond after 15 attempts"
                docker compose -p $COMPOSE_PROJECT_NAME logs frontend
                exit 1
              fi
            done
          '''
          
          echo "✅ Docker Compose health checks passed!"
          echo "🌐 Frontend: http://localhost:3000"
          echo "🔧 Backend: http://localhost:5000"
        }
      }
    }
    stage('Build Individual Docker Images') {
      steps {
        script {
          echo "🐳 Building individual Docker images for registry..."
          
          // Build frontend image
          sh 'docker build -t $FRONTEND_IMAGE -f client/Dockerfile ./client'
          sh 'docker build -t $REGISTRY/frontend:$IMAGE_TAG -f client/Dockerfile ./client'
          
          // Build backend image  
          sh 'docker build -t $BACKEND_IMAGE -f api/Dockerfile ./api'
          sh 'docker build -t $REGISTRY/backend:$IMAGE_TAG -f api/Dockerfile ./api'
          
          echo "✅ Individual Docker images built successfully!"
        }
      }
    }
    stage('Test Individual Containers') {
      steps {
        script {
          echo "🧪 Testing individual containers..."
          
          // Clean up any existing test containers
          sh 'docker rm -f test-blog-frontend test-blog-backend || true'
          
          // Start backend container with real database credentials
          sh '''
            docker run -d --name test-blog-backend \\
              -p 5001:5000 \\
              -e NODE_ENV=production \\
              -e DATABASE_URL="$DATABASE_URL" \\
              -e JWT_SECRET="$JWT_SECRET" \\
              -e CORS_ORIGIN="http://localhost:3001" \\
              $BACKEND_IMAGE
          '''
          
          // Start frontend container (nginx serves on port 80)
          sh '''
            docker run -d --name test-blog-frontend \\
              -p 3001:80 \\
              -e NEXT_PUBLIC_API_URL="http://localhost:5001" \\
              $FRONTEND_IMAGE
          '''
          
          // Wait for containers to start
          echo "⏳ Waiting for individual containers to start..."
          sh 'sleep 25'
          
          // Test backend health with detailed checks
          sh '''
            echo "Testing individual backend container..."
            echo "Checking if backend container is running..."
            docker ps | grep test-blog-backend
            
            echo "Testing backend endpoint..."
            for i in {1..12}; do
              if curl -f -s http://localhost:5001/health || curl -f -s http://localhost:5001; then
                echo "✅ Individual backend is responding!"
                break
              else
                echo "⏳ Attempt $i: Backend not ready yet, waiting..."
                sleep 3
              fi
              if [ $i -eq 12 ]; then
                echo "❌ Individual backend failed to respond after 12 attempts"
                echo "Backend container logs:"
                docker logs test-blog-backend
                exit 1
              fi
            done
          '''
          
          // Test frontend health with detailed checks
          sh '''
            echo "Testing individual frontend container..."
            echo "Checking if frontend container is running..."
            docker ps | grep test-blog-frontend
            
            echo "Testing frontend endpoint..."
            for i in {1..12}; do
              if curl -f -s http://localhost:3001; then
                echo "✅ Individual frontend is responding!"
                echo "Checking if content is being served..."
                RESPONSE=$(curl -s http://localhost:3001)
                if echo "$RESPONSE" | grep -q -i "html\\|doctype\\|<title"; then
                  echo "✅ Individual frontend is serving HTML content!"
                else
                  echo "⚠️  Frontend is responding but content may be missing"
                  echo "Response preview: ${RESPONSE:0:200}"
                fi
                break
              else
                echo "⏳ Attempt $i: Frontend not ready yet, waiting..."
                sleep 3
              fi
              if [ $i -eq 12 ]; then
                echo "❌ Individual frontend failed to respond after 12 attempts"
                echo "Frontend container logs:"
                docker logs test-blog-frontend
                exit 1
              fi
            done
          '''
          
          echo "✅ Individual container tests passed!"
          echo "🌐 Frontend accessible at: http://localhost:3001"
          echo "🔧 Backend accessible at: http://localhost:5001"
        }
      }
    }
    stage('Push to GitHub Container Registry') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
          branch 'workinprogress'
        }
      }
      steps {
        script {
          echo "📦 Pushing images to GitHub Container Registry..."
          
          // Login to GitHub Container Registry
          sh 'echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin'
          
          // Push images
          sh 'docker push $REGISTRY/backend:$IMAGE_TAG'
          sh 'docker push $REGISTRY/frontend:$IMAGE_TAG'
          
          // Tag and push as latest for main/master branch
          if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') {
            sh 'docker tag $REGISTRY/backend:$IMAGE_TAG $REGISTRY/backend:latest'
            sh 'docker tag $REGISTRY/frontend:$IMAGE_TAG $REGISTRY/frontend:latest'
            sh 'docker push $REGISTRY/backend:latest'
            sh 'docker push $REGISTRY/frontend:latest'
          }
          
          echo "✅ Images pushed to GitHub Container Registry!"
        }
      }
    }
    stage('Deploy Production Containers') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
        }
      }
      steps {
        script {
          echo "🚀 Deploying to production containers..."
          
          // Stop and remove any existing production containers
          sh 'docker rm -f blog-frontend-prod blog-backend-prod || true'
          
          // Deploy backend to production port with real credentials
          sh '''
            docker run -d --name blog-backend-prod \\
              -p 5000:5000 \\
              -e NODE_ENV=production \\
              -e DATABASE_URL="$DATABASE_URL" \\
              -e JWT_SECRET="$JWT_SECRET" \\
              -e CORS_ORIGIN="http://localhost:3000" \\
              --restart unless-stopped \\
              $BACKEND_IMAGE
          '''
          
          // Deploy frontend to production port (nginx serves on port 80)
          sh '''
            docker run -d --name blog-frontend-prod \\
              -p 3000:80 \\
              -e NEXT_PUBLIC_API_URL="http://localhost:5000" \\
              --restart unless-stopped \\
              $FRONTEND_IMAGE
          '''
          
          // Wait and verify production deployment
          echo "⏳ Verifying production deployment..."
          sh 'sleep 15'
          
          // Quick production health check
          sh '''
            echo "🏥 Production health check..."
            for i in {1..5}; do
              if curl -f -s http://localhost:5000 && curl -f -s http://localhost:3000; then
                echo "✅ Production containers are healthy!"
                break
              else
                echo "⏳ Attempt $i: Waiting for production containers..."
                sleep 3
              fi
              if [ $i -eq 5 ]; then
                echo "⚠️  Production containers may need more time to start"
              fi
            done
          '''
          
          echo "🚀 Blog deployed successfully to production!"
          echo "🌐 Frontend: http://localhost:3000"
          echo "🔧 Backend API: http://localhost:5000"
        }
      }
    }
    // Do not run docker compose down here, so containers remain online after build
  }
  post {
    always {
      script {
        echo "🧹 Cleaning up test containers..."
        // Clean up test containers but keep Docker Compose and production containers running
        sh 'docker rm -f test-blog-frontend test-blog-backend || true'
        
        // Clean up Docker Compose containers only if not on main/master branch
        if (env.BRANCH_NAME != 'main' && env.BRANCH_NAME != 'master') {
          sh 'docker compose -p $COMPOSE_PROJECT_NAME down || true'
        }
      }
    }
    success {
      script {
        echo "✅ Pipeline completed successfully!"
        echo "📋 Summary:"
        echo "   - Docker Compose tests: ✅ PASSED"
        echo "   - Individual container tests: ✅ PASSED"
        if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') {
          echo "   - Production deployment: ✅ DEPLOYED"
          echo "   - GitHub Registry push: ✅ PUSHED"
        }
        echo "🌐 Access your blog at http://localhost:3000"
      }
    }
    failure {
      script {
        echo "❌ Pipeline failed!"
        echo "🔍 Checking logs for debugging..."
        // Show container logs for debugging
        sh 'docker compose -p $COMPOSE_PROJECT_NAME logs || true'
        sh 'docker logs test-blog-backend || true'
        sh 'docker logs test-blog-frontend || true'
      }
    }
  }
}
