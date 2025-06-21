# API Documentation - Gemini Summary Features

## Overview
This API provides AI-powered content summarization using Google's Gemini AI for posts, community events, and media collections.

## New Models

### Post Model
- **Fields**: title, description, mediaItems[], tags[], location, aiSummary, culturalContext, creativeContext, travelContext
- **AI Summary Types**: post, cultural, creative, travel

### CommunityEvent Model  
- **Fields**: name, description, eventType, date, location, participants[], mediaItems[], aiSummary, culturalSignificance
- **Event Types**: cultural, social, educational, religious, festival, workshop, celebration, other

### Enhanced MediaItem Model
- **New Fields**: aiSummary, culturalContext, creativeContext, travelContext

## API Endpoints

### Posts

#### Create Post with Media
```
POST /api/posts/createpost
Content-Type: multipart/form-data

Body:
- mediaFiles: File[] (up to 20 files)
- postTitle: string (optional)
- postDescription: string (optional) 
- postTags: string[] or comma-separated string (optional)
- latitude: number (optional)
- longitude: number (optional)
- locationName: string (optional)
- visibility: "public" | "private" | "community" (default: public)
- summaryType: "post" | "cultural" | "creative" | "travel" (default: post)
```

Response:
```json
{
  "message": "Post created successfully",
  "post": { /* Post object */ },
  "mediaItems": [ /* MediaItem objects */ ],
  "count": 3
}
```

#### Get Posts
```
GET /api/posts?page=1&limit=10&userId=123&featured=true&summaryType=cultural&tags=heritage,art&location=Kolkata
```

Response:
```json
{
  "posts": [ /* Post objects with populated mediaItems and user */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### Generate Post Summary
```
POST /api/posts/:postId/generate-summary
Authorization: Required

Body:
{
  "summaryType": "cultural" | "creative" | "travel" | "post",
  "options": {
    "style": "brief" | "detailed" | "creative" | "formal",
    "language": "english" | "bengali" | "bilingual",
    "maxLength": 300,
    "includeHashtags": true,
    "focusAreas": ["heritage", "art", "tradition"]
  }
}
```

### Community Events

#### Create Community Event
```
POST /api/posts/events
Authorization: Required

Body:
{
  "name": "Durga Puja Celebration",
  "description": "Annual community celebration",
  "eventType": "cultural",
  "date": "2025-10-15T10:00:00Z",
  "endDate": "2025-10-18T22:00:00Z",
  "location": {
    "latitude": 22.5726,
    "longitude": 88.3639,
    "name": "Kolkata",
    "address": "Park Street, Kolkata"
  },
  "maxParticipants": 500,
  "registrationRequired": true,
  "tags": ["durga-puja", "festival"],
  "culturalTags": ["bengali-culture", "religious"],
  "visibility": "public"
}
```

#### Generate Event Summary
```
POST /api/posts/events/:eventId/generate-summary
Authorization: Required

Body:
{
  "options": {
    "style": "detailed",
    "language": "bilingual",
    "maxLength": 400,
    "focusAreas": ["participation", "cultural impact", "community engagement"]
  }
}
```

### Collection Summaries

#### Generate Multi-Post Summary
```
POST /api/posts/collections/generate-summary
Authorization: Required

Body:
{
  "postIds": ["post1_id", "post2_id", "post3_id"],
  "options": {
    "style": "detailed",
    "language": "english",
    "maxLength": 500,
    "focusAreas": ["themes", "cultural significance"]
  }
}
```

Response:
```json
{
  "message": "Collection summary generated successfully",
  "summary": {
    "summary": "Comprehensive analysis of the collection...",
    "themes": ["heritage", "art", "tradition"],
    "highlights": ["Outstanding cultural preservation", "Beautiful artistic elements"],
    "stats": {
      "totalPosts": 3,
      "totalMedia": 15,
      "commonThemes": ["heritage", "culture"],
      "locations": ["Kolkata", "Dhaka"]
    }
  },
  "postsAnalyzed": 3
}
```

## Summary Types

### 1. Post Summary (default)
- General content analysis
- Hashtag generation
- Mood detection
- Theme identification

### 2. Cultural Heritage Summary
- Cultural significance assessment
- Historical context analysis
- Preservation importance
- Heritage value documentation

### 3. Creative Story Summary
- Artistic interpretation
- Narrative development
- Creative elements analysis  
- Aesthetic evaluation

### 4. Travel Location Summary
- Attraction identification
- Travel recommendations
- Tips and insights
- Cultural observations

## Response Structures

### AI Summary Object
```json
{
  "summary": "Generated summary text...",
  "hashtags": ["#heritage", "#culture", "#bengali"],
  "mood": "respectful" | "inspiring" | "adventurous" | "neutral",
  "themes": ["cultural heritage", "tradition"],
  "generatedAt": "2025-06-15T10:30:00Z",
  "summaryType": "cultural"
}
```

### Cultural Context Object
```json
{
  "significance": "High cultural importance...",
  "historicalContext": "Dating back to ancient times...",
  "preservation": "Requires urgent conservation...",
  "period": "Medieval period"
}
```

### Creative Context Object
```json
{
  "narrative": "The artistic expression captures...",
  "artisticElements": ["color harmony", "composition", "symbolism"],
  "genre": "traditional art",
  "inspiration": "Bengali folk traditions"
}
```

### Travel Context Object
```json
{
  "attractions": ["Victoria Memorial", "Howrah Bridge"],
  "recommendations": ["Visit during evening", "Try local cuisine"],
  "travelTips": ["Carry umbrella during monsoon", "Learn basic Bengali phrases"],
  "season": "winter",
  "travelStyle": "cultural tourism"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request parameters",
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "message": "User not authenticated"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Post not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error generating summary",
  "error": "Gemini API timeout"
}
```

## Usage Examples

### Creating a Cultural Heritage Post
1. Upload media files with cultural significance
2. Set `summaryType: "cultural"` in the request
3. AI automatically generates cultural context and preservation notes

### Community Event Documentation
1. Create event with date, location, and participants
2. Upload event photos/videos
3. Generate summary for impact assessment and community engagement analysis

### Travel Documentation
1. Create post with location data
2. Upload travel photos/videos
3. Generate travel summary for recommendations and tips

## Rate Limits
- Summary generation: 10 requests per minute per user
- Post creation: 20 requests per minute per user
- Event creation: 5 requests per minute per user
