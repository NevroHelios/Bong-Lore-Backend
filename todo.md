1. ✅ ORGANISE THE CODE FOR AUTHENTICATION USING ROUTES AND CONTROLLERS
2. ✅ FIX THE 'AUTHMIDDLEWARE' ERROR!
3. TODO: Add proper error handling for file uploads
4. TODO: Implement rate limiting for API endpoints
5. TODO: Add input validation for all POST routes
6. ✅ Set up database indexes for better performance
7. TODO: Add API documentation (Swagger/OpenAPI)
8. TODO: Implement proper logging system
9. TODO: Add unit tests for controllers and middlewares
10. TODO: Set up environment-specific configurations
11. ✅ Implement vector search for Bengali cultural content

## Vector Search for Bengali Cultural Heritage

We've implemented a comprehensive vector search system to help users discover related Bengali cultural content across posts, events, media items, and tags.

### MongoDB Vector Index Creation Commands

To create the required vector indexes, execute these commands:

```javascript
// 1. Create Post Vector Index
db.posts.createSearchIndex({
  name: "bengaliPostVectorIndex",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        textEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        multimodalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        culturalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        userId: { type: "string" },
        tags: { type: "string" },
        visibility: { type: "string" },
        "aiSummary.summaryType": { type: "string" },
      },
    },
  },
});

// 2. Create Media Vector Index
db.mediaitems.createSearchIndex({
  name: "bengaliMediaVectorIndex",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        visualEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        textEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        multimodalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        culturalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        type: { type: "string" },
        tags: { type: "string" },
        userId: { type: "string" },
      },
    },
  },
});

// 3. Create Combined Vector Index for Events
// Note: This is a combined index due to Atlas free tier limitations
db.communityevents.createSearchIndex({
  name: "bengaliCombinedVectorIndex",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        textEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        culturalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine",
        },
        eventType: { type: "string" },
        tags: { type: "string" },
        culturalTags: { type: "string" },
        date: { type: "date" },
        visibility: { type: "string" },
      },
    },
  },
});
```

### API Endpoint for Vector Index Initialization

You can also create all vector indexes via the API endpoint:

```bash
curl -X POST http://localhost:5000/api/vector/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Vector Search Usage Examples

#### 1. Find similar posts to an existing post:

```bash
curl -X POST http://localhost:5000/api/vector/search/posts \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "65fa12345b6789abcdef1234",
    "embedType": "cultural",
    "limit": 5,
    "minScore": 0.7
  }'
```

#### 2. Search for posts using a text query:

```bash
curl -X POST http://localhost:5000/api/vector/search/posts \
  -H "Content-Type: application/json" \
  -d '{
    "query": "durga puja festival traditions in kolkata",
    "embedType": "text",
    "tags": ["festival", "durga-puja"],
    "limit": 10
  }'
```

#### 3. Find similar events:

```bash
curl -X POST http://localhost:5000/api/vector/search/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "65fa12345b6789abcdef5678",
    "embedType": "cultural",
    "upcoming": true,
    "limit": 5
  }'
```

#### 4. Search for events by description:

```bash
curl -X POST http://localhost:5000/api/vector/search/events \
  -H "Content-Type: application/json" \
  -d '{
    "query": "bengali new year celebration pohela boishakh",
    "eventType": "cultural",
    "upcoming": true
  }'
```

#### 5. Find similar media items:

```bash
curl -X POST http://localhost:5000/api/vector/search/media \
  -H "Content-Type: application/json" \
  -d '{
    "mediaId": "65fa12345b6789abcdef9012",
    "embedType": "multimodal",
    "mediaType": "photo",
    "limit": 10
  }'
```

#### 6. Find media by visual similarity:

```bash
curl -X POST http://localhost:5000/api/vector/search/media \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/your-image.jpg",
    "embedType": "visual",
    "tags": ["festival", "art"]
  }'
```

### Generate Embeddings for Content

Generate vector embeddings for specific content:

```bash
# Generate embeddings for a post
curl -X POST http://localhost:5000/api/vector/embeddings/post/65fa12345b6789abcdef1234 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Generate embeddings for a media item
curl -X POST http://localhost:5000/api/vector/embeddings/media/65fa12345b6789abcdef5678 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Generate embeddings for an event
curl -X POST http://localhost:5000/api/vector/embeddings/event/65fa12345b6789abcdef9012 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## New API Endpoint: `/video/highlights`

**Method:** POST  
**URL:** `http://localhost:your-port/video/highlights`

### Request Body:

```json
{
  "cloudinaryUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/sample.mp4",
  "outputDir": "/optional/output/directory",
  "outputFilename": "optional-filename.mp4"
}
```

### Response:

```json
{
  "message": "Video highlights created successfully",
  "highlightsPath": "/path/to/created/highlights.mp4",
  "originalVideo": "https://res.cloudinary.com/your-cloud/...",
  "createdAt": "2025-06-17T23:45:00.000Z"
}
```

### How to test it:

1. **Start your server:**

   ```bash
   npm run dev
   ```

2. **Make a POST request:**

   ```bash
   curl -X POST http://localhost:3000/video/highlights \
     -H "Content-Type: application/json" \
     -d '{
       "cloudinaryUrl": "https://res.cloudinary.com/dgyiptxfq/video/upload/v1750076823/BANGALIANA/lqdcirgpismmsisnee4q.mp4"
     }'
   ```

3. **Or use a tool like Postman/Insomnia** to test the endpoint

The route will:

1. Accept a Cloudinary video URL
2. Use your `extractVideoHighlights` function to analyze the video with Gemini AI
3. Extract peak moments and create a highlights video
4. Return the path to the created highlights video

Make sure you have your `GEMINI_API_KEY` environment variable set before testing!

deployment push
-H "Content-Type: application/json" \
 -d '{
"cloudinaryUrl": "https://res.cloudinary.com/dgyiptxfq/video/upload/v1750076823/BANGALIANA/lqdcirgpismmsisnee4q.mp4"
}'

```

3. **Or use a tool like Postman/Insomnia** to test the endpoint

The route will:

1. Accept a Cloudinary video URL
2. Use your `extractVideoHighlights` function to analyze the video with Gemini AI
3. Extract peak moments and create a highlights video
4. Return the path to the created highlights video

Make sure you have your `GEMINI_API_KEY` environment variable set before testing!

deployment push
```
