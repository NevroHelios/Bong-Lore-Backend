import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');
const MODEL_NAME = process.env.VISION_MODEL_NAME!;

// Pre-defined Bengali culture related tags
// These represent specific aspects of Bengali culture, arts, traditions, etc.
const BENGALI_CULTURE_TAGS = {
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
const ALL_BENGALI_TAGS = Object.values(BENGALI_CULTURE_TAGS).flat();

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
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
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

Return ONLY the selected tags in a JSON array format. No explanations or other text.
Format: ["tag1", "tag2", "tag3", ...]`;

    // Send to Gemini
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: basePrompt },
          generativePart
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 200,
      },
      safetySettings
    });

    // Process the response
    const responseText = result.response.text();
    
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[.*?\]/s);
    if (!jsonMatch) {
      console.error('No valid JSON array found in the response:', responseText);
      return [];
    }
    
    let tags: string[] = [];
    try {
      tags = JSON.parse(jsonMatch[0]);
      
      // Ensure all returned tags are strings and remove any duplicates
      tags = [...new Set(tags.filter(tag => typeof tag === 'string'))];
      
      // Ensure we aren't exceeding 12 tags total
      tags = tags.slice(0, 12);
      
      // Create any new tags in the database if they don't exist
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
      
    } catch (err) {
      console.error('Error parsing JSON from Gemini response:', err);
      return [];
    }

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
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
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

Please provide a rich cultural context, and describe what's depicted. Return your response in the following JSON structure:

{
  "title": "A short, engaging title for this ${mediaType}",
  "story": "A descriptive story about this ${mediaType} (150-200 words)",
  "culturalContext": "Brief explanation of the cultural significance (50-75 words)",
  "location": "Likely location depicted, if applicable",
  "timeContext": "Likely time period or season depicted, if applicable"
}`;

    // Send to Gemini
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: basePrompt },
          generativePart
        ]
      }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
      safetySettings
    });

    // Process the response
    const responseText = result.response.text();
    
    // Extract JSON object from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No valid JSON object found in the response:', responseText);
      return { 
        title: "Bengali Cultural Content",
        story: "This content depicts aspects of Bengali culture and heritage.",
        error: "Failed to generate complete story"
      };
    }
    
    try {
      const story = JSON.parse(jsonMatch[0]);
      return story;
    } catch (err) {
      console.error('Error parsing JSON from Gemini response:', err);
      return { 
        title: "Bengali Cultural Content",
        story: responseText.substring(0, 200),
        error: "Failed to parse story format"
      };
    }
  } catch (error) {
    console.error('Error generating story with Gemini:', error);
    return { 
      error: `Failed to generate story: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export default {
  generateTagsForMedia,
  generateStoryForMedia,
  BENGALI_CULTURE_TAGS,
  ALL_BENGALI_TAGS
};
