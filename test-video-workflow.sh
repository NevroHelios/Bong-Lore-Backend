#!/bin/bash

echo "🎬 Testing Complete Video Processing Workflow"
echo "=============================================="

# Test the complete video processing endpoint
curl -X POST http://localhost:10000/api/media/video/process-complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "cloudinaryUrl": "https://res.cloudinary.com/dgyiptxfq/video/upload/v1750076823/BANGALIANA/lqdcirgpismmsisnee4q.mp4",
    "title": "AI Generated Video Highlights",
    "description": "30-second highlights extracted from original video using AI"
  }' | jq '.'

echo ""
echo "📺 Testing Get MediaItem endpoint"
echo "================================="

# Replace MEDIA_ITEM_ID with actual ID from above response
# curl -X GET http://localhost:10000/api/media/media/MEDIA_ITEM_ID | jq '.'

echo ""
echo "👤 Testing Get User Video Highlights"
echo "===================================="

# curl -X GET http://localhost:10000/api/media/user/video-highlights \
#   -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'

echo ""
echo "ℹ️  Note: Replace YOUR_TOKEN_HERE with actual auth token"
echo "ℹ️  Replace MEDIA_ITEM_ID with actual MediaItem ID from first response"
