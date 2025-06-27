pipeline {
  agent any
  environment {
    DB_HOST = credentials('db-host')
    DB_PORT = credentials('db-port')
    DB_USER = credentials('db-user')
    DB_KEY  = credentials('db-key')
    DB_NAME = credentials('db-name')
    JWT_SECRET = credentials('jwt-secret')
    NEXT_PUBLIC_API_URL = 'http://localhost:5000'
    GITHUB_USER = credentials('github-user')
    GITHUB_TOKEN = credentials('github-token')
    REGISTRY = 'ghcr.io/yourusername/your-blog-repo'
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
         sh 'docker compose up --build -d'
        // Optionally, run tests here if your containers expose test endpoints or scripts
      }
    }
    stage('Build Docker Images') {
      steps {
        sh 'docker build -t $REGISTRY/backend:$IMAGE_TAG -f api/Dockerfile ./api'
        sh 'docker build -t $REGISTRY/frontend:$IMAGE_TAG -f client/Dockerfile ./client'
      }
    }
    stage('Login to GitHub Registry') {
      steps {
        sh 'echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin'
      }
    }
    stage('Push Images to GitHub Registry') {
      steps {
        sh 'docker push $REGISTRY/backend:$IMAGE_TAG'
        sh 'docker push $REGISTRY/frontend:$IMAGE_TAG'
      }
    }
    // Do not run docker compose down here, so containers remain online after build
  }
  post {
    // Optionally, add cleanup here if you want to stop containers after a specific event
  }
}
