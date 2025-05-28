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
        sh 'pnpm test || true'
      }
    }
    stage('Build Docker Image') {
      steps {
        sh 'docker build -t bedtime-blog:latest .'
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
