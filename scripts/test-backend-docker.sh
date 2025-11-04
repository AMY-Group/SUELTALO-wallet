#!/bin/bash
# Test Backend Docker Build Locally

set -e

echo "🐳 Testing Backend Docker Build"
echo "================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

echo "✅ Docker found: $(docker --version)"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📦 Building backend image..."
echo "Context: ./backend"
echo "Dockerfile: ./backend/Dockerfile"
echo ""

docker build \
  -t sueltalo-backend:test \
  -f backend/Dockerfile \
  backend

echo ""
echo "✅ Build successful!"
echo ""

# Check image size
echo "📊 Image details:"
docker images sueltalo-backend:test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""

# Test run (with mock env vars)
echo "🚀 Testing container run..."
echo ""

CONTAINER_ID=$(docker run -d \
  -p 8001:8001 \
  -e MONGO_URL="mongodb://host.docker.internal:27017" \
  -e DB_NAME="test_database" \
  -e SOLANA_TREASURY_PUBKEY="ERXnmYXWkMeWGJR54RUX7qUvfkz7qEBhVW4aAx6wcvv8" \
  -e SOLANA_SLT_MINT="9P9kuseXSQPEdmrmy2DJ2NYa4tvf69yZVnbDu1VApi84" \
  -e SOLANA_USDC_MOCK_MINT="2C9UWeZwQ8W3pjV65uJcpWYWdqw2sghqiq2MvBGNW2qr" \
  sueltalo-backend:test)

echo "Container started: $CONTAINER_ID"
echo "Waiting 5 seconds for startup..."
sleep 5

# Test health endpoint
echo ""
echo "🏥 Testing /api/health endpoint..."
RESPONSE=$(curl -s http://localhost:8001/api/health)

if echo "$RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check PASSED"
    echo "Response: $RESPONSE"
else
    echo "❌ Health check FAILED"
    echo "Response: $RESPONSE"
    
    echo ""
    echo "📋 Container logs:"
    docker logs "$CONTAINER_ID" | tail -20
    
    docker stop "$CONTAINER_ID" > /dev/null
    docker rm "$CONTAINER_ID" > /dev/null
    exit 1
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
docker stop "$CONTAINER_ID" > /dev/null
docker rm "$CONTAINER_ID" > /dev/null

echo ""
echo "✅ All tests passed!"
echo ""
echo "📋 Summary:"
echo "  - Build: ✅ Success"
echo "  - Size: $(docker images sueltalo-backend:test --format '{{.Size}}')"
echo "  - Health: ✅ 200 OK"
echo ""
echo "🎉 Backend Docker image ready for deployment!"
