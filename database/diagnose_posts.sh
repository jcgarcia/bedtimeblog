#!/bin/bash

# Quick API and database diagnosis script
echo "🔧 Diagnosing Post Management issues..."
echo ""

# Test 1: Check if API is responding
echo "1️⃣ Testing API endpoint..."
curl -s "http://localhost:5000/api/posts" | head -200 || echo "❌ API not responding locally"

echo ""
echo "2️⃣ Testing production API..."
curl -s "https://blog.ingasti.com/api/posts" | head -200 || echo "❌ Production API not responding"

echo ""
echo "3️⃣ If API is working but no posts shown, check database directly..."
echo "Run this command on your server:"
echo "psql \$DATABASE_URL -c \"SELECT id, title, status, published_at, created_at FROM posts ORDER BY created_at DESC LIMIT 5;\""
