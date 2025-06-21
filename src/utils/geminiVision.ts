import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import fetch from 'node-fetch'; // This should work with esModuleInterop for node-fetch v2
import { Types } from 'mongoose';
import Tag from '../models/Tag.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI with API key
const apiKey = process.env.GEMINI_API_KEY!;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in the environment variables.');
}
const genAI = new GoogleGenAI({apiKey : apiKey});;
const VISION_MODEL_NAME = process.env.VISION_MODEL_NAME || 'gemini-pro-vision';
const EMBEDDING_MODEL_NAME = 'embedding-001';

// Pre-defined Bengali culture related tags
// These represent specific aspects of Bengali culture, arts, traditions, etc.
export const BENGALI_CULTURE_TAGS = {
  // Art & Crafts
  art: [
    'alpana', 'kantha-stitch', 'patachitra', 'terracotta', 'shola-art', 
    'dokra', 'bamboo-craft', 'clay-pottery', 'masks', 'madur-mat', 'nakshi-kantha'
  ],
  
  // Architecture
  architecture: [
    'terracotta-temple', 'rajbari', 'zamindar-house', 'colonial-architecture', 
    'char-bangla', 'aat-chala', 'jor-bangla', 'deul', 'ratna'
  ],
  
  // Attire & Clothing
  attire: [
    'saree', 'dhoti', 'gamcha', 'tant', 'jamdani', 'baluchari', 'dhakai', 'kantha-saree',
    'garad', 'murshidabad-silk', 'shantipuri', 'panjabi', 'lungi'
  ],
  
  // Celebrations & Festivals
  festivals: [
    'durga-puja', 'kali-puja', 'saraswati-puja', 'lakshmi-puja', 'poila-boishakh',
    'pohela-falgun', 'nabanna', 'gajan', 'charak-puja', 'rath-yatra', 'dol-jatra', 'bhai-phota'
  ],
  
  // Cuisine & Food
  cuisine: [
    'mishti-doi', 'rasgulla', 'sandesh', 'pantua', 'chamcham', 'pithe-puli',
    'hilsa-fish', 'shorshe-ilish', 'machher-jhol', 'kosha-mangsho', 'chingri-malai-curry',
    'luchi', 'aloo-posto', 'shukto', 'panta-bhat', 'muri', 'jhalmuri', 'telebhaja',
    'mishti', 'rosogolla', 'sondesh', 'chamcham', 'panchforon', 'chutney', 'malpua'
  ],
  
  // Dance & Music
  performingArts: [
    'rabindra-sangeet', 'nazrul-geeti', 'bhatiali', 'baul', 'kavigan', 'kirtan',
    'chhau-dance', 'kathak', 'manipuri', 'folk-dance', 'jatra', 'pala-gaan'
  ],
  
  // Landscapes & Geography
  landscape: [
    'sundarbans', 'ganges-river', 'padma-river', 'hooghly-river', 'tea-garden',
    'mangrove-forest', 'rural-landscape', 'village-scene', 'rice-field', 'river-boat'
  ],
  
  // Literature & Education
  literature: [
    'bengali-script', 'bengali-literature', 'rabindranath-tagore', 'kazi-nazrul-islam',
    'bankim-chandra', 'sarat-chandra', 'bibhutibhushan', 'sukumar-ray', 'manik-bandopadhyay',
    'taslima-nasrin', 'humayun-ahmed'
  ],
  
  // People & Society
  people: [
    'bengali-wedding', 'adda', 'traditional-family', 'village-life', 'fishermen',
    'farmer', 'artisan', 'weaver', 'potter', 'baul-singer', 'urban-bengali'
  ],
  
  // Religious & Spiritual
  religious: [
    'goddess-durga', 'goddess-kali', 'lord-shiva', 'krishna', 'sufi-shrine', 
    'hindu-temple', 'mosque', 'church', 'buddhist-vihar'
  ],
  
  // Objects & Symbols
  symbols: [
    'shankha', 'sindoor', 'tabla', 'dhak', 'harmonium', 'ektara', 'dotara',
    'clay-lamp', 'conch-shell', 'betel-leaf', 'Bengali-flag', 'lotus'
  ],

  // General descriptive tags
  descriptive: [
    'colorful', 'traditional', 'historical', 'artistic', 'spiritual', 'festive',
    'handcrafted', 'authentic', 'heritage', 'ancient', 'vibrant', 'cultural',
    'ceremonial', 'monsoon', 'riverine', 'rural', 'urban'
  ]
};

// Flatten all tags into a single array
export const ALL_BENGALI_TAGS = Object.values(BENGALI_CULTURE_TAGS).flat();

/**
 * Helper to safely extract JSON from Gemini's response.
 * It handles markdown code blocks and direct JSON output.
 */
function extractJson<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```json\n([\s\S]*?)\n```|(\{[\s\S]*\})|(\[[\s\S]*\])/);
    if (match) {
      const jsonString = match[1] || match[2] || match[3];
      if (jsonString) {
        return JSON.parse(jsonString) as T;
      }
    }
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("Failed to parse JSON from response, returning fallback.", text);
    return fallback;
  }
}

/**
 * Convert an image file to a base64 data URI
 */
async function fileToGenerativePart(filePath: string): Promise<any> {
  let buffer: Buffer;
  
  // Handle both local file paths and URLs
  if (filePath.startsWith('http')) {
    const response = await fetch(filePath);
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    buffer = await fs.promises.readFile(filePath);
  }

  // Get MIME type
  const fileType = await fileTypeFromBuffer(buffer);
  const mimeType = fileType ? fileType.mime : 'application/octet-stream';

  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };
}

/**
 * Generate a text embedding for a given string.
 */
export async function generateTextEmbedding(text: string): Promise<number[] | null> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log("Skipping text embedding for empty input.");
    return null;
  }
  try {
    const response = await genAI.models.embedContent({
      model: 'gemini-embedding-exp-03-07',
      contents: text,
    });
    if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
      return response.embeddings[0].values;
    }
    return null;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    return null;
  }
}

/**
 * Generate a multimodal embedding.
 * Note: This is a simplified version that embeds a textual description of the media.
 * True multimodal embedding would require a specific multimodal embedding model.
 */
export async function generateMultimodalEmbedding(filePath: string, description?: string): Promise<number[] | null> {
  try {
    const textToEmbed = `Visual content: ${path.basename(filePath)}. Description: ${description || 'No description provided.'}`;
    const response = await genAI.models.embedContent({
      model: 'gemini-embedding-exp-03-07',
      contents: textToEmbed,
    });
    if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
      return response.embeddings[0].values;
    }
    return null;
  } catch (error) {
    console.error('Error generating multimodal embedding:', error);
    return null;
  }
}

/**
 * Generate a culturally-aware text embedding.
 */
export async function generateCulturalEmbedding(text: string): Promise<number[] | null> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log("Skipping cultural embedding for empty input.");
    return null;
  }
  try {
    const textToEmbed = `Cultural context of Bengal: ${text}`;
    const response = await genAI.models.embedContent({
      model: 'gemini-embedding-exp-03-07',
      contents: textToEmbed,
    });
    if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
      return response.embeddings[0].values;
    }
    return null;
  } catch (error) {
    console.error('Error generating cultural embedding:', error);
    return null;
  }
}

/**
 * Generate tags for an image or video from a given file path
 */
export async function generateTagsForMedia(
  filePath: string, 
  userId: Types.ObjectId | string,
  existingDescription?: string
): Promise<string[]> {
  try {
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return [];
    }

    // Create model and prepare prompt
    const generativePart = await fileToGenerativePart(filePath);

    // Extract file extension for context
    const fileExtension = path.extname(filePath).toLowerCase();
    const mediaType = fileExtension.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/i) ? 'video' : 'image';
    
    // Create safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
    ];

    // Build prompt for the AI
    const basePrompt = `Analyze this ${mediaType} related to Bengali culture and heritage.
${existingDescription ? 'The user describes this as: ' + existingDescription : ''}

Select up to 10 relevant tags from this list of Bengali cultural tags:
${ALL_BENGALI_TAGS.join(', ')}

If the ${mediaType} includes specific Bengali cultural elements not in the list, you may suggest up to 2 additional tags.

Return ONLY a valid JSON array of strings. If no relevant tags are found, return an empty array [].
Example: ["tag1", "tag2", ...]`;

    // Send to Gemini
    const result = await genAI.models.generateContent({
      model: VISION_MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { text: basePrompt },
            generativePart
          ]
        }
      ]
    });

    // Process the response
    const responseText = result.text ?? '';
    let tags = extractJson<string[]>(responseText, []);
    tags = [...new Set(tags.filter(tag => typeof tag === 'string'))].slice(0, 12);
    
    // Save tags to DB as before
    await Promise.all(tags.map(async (tagName) => {
      try {
        await Tag.findOneAndUpdate(
          { name: tagName },
          {
            $setOnInsert: {
              name: tagName,
              description: `Tag related to Bengali culture: ${tagName}`,
              createdBy: userId,
              isSystemGenerated: true
            },
            $inc: { useCount: 1 }
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error(`Error creating/updating tag ${tagName}:`, err);
      }
    }));
    
    return tags;
  } catch (error) {
    console.error('Error generating tags with Gemini:', error);
    return [];
  }
}

/**
 * Generate a descriptive story about the media using Gemini
 */
export async function generateStoryForMedia(
  filePath: string,
  tags: string[],
  existingDescription?: string
): Promise<Record<string, string>> {
  try {
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return { error: 'API key not set' };
    }

    // Create model and prepare image
    const generativePart = await fileToGenerativePart(filePath);
    
    // Extract file extension for context
    const fileExtension = path.extname(filePath).toLowerCase();
    const mediaType = fileExtension.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/i) ? 'video' : 'image';

    // Create safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
    ];

    const tagsString = tags.join(', ');
    
    // Build prompt for the AI
    const basePrompt = `Write a rich, descriptive story about this ${mediaType} related to Bengali culture.
${existingDescription ? 'The user describes this as: ' + existingDescription : ''}
Tags associated with this ${mediaType}: ${tagsString}

Please provide a rich cultural context, and describe what's depicted. Return your response in ONLY a single valid JSON object.
Example: {
  "title": "A short, engaging title for this ${mediaType}",
  "story": "A descriptive story about this ${mediaType} (150-200 words)",
  "culturalContext": "Brief explanation of the cultural significance (50-75 words)",
  "location": "Likely location depicted, if applicable",
  "timeContext": "Likely time period or season depicted, if applicable"
}`;

    // Send to Gemini
    const result = await genAI.models.generateContent({
      model: VISION_MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { text: basePrompt },
            generativePart
          ]
        }
      ]
    });

    // Process the response
    const responseText = result.text ?? '';
    const story = extractJson<Record<string, string>>(responseText, { 
      title: "Bengali Cultural Content",
      story: "This content depicts aspects of Bengali culture and heritage.",
      error: "Failed to generate complete story"
    });

    return story;
  } catch (error) {
    console.error('Error generating story with Gemini:', error);
    return { 
      error: `Failed to generate story: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Extract Bengali tags from a given description using keyword matching.
 * This is a utility function to find relevant Bengali cultural tags from a text.
 */
export function getBengaliTagsFromDescription(description: string): string[] {
  if (!description) return [];
  const descLower = description.toLowerCase();
  return ALL_BENGALI_TAGS.filter(tag => descLower.includes(tag.toLowerCase()));
}
