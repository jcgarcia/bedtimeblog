# 🗄️ AWS S3 Media Storage Setup Guide

## 📊 Overview
This guide will help you set up AWS S3 for media storage with the custom domain `media.ingasti.com`.

## 🎯 Prerequisites
- AWS Account with billing configured
- Domain access for `ingasti.com`
- AWS CLI installed (optional but recommended)

## 🚀 Step 1: Create S3 Bucket

### 1.1 Create Bucket
```bash
aws s3 mb s3://bedtime-blog-media --region us-east-1
```

Or via AWS Console:
1. Go to S3 Console
2. Click "Create bucket"
3. Bucket name: `bedtime-blog-media`
4. Region: `US East (N. Virginia) us-east-1`
5. Uncheck "Block all public access"
6. Create bucket

### 1.2 Configure Bucket Policy
Apply this bucket policy for public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bedtime-blog-media/*"
    }
  ]
}
```

### 1.3 Configure CORS
Add CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://blog.ingasti.com",
      "https://bapi.ingasti.com",
      "http://localhost:3000",
      "http://localhost:5000"
    ],
    "ExposeHeaders": []
  }
]
```

## 🌐 Step 2: Setup CloudFront Distribution

### 2.1 Create Distribution
1. Go to CloudFront Console
2. Click "Create Distribution"
3. Configure:
   - **Origin Domain**: bedtime-blog-media.s3.amazonaws.com
   - **Origin Path**: (leave empty)
   - **Name**: media-ingasti-com
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache Policy**: CachingOptimized
   - **Price Class**: Use All Edge Locations

### 2.2 Configure Custom Domain
1. In the distribution settings:
   - **Alternate Domain Names (CNAMEs)**: media.ingasti.com
   - **SSL Certificate**: Request or select certificate for *.ingasti.com

## 🔒 Step 3: SSL Certificate

### 3.1 Request Certificate (if not existing)
1. Go to AWS Certificate Manager (ACM)
2. Click "Request certificate"
3. Domain: `*.ingasti.com` (wildcard for subdomains)
4. Validation method: DNS validation
5. Add CNAME records to your DNS

## 🌍 Step 4: DNS Configuration

Add CNAME record to your DNS provider:
```
Type: CNAME
Name: media
Value: [your-cloudfront-domain].cloudfront.net
TTL: 300
```

Example:
```
media.ingasti.com -> d1234567890123.cloudfront.net
```

## 🔑 Step 5: IAM User & Permissions

### 5.1 Create IAM User
1. Go to IAM Console
2. Create user: `blog-media-uploader`
3. Access type: Programmatic access

### 5.2 Create Custom Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::bedtime-blog-media",
        "arn:aws:s3:::bedtime-blog-media/*"
      ]
    }
  ]
}
```

### 5.3 Attach Policy to User
1. Attach the custom policy to the user
2. Note down the Access Key ID and Secret Access Key

## ⚙️ Step 6: Configure Environment Variables

Add to your `.env.local` file:
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=bedtime-blog-media
CDN_URL=https://media.ingasti.com
```

## 🧪 Step 7: Test Configuration

### 7.1 Test S3 Access
```bash
aws s3 ls s3://bedtime-blog-media --profile your-profile
```

### 7.2 Test Upload
```bash
echo "test" > test.txt
aws s3 cp test.txt s3://bedtime-blog-media/test.txt --acl public-read
```

### 7.3 Test CDN Access
Visit: `https://media.ingasti.com/test.txt`

## 📊 Step 8: Monitor & Optimize

### 8.1 CloudWatch Metrics
- Monitor S3 request metrics
- Track CloudFront cache hit ratio
- Set up billing alerts

### 8.2 Cost Optimization
- Enable S3 Intelligent Tiering
- Set lifecycle policies for old files
- Monitor CloudFront usage

## 🔧 Troubleshooting

### Common Issues:

1. **403 Forbidden on uploads**
   - Check bucket policy
   - Verify IAM permissions
   - Ensure CORS is configured

2. **SSL certificate issues**
   - Ensure certificate is in us-east-1 region for CloudFront
   - Verify DNS validation records

3. **Domain not resolving**
   - Check DNS propagation
   - Verify CNAME record
   - Wait for CloudFront deployment (15-20 minutes)

4. **CORS errors in browser**
   - Update CORS policy with your exact domains
   - Ensure preflight OPTIONS requests are allowed

## ✅ Verification Checklist

- [ ] S3 bucket created and configured
- [ ] Bucket policy allows public read
- [ ] CORS policy configured
- [ ] CloudFront distribution created
- [ ] SSL certificate configured
- [ ] DNS CNAME record added
- [ ] IAM user created with proper permissions
- [ ] Environment variables configured
- [ ] Test upload successful
- [ ] CDN access working

## 🎉 Completion

Once all steps are complete, you should be able to:
1. Upload files through the Media Library
2. Access files via https://media.ingasti.com/path/to/file
3. Use media in blog posts
4. Manage files through the admin interface

Your media storage is now production-ready with global CDN delivery!
