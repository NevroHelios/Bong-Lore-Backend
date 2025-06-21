# 🎬 Video Processing API Documentation

## Complete Video Highlights Workflow

### 1. Process Video Highlights (Complete Workflow)

**Endpoint:** `POST /api/media/video/process-complete`

**Description:** Extracts 30-second highlights from a video, uploads to Cloudinary, and saves as MediaItem in database.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-auth-token>
```

**Request Body:**
```json
{
  "cloudinaryUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/sample.mp4",
  "title": "My Video Highlights",        // Optional
  "description": "AI-generated highlights" // Optional
}
```

**Response (Success):**
```json
{
  "message": "Video highlights processed and saved successfully",
  "data": {
    "_id": "60f7b1234567890abcdef123",
    "uri": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/highlights.mp4",
    "type": "video",
    "title": "My Video Highlights",
    "description": "AI-generated highlights",
    "timestamp": 1634567890123,
    "aspectRatio": 1.777,
    "aiSummary": {
      "summary": "AI-generated video highlights showcasing the most engaging moments",
      "hashtags": ["highlights", "video", "ai-generated"],
      "mood": "engaging",
      "themes": ["video-editing", "highlights"],
      "generatedAt": "2025-06-20T10:30:00.000Z",
      "summaryType": "media"
    },
    "likes": [],
    "comments": []
  },
  "originalVideoUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/sample.mp4",
  "highlightsVideoUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/highlights.mp4",
  "createdAt": "2025-06-20T10:30:00.000Z"
}
```

---

### 2. Get MediaItem for Display

**Endpoint:** `GET /api/media/media/:mediaItemId`

**Description:** Retrieves a specific MediaItem by ID for frontend display.

**Parameters:**
- `mediaItemId`: MongoDB ObjectId of the MediaItem

**Response (Success):**
```json
{
  "message": "MediaItem retrieved successfully",
  "data": {
    "_id": "60f7b1234567890abcdef123",
    "uri": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/highlights.mp4",
    "type": "video",
    "title": "My Video Highlights",
    "description": "AI-generated highlights",
    "timestamp": 1634567890123,
    "aspectRatio": 1.777,
    "likes": 0,
    "comments": 0,
    "aiSummary": {
      "summary": "AI-generated video highlights showcasing the most engaging moments",
      "hashtags": ["highlights", "video", "ai-generated"],
      "mood": "engaging",
      "themes": ["video-editing", "highlights"]
    },
    "user": {
      "_id": "60f7b1234567890abcdef456",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### 3. Get User's Video Highlights

**Endpoint:** `GET /api/media/user/video-highlights`

**Description:** Retrieves all video highlights created by the authenticated user.

**Headers:**
```
Authorization: Bearer <your-auth-token>
```

**Response (Success):**
```json
{
  "message": "Video highlights retrieved successfully",
  "data": [
    {
      "_id": "60f7b1234567890abcdef123",
      "uri": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/highlights1.mp4",
      "title": "Beach Vacation Highlights",
      "description": "AI-generated highlights",
      "timestamp": 1634567890123,
      "aspectRatio": 1.777,
      "likes": 5,
      "comments": 2
    },
    {
      "_id": "60f7b1234567890abcdef124",
      "uri": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/highlights2.mp4",
      "title": "Wedding Ceremony Highlights",
      "description": "Best moments from the ceremony",
      "timestamp": 1634567890456,
      "aspectRatio": 1.777,
      "likes": 12,
      "comments": 8
    }
  ],
  "count": 2
}
```

---

## 🔄 Complete Workflow Example

### Frontend Implementation (React/Next.js)

```javascript
// 1. Process video and create highlights
const processVideo = async (videoUrl, title, description) => {
  try {
    const response = await fetch('/api/media/video/process-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        cloudinaryUrl: videoUrl,
        title: title,
        description: description
      })
    });
    
    const result = await response.json();
    
    if (result.data) {
      console.log('✅ Video processed:', result.data);
      return result.data; // MediaItem object
    }
  } catch (error) {
    console.error('❌ Error processing video:', error);
  }
};

// 2. Display video in component
const VideoHighlight = ({ mediaItemId }) => {
  const [videoData, setVideoData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/media/media/${mediaItemId}`)
      .then(res => res.json())
      .then(data => setVideoData(data.data));
  }, [mediaItemId]);
  
  if (!videoData) return <div>Loading...</div>;
  
  return (
    <div className="video-highlight">
      <h3>{videoData.title}</h3>
      <video 
        src={videoData.uri} 
        controls 
        className="w-full h-auto"
        style={{ aspectRatio: videoData.aspectRatio }}
      />
      <p>{videoData.description}</p>
      <div className="stats">
        👍 {videoData.likes} likes • 💬 {videoData.comments} comments
      </div>
      <div className="hashtags">
        {videoData.aiSummary?.hashtags?.map(tag => (
          <span key={tag} className="hashtag">#{tag}</span>
        ))}
      </div>
    </div>
  );
};

// 3. Get all user's video highlights
const getUserHighlights = async () => {
  try {
    const response = await fetch('/api/media/user/video-highlights', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    return result.data; // Array of video highlights
  } catch (error) {
    console.error('❌ Error fetching highlights:', error);
  }
};
```

---

## 🚀 How to Use

1. **Upload original video** to Cloudinary first
2. **Call the complete processing endpoint** with the Cloudinary URL
3. **Get the MediaItem ID** from the response
4. **Use the MediaItem ID** to display the video in your frontend
5. **Fetch user highlights** to show all processed videos

The system will:
- ✅ Extract 30-second highlights using AI
- ✅ Upload the highlights video to Cloudinary
- ✅ Save MediaItem to MongoDB with metadata
- ✅ Return all necessary data for frontend display

---

## 📱 Frontend Display Format

For optimal frontend display, use the returned data structure:

```json
{
  "_id": "unique-media-id",
  "uri": "cloudinary-video-url",
  "title": "user-friendly-title",
  "description": "description-text",
  "aspectRatio": 1.777,
  "likes": 0,
  "comments": 0,
  "hashtags": ["ai-generated", "hashtags"]
}
```
