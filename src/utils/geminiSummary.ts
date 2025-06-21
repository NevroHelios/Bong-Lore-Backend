import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI with API key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');
const MODEL_NAME = process.env.SUMMARY_MODEL_NAME!;

// Safety settings for content generation
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Interface definitions
interface MediaItem {
  url: string;
  type: 'image' | 'video';
  description?: string;
}

interface Post {
  id: string;
  title?: string;
  description?: string;
  media: MediaItem[];
  tags?: string[];
  location?: string;
  timestamp?: Date;
  author?: string;
}

interface CommunityEvent {
  id: string;
  name: string;
  description?: string;
  date: Date;
  location: string;
  media: MediaItem[];
  participants?: string[];
  eventType?: string;
}

interface SummaryOptions {
  maxLength?: number;
  style?: 'brief' | 'detailed' | 'creative' | 'formal';
  language?: 'english' | 'bengali' | 'bilingual';
  includeHashtags?: boolean;
  focusAreas?: string[];
}

// Helper function to download and convert media to base64
async function downloadMediaAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch media from ${url}`);
      return null;
    }
    
    const buffer = await response.buffer();
    const base64Data = buffer.toString('base64');
    
    // Determine MIME type from URL or response headers
    const contentType = response.headers.get('content-type') || '';
    let mimeType = contentType;
    
    if (!mimeType) {
      // Fallback: determine from URL extension
      if (url.includes('.jpg') || url.includes('.jpeg')) mimeType = 'image/jpeg';
      else if (url.includes('.png')) mimeType = 'image/png';
      else if (url.includes('.webp')) mimeType = 'image/webp';
      else if (url.includes('.mp4')) mimeType = 'video/mp4';
      else if (url.includes('.webm')) mimeType = 'video/webm';
      else mimeType = 'image/jpeg'; // Default fallback
    }
    
    return { data: base64Data, mimeType };
  } catch (error) {
    console.error(`Error downloading media from ${url}:`, error);
    return null;
  }
}

// Helper function to prepare media parts for Gemini
async function prepareMediaParts(mediaItems: MediaItem[]) {
  const parts = [];
  
  for (const item of mediaItems) {
    if (item.type === 'image') {
      const mediaData = await downloadMediaAsBase64(item.url);
      if (mediaData) {
        parts.push({
          inlineData: {
            data: mediaData.data,
            mimeType: mediaData.mimeType
          }
        });
      }
    }
    // Note: Video processing might need different handling depending on Gemini's capabilities
    // For now, we'll include video URLs in the text prompt
  }
  
  return parts;
}

/**
 * Generate a summary for a single post containing photos and videos
 */
export async function generatePostSummary(
  post: Post, 
  options: SummaryOptions = {}
): Promise<{ summary: string; hashtags?: string[]; mood?: string } | null> {
  try {
    const {
      maxLength = 200,
      style = 'detailed',
      language = 'english',
      includeHashtags = true,
      focusAreas = []
    } = options;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Prepare media parts
    const mediaParts = await prepareMediaParts(post.media);
    if(mediaParts.length === 0) {
      console.log('No media parts could be prepared for post summary');
    }else{
      console.log(`Prepared ${mediaParts.length} media parts for post summary`);
    }
    
    // Prepare video URLs for text prompt
    const videoUrls = post.media
      .filter(item => item.type === 'video')
      .map(item => item.url);
    
    // Build the prompt
    let prompt = `Analyze this post and create a ${style} summary in ${language}. `;
    
    if (post.title) prompt += `Post title: "${post.title}". `;
    if (post.description) prompt += `Post description: "${post.description}". `;
    if (post.location) prompt += `Location: ${post.location}. `;
    if (post.tags && post.tags.length > 0) prompt += `Existing tags: ${post.tags.join(', ')}. `;
    if (videoUrls.length > 0) prompt += `Video URLs: ${videoUrls.join(', ')}. `;
    
    prompt += `
Focus areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'general content analysis'}

Please provide:
1. A ${maxLength}-character summary that captures the essence of the post
2. ${includeHashtags ? 'Relevant hashtags (5-10)' : 'No hashtags needed'}
3. Overall mood/tone of the content
4. Key visual elements and themes

Format the response as JSON with fields: summary, hashtags, mood, themes.`;

    // Combine text and media parts
    const parts = [{ text: prompt }, ...mediaParts];
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings
    });
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || text,
        hashtags: parsed.hashtags || [],
        mood: parsed.mood || 'neutral'
      };
    } catch {
      // If JSON parsing fails, return raw text
      return {
        summary: text.substring(0, maxLength),
        hashtags: includeHashtags ? ['#post', '#content'] : [],
        mood: 'neutral'
      };
    }
    
  } catch (error) {
    console.error('Error generating post summary:', error);
    return null;
  }
}

/**
 * Generate a collective summary for an array of posts
 */
export async function generatePostsCollectionSummary(
  posts: Post[],
  options: SummaryOptions = {}
): Promise<{ summary: string; themes: string[]; highlights: string[]; stats: any } | null> {
  try {
    const {
      maxLength = 500,
      style = 'detailed',
      language = 'english',
      focusAreas = []
    } = options;

    if (posts.length === 0) {
      return { summary: 'No posts to summarize', themes: [], highlights: [], stats: {} };
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Prepare a sample of media from different posts (limit to avoid token limits)
    const sampleMedia: MediaItem[] = [];
    posts.slice(0, 5).forEach(post => {
      sampleMedia.push(...post.media.slice(0, 2)); // Max 2 media per post
    });
    
    const mediaParts = await prepareMediaParts(sampleMedia.slice(0, 10)); // Max 10 media items
    
    // Build comprehensive prompt
    let prompt = `Analyze this collection of ${posts.length} posts and create a comprehensive summary in ${language}.

Posts overview:`;
    
    posts.forEach((post, index) => {
      prompt += `
Post ${index + 1}:
- Title: ${post.title || 'Untitled'}
- Description: ${post.description || 'No description'}
- Media count: ${post.media.length}
- Tags: ${post.tags?.join(', ') || 'None'}
- Location: ${post.location || 'Not specified'}`;
    });
    
    prompt += `

Focus areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'general content analysis'}

Please provide a ${style} analysis with:
1. Overall summary (${maxLength} characters)
2. Common themes across posts
3. Key highlights and standout content
4. Statistics (most common tags, locations, content types)
5. Trends and patterns observed

Format as JSON with fields: summary, themes, highlights, stats.`;

    const parts = [{ text: prompt }, ...mediaParts];
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings
    });
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || text,
        themes: parsed.themes || [],
        highlights: parsed.highlights || [],
        stats: parsed.stats || {
          totalPosts: posts.length,
          totalMedia: posts.reduce((sum, post) => sum + post.media.length, 0)
        }
      };
    } catch {
      return {
        summary: text.substring(0, maxLength),
        themes: ['general'],
        highlights: [],
        stats: { totalPosts: posts.length }
      };
    }
    
  } catch (error) {
    console.error('Error generating posts collection summary:', error);
    return null;
  }
}

/**
 * Generate a summary for a community event
 */
export async function generateCommunityEventSummary(
  event: CommunityEvent,
  options: SummaryOptions = {}
): Promise<{ summary: string; highlights: string[]; participation: any; impact: string } | null> {
  try {
    const {
      maxLength = 300,
      style = 'detailed',
      language = 'english',
      focusAreas = []
    } = options;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Prepare media parts
    const mediaParts = await prepareMediaParts(event.media);
    
    // Build event-specific prompt
    let prompt = `Analyze this community event and create a ${style} summary in ${language}.

Event Details:
- Name: ${event.name}
- Description: ${event.description || 'No description provided'}
- Date: ${event.date.toDateString()}
- Location: ${event.location}
- Type: ${event.eventType || 'General event'}
- Participants: ${event.participants?.length || 0} people
- Media items: ${event.media.length}`;

    if (event.participants && event.participants.length > 0) {
      prompt += `\n- Participant sample: ${event.participants.slice(0, 5).join(', ')}`;
    }

    prompt += `

Focus areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'community engagement, cultural significance, participation'}

Please provide:
1. Event summary highlighting key moments and significance (${maxLength} characters)
2. Key highlights and memorable moments
3. Participation analysis (engagement level, diversity, community response)
4. Cultural/social impact assessment
5. Success factors and community benefits

Format as JSON with fields: summary, highlights, participation, impact.`;

    const parts = [{ text: prompt }, ...mediaParts];
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings
    });
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || text,
        highlights: parsed.highlights || [],
        participation: parsed.participation || { level: 'moderate', diversity: 'good' },
        impact: parsed.impact || 'positive community engagement'
      };
    } catch {
      return {
        summary: text.substring(0, maxLength),
        highlights: [],
        participation: { level: 'unknown' },
        impact: 'community event completed'
      };
    }
    
  } catch (error) {
    console.error('Error generating community event summary:', error);
    return null;
  }
}

/**
 * Generate a cultural heritage summary for historical/cultural content
 */
export async function generateCulturalHeritageSummary(
  media: MediaItem[],
  context: {
    title?: string;
    location?: string;
    period?: string;
    culturalContext?: string;
  },
  options: SummaryOptions = {}
): Promise<{ summary: string; culturalSignificance: string; historicalContext: string; preservation: string } | null> {
  try {
    const {
      maxLength = 400,
      style = 'detailed',
      language = 'bilingual',
      focusAreas = ['cultural heritage', 'historical significance', 'preservation']
    } = options;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const mediaParts = await prepareMediaParts(media);
    
    let prompt = `Analyze this cultural heritage content and provide a comprehensive ${style} summary in ${language}.

Context:
- Title: ${context.title || 'Cultural Heritage Item'}
- Location: ${context.location || 'Not specified'}
- Historical Period: ${context.period || 'Not specified'}
- Cultural Context: ${context.culturalContext || 'General heritage'}
- Media items: ${media.length}

Focus: ${focusAreas.join(', ')}

Please provide:
1. Cultural heritage summary (${maxLength} characters)
2. Cultural significance and meaning
3. Historical context and background
4. Preservation importance and current state
5. Educational value and community relevance

Format as JSON with fields: summary, culturalSignificance, historicalContext, preservation.`;

    const parts = [{ text: prompt }, ...mediaParts];
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings
    });
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || text,
        culturalSignificance: parsed.culturalSignificance || 'Significant cultural value',
        historicalContext: parsed.historicalContext || 'Historical importance noted',
        preservation: parsed.preservation || 'Requires preservation attention'
      };
    } catch {
      return {
        summary: text.substring(0, maxLength),
        culturalSignificance: 'Cultural heritage item',
        historicalContext: 'Historical significance present',
        preservation: 'Preservation recommended'
      };
    }
    
  } catch (error) {
    console.error('Error generating cultural heritage summary:', error);
    return null;
  }
}

/**
 * Generate a creative story summary for artistic/creative content
 */
export async function generateCreativeStorySummary(
  media: MediaItem[],
  context: {
    title?: string;
    theme?: string;
    genre?: string;
    inspiration?: string;
  },
  options: SummaryOptions = {}
): Promise<{ summary: string; narrative: string; themes: string[]; artisticElements: string[] } | null> {
  try {
    const {
      maxLength = 350,
      style = 'creative',
      language = 'english',
      focusAreas = ['storytelling', 'artistic expression', 'visual narrative']
    } = options;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const mediaParts = await prepareMediaParts(media);
    
    let prompt = `Analyze this creative content and craft a ${style} summary in ${language}.

Creative Context:
- Title: ${context.title || 'Creative Work'}
- Theme: ${context.theme || 'Open theme'}
- Genre: ${context.genre || 'Mixed media'}
- Inspiration: ${context.inspiration || 'Artist\'s vision'}
- Visual elements: ${media.length} items

Focus: ${focusAreas.join(', ')}

Please provide:
1. Creative summary capturing the artistic vision (${maxLength} characters)
2. Narrative story or artistic interpretation
3. Key themes and symbolic elements
4. Artistic techniques and visual elements observed
5. Emotional impact and aesthetic qualities

Format as JSON with fields: summary, narrative, themes, artisticElements.`;

    const parts = [{ text: prompt }, ...mediaParts];
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings
    });
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || text,
        narrative: parsed.narrative || 'Creative expression captured',
        themes: parsed.themes || ['creativity', 'expression'],
        artisticElements: parsed.artisticElements || ['visual composition', 'color', 'form']
      };
    } catch {
      return {
        summary: text.substring(0, maxLength),
        narrative: 'Creative work with artistic merit',
        themes: ['creative expression'],
        artisticElements: ['visual elements']
      };
    }
    
  } catch (error) {
    console.error('Error generating creative story summary:', error);
    return null;
  }
}

/**
 * Generate a travel/location summary for travel and location-based content
 */
export async function generateTravelLocationSummary(
  media: MediaItem[],
  context: {
    location: string;
    attractions?: string[];
    activities?: string[];
    season?: string;
    travelStyle?: string;
  },
  options: SummaryOptions = {}
): Promise<{ summary: string; attractions: string[]; recommendations: string[]; travelTips: string[] } | null> {
  try {
    const {
      maxLength = 300,
      style = 'detailed',
      language = 'english',
      focusAreas = ['travel', 'location', 'recommendations']
    } = options;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const mediaParts = await prepareMediaParts(media);
    
    let prompt = `Analyze this travel/location content and create a ${style} summary in ${language}.

Travel Context:
- Location: ${context.location}
- Attractions: ${context.attractions?.join(', ') || 'Various locations'}
- Activities: ${context.activities?.join(', ') || 'Multiple activities'}
- Season: ${context.season || 'Not specified'}
- Travel Style: ${context.travelStyle || 'General tourism'}
- Visual documentation: ${media.length} items

Focus: ${focusAreas.join(', ')}

Please provide:
1. Location summary highlighting key experiences (${maxLength} characters)
2. Notable attractions and points of interest
3. Travel recommendations for future visitors
4. Practical travel tips and insights
5. Cultural observations and local highlights

Format as JSON with fields: summary, attractions, recommendations, travelTips.`;

    const parts = [{ text: prompt }, ...mediaParts];
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings
    });
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || text,
        attractions: parsed.attractions || [],
        recommendations: parsed.recommendations || [],
        travelTips: parsed.travelTips || []
      };
    } catch {
      return {
        summary: text.substring(0, maxLength),
        attractions: [],
        recommendations: [],
        travelTips: []
      };
    }
    
  } catch (error) {
    console.error('Error generating travel location summary:', error);
    return null;
  }
}

/**
 * Determine the best summary type for given media content
 * Analyzes media content to classify it as cultural, creative, travel, or general post
 */
export async function generateSummaryType(
  mediaItems: any[],
): Promise<'post' | 'cultural' | 'creative' | 'travel'> {
  try {
    console.log('Determining content type for media items:', mediaItems.length);
    if (mediaItems.length === 0) {
      return 'post'; // Default summary type
    }

    // Filter and transform media items to match MediaItem interface
    const formattedMediaItems: MediaItem[] = mediaItems
      .filter(item => item && (item.uri || item.url))
      .map(item => ({
        url: item.url || item.uri, // Use url if available, otherwise use uri
        type: (item.type === 'photo' || item.type === 'image') ? 'image' : 
              (item.type === 'video') ? 'video' : 'image', // Default to image if type is invalid
        description: item.description
      }));

    console.log('Formatted media items for content type analysis:', formattedMediaItems.length);
    
    if (formattedMediaItems.length === 0) {
      return 'post'; // Default if no valid media items
    }
    
    // Prepare media parts using the correctly formatted items
    const mediaParts = await prepareMediaParts(formattedMediaItems.slice(0, 3));
    
    // Build prompt for content type classification
    const prompt = `Analyze this media content and determine the most appropriate category.
    
  Choose ONE of the following categories that best fits this content:
  1. CULTURAL - Historical artifacts, heritage items, traditional practices, religious/cultural ceremonies
  2. CREATIVE - Artistic expressions, creative works, performances, aesthetic compositions
  3. TRAVEL - Travel destinations, landmarks, tourism, location-based content, journeys
  4. GENERAL - General content that doesn't fit strongly in the above categories

  Return ONLY the single word category name in uppercase: CULTURAL, CREATIVE, TRAVEL, or GENERAL.`;

    // Combine text and media parts
    const parts = [{ text: prompt }, ...mediaParts];

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings
    });
    console.log('Content type generation result from gemini 1.5 flash model :', result);
    const response = await result.response;
    const text = response.text();

    console.log('Content type response from geminiSummary.ts file : ', text);
    
    // Map the response to summary type
    if (text.includes('CULTURAL')) return 'cultural';
    if (text.includes('CREATIVE')) return 'creative';
    if (text.includes('TRAVEL')) return 'travel';
    
    // Default to 'post' for GENERAL or any other response
    return 'post';
    
  } catch (error) {
    console.error('Error determining content type:', error);
    return 'post'; // Default to 'post' on error
  }
}

// Export all interfaces for use in other files
export type {
  MediaItem,
  Post,
  CommunityEvent,
  SummaryOptions
};

