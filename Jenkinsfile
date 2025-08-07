pipeline {
    agent any
    
    environment {
        // Database and security credentials
        DATABASE_URL = credentials('blog-database-url')
        JWT_SECRET = credentials('blog-jwt-secret')

        // PostgreSQL connection variables (replace with Jenkins credentials or static values as needed)
        PGHOST = credentials('db-host')
        PGPORT = credentials('db-port')
        PGUSER = credentials('db-user')
        PGPASSWORD = credentials('db-key')
        PGDATABASE = credentials('db-name')
        PGSSLMODE = 'require'

        // Image configuration
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
        GIT_COMMIT_SHORT = ""
        FRONTEND_IMAGE = "localhost:5000/blog-frontend:${BUILD_NUMBER}"
        BACKEND_IMAGE = "localhost:5000/blog-backend:${BUILD_NUMBER}"

        // Environment configuration
        CORS_ORIGIN = 'https://blog.ingasti.com'
        VITE_API_URL = 'https://bapi.ingasti.com'

        // Docker registry
        REGISTRY_URL = 'localhost:5000'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Get short commit hash
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    
                    // Update image tags with commit hash
                    env.FRONTEND_IMAGE = "${REGISTRY_URL}/blog-frontend:${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
                    env.BACKEND_IMAGE = "${REGISTRY_URL}/blog-backend:${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
                    
                    echo "� Building Blog Application"
                    echo "=============================="
                    echo "📦 Images to build:"
                    echo "  Frontend: ${env.FRONTEND_IMAGE}"
                    echo "  Backend: ${env.BACKEND_IMAGE}"
                    echo "🌐 Target URLs:"
                    echo "  Frontend: https://blog.ingasti.com"
                    echo "  Backend: https://bapi.ingasti.com"
                }
            }
        }
        
        stage('Build Backend Image') {
            steps {
                script {
                    echo "🔨 Building backend Docker image..."
                    dir('api') {
                        sh """
                            docker build -f Dockerfile.k8s -t ${env.BACKEND_IMAGE} .
                            docker tag ${env.BACKEND_IMAGE} ${REGISTRY_URL}/blog-backend:latest
                        """
                    }
                }
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                script {
                    echo "🔨 Building frontend Docker image..."
                    dir('client') {
                        sh """
                            docker build -f Dockerfile.k8s -t ${env.FRONTEND_IMAGE} .
                            docker tag ${env.FRONTEND_IMAGE} ${REGISTRY_URL}/blog-frontend:latest
                        """
                    }
                }
            }
        }
        
        stage('Push Images to Registry') {
            steps {
                script {
                    echo "📤 Pushing images to registry..."
                    sh """
                        echo "Pushing backend image..."
                        docker push ${env.BACKEND_IMAGE}
                        docker push ${REGISTRY_URL}/blog-backend:latest
                        
                        echo "Pushing frontend image..."
                        docker push ${env.FRONTEND_IMAGE}
                        docker push ${REGISTRY_URL}/blog-frontend:latest
                    """
                }
            }
        }
        
        stage('Test Backend Container') {
            steps {
                withCredentials([
                    string(credentialsId: 'db-host', variable: 'PGHOST'),
                    string(credentialsId: 'db-port', variable: 'PGPORT'),
                    string(credentialsId: 'db-user', variable: 'PGUSER'),
                    string(credentialsId: 'db-key', variable: 'PGPASSWORD'),
                    string(credentialsId: 'db-name', variable: 'PGDATABASE')
                ]) {
                    script {
                        echo "🧪 Testing backend container..."
                        sh """
                            # Start backend container for testing
                            docker run -d -p 5001:5000 --name test-backend-${BUILD_NUMBER} \
                                -e PGHOST="${PGHOST}" \
                                -e PGPORT="${PGPORT}" \
                                -e PGUSER="${PGUSER}" \
                                -e PGPASSWORD="${PGPASSWORD}" \
                                -e PGDATABASE="${PGDATABASE}" \
                                -e PGSSLMODE="${PGSSLMODE}" \
                                -e JWT_SECRET="${JWT_SECRET}" \
                                -e CORS_ORIGIN="${CORS_ORIGIN}" \
                                -e NODE_ENV=production \
                                ${env.BACKEND_IMAGE}
                            
                            # Wait for container to start
                            sleep 15
                            
                            # Test health endpoint
                            curl -f http://localhost:5001/health || (echo "Backend health check failed" && exit 1)
                            
                            echo "✅ Backend container test passed"
                        """
                    }
                }
            }
            post {
                always {
                    script {
                        // Cleanup test container
                        sh """
                            docker stop test-backend-${BUILD_NUMBER} || true
                            docker rm test-backend-${BUILD_NUMBER} || true
                        """
                    }
                }
            }
        }
        
        stage('Test Frontend Container') {
            steps {
                script {
                    echo "🧪 Testing frontend container..."
                    sh """
                        # Start frontend container for testing
                        docker run -d -p 3001:80 --name test-frontend-${BUILD_NUMBER} \
                            -e VITE_API_URL="${VITE_API_URL}" \
                            ${env.FRONTEND_IMAGE}
                        
                        # Wait for container to start
                        sleep 15
                        
                        # Test health endpoint
                        curl -f http://localhost:3001/health || (echo "Frontend health check failed" && exit 1)
                        
                        echo "✅ Frontend container test passed"
                    """
                }
            }
            post {
                always {
                    script {
                        // Cleanup test container
                        sh """
                            docker stop test-frontend-${BUILD_NUMBER} || true
                            docker rm test-frontend-${BUILD_NUMBER} || true
                        """
                    }
                }
            }
        }
        
        stage('Verify Kubernetes Access') {
            steps {
                script {
                    echo "🔍 Verifying Kubernetes cluster access..."
                    sh """
                        kubectl version --client
                        kubectl cluster-info --request-timeout=10s
                        kubectl get nodes
                    """
                    echo "✅ Kubernetes cluster is accessible"
                }
            }
        }
        
        stage('Deploy Nginx Configuration') {
            steps {
                script {
                    echo "🌐 Deploying nginx proxy configuration..."
                    sh """
                        # Backup current nginx configuration
                        sudo cp -r /etc/nginx /etc/nginx.backup.\$(date +%Y%m%d_%H%M%S) || true
                        
                        # Deploy frontend proxy configuration with API routing
                        sudo tee /etc/nginx/sites-available/blog.ingasti.com > /dev/null << 'EOF'
server {
    listen 80;
    server_name blog.ingasti.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.ingasti.com;

    ssl_certificate /etc/letsencrypt/live/ingasti.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ingasti.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Proxy API requests to backend on port 5000
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;
        proxy_buffering off;
        
        add_header Access-Control-Allow-Origin "https://blog.ingasti.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Proxy to frontend on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
EOF

                        # Deploy backend proxy configuration
                        sudo tee /etc/nginx/sites-available/bapi.ingasti.com > /dev/null << 'EOF'
server {
    listen 80;
    server_name bapi.ingasti.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bapi.ingasti.com;

    ssl_certificate /etc/letsencrypt/live/ingasti.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ingasti.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        add_header Access-Control-Allow-Origin "https://blog.ingasti.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
EOF

                        # Enable sites
                        sudo ln -sf /etc/nginx/sites-available/blog.ingasti.com /etc/nginx/sites-enabled/
                        sudo ln -sf /etc/nginx/sites-available/bapi.ingasti.com /etc/nginx/sites-enabled/
                        sudo rm -f /etc/nginx/sites-enabled/default || true
                        
                        # Test and reload nginx
                        sudo nginx -t
                        sudo systemctl reload nginx
                        
                        echo "✅ Nginx configuration deployed successfully"
                    """
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying blog to Kubernetes..."
                    
                    // Update deployment files with current image tags
                    sh """
                        cd k8s
                        
                        # Create namespace if it doesn't exist
                        kubectl create namespace blog --dry-run=client -o yaml | kubectl apply -f -
                        
                        # Update deployment files with current image tags
                        cp backend-deployment.yaml backend-deployment.yaml.bak
                        cp frontend-deployment.yaml frontend-deployment.yaml.bak
                        
                        sed -i 's|localhost:5000/blog-backend:.*|${env.BACKEND_IMAGE}|g' backend-deployment.yaml
                        sed -i 's|localhost:5000/blog-frontend:.*|${env.FRONTEND_IMAGE}|g' frontend-deployment.yaml
                        
                        # Apply Kubernetes manifests
                        kubectl apply -f namespace.yaml
                        kubectl apply -f blog-secrets.yaml
                        kubectl apply -f storage.yaml
                        kubectl apply -f backend-deployment.yaml
                        kubectl apply -f frontend-deployment.yaml
                        kubectl apply -f network-policy.yaml
                        
                        # Wait for deployments to be ready
                        kubectl wait --for=condition=available --timeout=300s deployment/blog-backend -n blog
                        kubectl wait --for=condition=available --timeout=300s deployment/blog-frontend -n blog
                        
                        # Restore original deployment files
                        mv frontend-deployment.yaml.bak frontend-deployment.yaml
                        mv backend-deployment.yaml.bak backend-deployment.yaml
                    """
                    
                    echo "✅ Kubernetes deployment completed"
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    echo "🔍 Verifying blog deployment..."
                    sh """
                        # Check deployment status
                        kubectl get all -n blog
                        
                        # Check pod status
                        kubectl get pods -n blog -o wide
                        
                        # Check for any issues
                        kubectl describe pods -n blog -l app=blog-backend | grep -A 10 Events || true
                        kubectl describe pods -n blog -l app=blog-frontend | grep -A 10 Events || true
                        
                        # Internal health checks
                        echo "🏥 Performing internal health checks..."
                        kubectl run health-check-backend --image=busybox --rm -i --restart=Never --timeout=60s -- /bin/sh -c "wget -qO- http://blog-backend-service.blog.svc.cluster.local/health && echo 'Backend health check passed'" || echo "Backend health check failed"
                        
                        kubectl run health-check-frontend --image=busybox --rm -i --restart=Never --timeout=60s -- /bin/sh -c "wget -qO- http://blog-frontend-service.blog.svc.cluster.local/health && echo 'Frontend health check passed'" || echo "Frontend health check failed"
                    """
                }
            }
        }
        
        stage('Show Recent Logs') {
            steps {
                script {
                    echo "📋 Recent application logs:"
                    sh """
                        echo "Backend logs:"
                        kubectl logs -n blog -l app=blog-backend --tail=20 || echo "Could not fetch backend logs"
                        
                        echo "Frontend logs:"
                        kubectl logs -n blog -l app=blog-frontend --tail=20 || echo "Could not fetch frontend logs"
                    """
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Cleanup old Docker images to save space
                sh """
                    echo "🧹 Cleaning up old Docker images..."
                    # Keep only the latest 5 images for each service
                    docker images ${REGISTRY_URL}/blog-backend --format "table {{.Tag}}\t{{.ID}}" | tail -n +2 | grep -v latest | awk '{print \$2}' | tail -n +6 | xargs -r docker rmi || true
                    docker images ${REGISTRY_URL}/blog-frontend --format "table {{.Tag}}\t{{.ID}}" | tail -n +2 | grep -v latest | awk '{print \$2}' | tail -n +6 | xargs -r docker rmi || true
                """
            }
        }
        success {
            echo "🎉 Blog deployment pipeline completed successfully!"
            echo ""
            echo "📱 Blog services should be available at:"
            echo "  Frontend: https://blog.ingasti.com"
            echo "  Backend: https://bapi.ingasti.com"
            echo ""
            echo "🔍 Monitor with:"
            echo "  kubectl get pods -n blog -w"
            echo "  kubectl logs -f deployment/blog-backend -n blog"
            echo "  kubectl logs -f deployment/blog-frontend -n blog"
            
            script {
                // Show final status
                sh """
                    echo "🌐 Service and Ingress Status:"
                    kubectl get services -n blog
                    kubectl get ingress -n blog
                """
            }
        }
        failure {
            echo "❌ Blog deployment pipeline failed!"
            echo ""
            echo "🔍 Debug information:"
            script {
                sh """
                    echo "Kubernetes cluster status:"
                    kubectl get nodes || true
                    kubectl get pods -n blog || true
                    kubectl get events -n blog --sort-by=.metadata.creationTimestamp | tail -10 || true
                """
            }
        }
    }
}
