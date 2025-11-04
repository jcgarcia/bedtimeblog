# 🚀 EKS Migration Guide - Bedtime Blog

## Overview

This guide covers migrating the Bedtime Blog from K3s (self-managed Kubernetes) to AWS EKS (Elastic Kubernetes Service).

## 🏗️ Architecture Changes

### Current (K3s on Oracle Cloud)
- **Platform**: K3s on Oracle Cloud ARM64 instances
- **Build**: ARM64 Docker images built on Jenkins agent
- **Registry**: Local Docker registry (localhost:5000)
- **Storage**: Local volumes
- **Load Balancer**: Custom Caddy/Nginx setup
- **OIDC**: Self-managed OIDC provider

### Target (EKS on AWS)
- **Platform**: AWS EKS managed Kubernetes
- **Build**: Multi-architecture (AMD64/ARM64) Docker images
- **Registry**: AWS ECR (Elastic Container Registry)
- **Storage**: EBS volumes (GP3) + optional EFS
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **OIDC**: EKS native OIDC for service accounts

## 🚧 Key Differences & Challenges

### 1. **Architecture Compatibility**
- **Current**: ARM64-only builds (Oracle Cloud ARM instances)
- **EKS**: Supports both AMD64 and ARM64 (Graviton) instances
- **Solution**: Multi-architecture Docker builds using `docker buildx`

### 2. **Container Registry**
- **Current**: Local registry (localhost:5000)
- **EKS**: AWS ECR with proper authentication
- **Migration**: Update all image references in manifests

### 3. **Storage**
- **Current**: Local persistent volumes
- **EKS**: EBS volumes (ReadWriteOnce) + EFS (ReadWriteMany)
- **Migration**: Update PVC configurations

### 4. **Service Authentication**
- **Current**: Self-managed OIDC provider
- **EKS**: AWS IAM roles for service accounts (IRSA)
- **Benefit**: Native AWS service integration

## 📋 Prerequisites

### AWS Requirements
1. **AWS Account** with appropriate permissions
2. **EKS Cluster** created (or will be created by eksctl)
3. **ECR Repositories** for container images
4. **IAM Roles** for service accounts (OIDC)
5. **ACM Certificate** for HTTPS termination
6. **Route53** (optional) for DNS management

### Local Tools
1. **AWS CLI v2** - AWS service interaction
2. **kubectl** - Kubernetes cluster management
3. **eksctl** - EKS cluster management
4. **docker buildx** - Multi-architecture builds

## 🛠️ Setup Steps

### 1. Create EKS Cluster

```bash
# Create EKS cluster with managed node groups
eksctl create cluster \
  --name bedtime-blog-cluster \
  --region us-west-2 \
  --node-type m5.large \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed \
  --with-oidc

# Or use Graviton (ARM64) instances for cost savings
eksctl create cluster \
  --name bedtime-blog-cluster \
  --region us-west-2 \
  --node-type m6g.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed \
  --with-oidc
```

### 2. Install Required EKS Add-ons

```bash
# Install AWS Load Balancer Controller
eksctl create iamserviceaccount \
  --cluster=bedtime-blog-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess \
  --approve

# Install the controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --set clusterName=bedtime-blog-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  -n kube-system

# Install EBS CSI driver (for persistent volumes)
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster bedtime-blog-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve

eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster bedtime-blog-cluster \
  --service-account-role-arn arn:aws:iam::ACCOUNT_ID:role/AmazonEKS_EBS_CSI_DriverRole
```

### 3. Create IAM Roles for Service Accounts

```bash
# Create role for media access (S3 OIDC)
eksctl create iamserviceaccount \
  --name media-access-sa \
  --namespace blog \
  --cluster bedtime-blog-cluster \
  --attach-policy-arn arn:aws:iam::ACCOUNT_ID:policy/BedtimeBlogMediaPolicy \
  --approve

# Create general service account role
eksctl create iamserviceaccount \
  --name blog-service-account \
  --namespace blog \
  --cluster bedtime-blog-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy \
  --approve
```

### 4. Create ECR Repositories

```bash
# Create ECR repositories
aws ecr create-repository --repository-name bedtime-blog-frontend --region us-west-2
aws ecr create-repository --repository-name bedtime-blog-backend --region us-west-2

# Set lifecycle policies to manage storage costs
aws ecr put-lifecycle-configuration \
  --repository-name bedtime-blog-frontend \
  --lifecycle-policy-text file://ecr-lifecycle-policy.json \
  --region us-west-2
```

### 5. Update Jenkins Pipeline

The new `Jenkinsfile.eks` includes:
- Multi-architecture Docker builds
- ECR authentication and push
- EKS cluster deployment
- Proper health checks

### 6. Deploy Application

```bash
# Apply all EKS manifests
kubectl apply -f eks/ -n blog

# Monitor deployment
kubectl get pods -n blog -w
kubectl get services -n blog
kubectl get ingress -n blog
```

## 🔄 Migration Process

### Phase 1: Preparation
1. ✅ Create EKS branch from k8s branch
2. ✅ Create EKS-specific Dockerfiles (multi-arch)
3. ✅ Create EKS Kubernetes manifests
4. ✅ Update Jenkins pipeline for EKS
5. 🔄 Test builds locally

### Phase 2: Infrastructure Setup
1. 🔄 Create EKS cluster
2. 🔄 Install required add-ons
3. 🔄 Create IAM roles and policies
4. 🔄 Set up ECR repositories
5. 🔄 Configure DNS and certificates

### Phase 3: Application Deployment
1. 🔄 Deploy PostgreSQL with persistent storage
2. 🔄 Deploy backend with OIDC service account
3. 🔄 Deploy frontend with ALB ingress
4. 🔄 Test all functionality
5. 🔄 Configure monitoring and logging

### Phase 4: Cutover
1. 🔄 Update DNS to point to ALB
2. 🔄 Monitor performance and stability
3. 🔄 Decommission old infrastructure

## 💰 Cost Considerations

### EKS Costs
- **EKS Control Plane**: ~$73/month
- **Worker Nodes**: 2x m5.large = ~$140/month
- **EBS Storage**: ~$5-10/month
- **Data Transfer**: Variable
- **Total Estimated**: ~$220-250/month

### Cost Optimization Options
1. **Use Graviton instances** (m6g.medium) - 20% cost savings
2. **Spot instances** for non-critical workloads
3. **EBS GP3 volumes** instead of GP2
4. **ALB vs NLB** cost comparison
5. **Reserved instances** for predictable workloads

## 🔍 Monitoring & Observability

### Built-in EKS Features
- **CloudWatch Container Insights**
- **AWS X-Ray** for distributed tracing
- **VPC Flow Logs** for network monitoring
- **EKS Control Plane Logging**

### Optional Add-ons
- **Prometheus + Grafana** for metrics
- **Fluentd/Fluent Bit** for log aggregation
- **Jaeger** for distributed tracing

## 🚨 Rollback Plan

1. **DNS Switch**: Change Route53 records back to Oracle Cloud
2. **Data Sync**: Ensure database is synchronized
3. **Traffic Validation**: Verify all services working
4. **Monitoring**: Watch for any issues

## 📝 Next Steps

1. **Review and customize** the EKS manifests for your specific requirements
2. **Update placeholder values** (ACCOUNT_ID, REGION, etc.)
3. **Test the Jenkins pipeline** in a development environment
4. **Plan the migration timeline** considering downtime requirements
5. **Set up monitoring** and alerting before going live

---

**Status**: 🚧 **Ready for Infrastructure Setup**
**Last Updated**: November 4, 2025
**Next Phase**: Create EKS cluster and test deployment