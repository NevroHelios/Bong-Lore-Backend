import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TimestampPair {
  start: number;
  end: number;
}

/**
 * Analyzes a video from Cloudinary using Google's Gemini and returns timestamp pairs
 * of peak moments.
 * 
 * @param cloudinaryUrl URL to the video hosted on Cloudinary
 * @param apiKey Optional Gemini API key (defaults to environment variable)
 * @returns Array of timestamp pairs [start_time, end_time] in seconds
 */
export async function getPeakMoments(
  cloudinaryUrl: string,
  apiKey?: string
): Promise<[number, number][]> {
  // Configure Gemini API
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable or pass as parameter.');
  }

  // Set up Gemini API
  const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Download video from Cloudinary to a temporary file
  console.log(`Downloading video from ${cloudinaryUrl}...`);
  const response = await axios({
    method: 'get',
    url: cloudinaryUrl,
    responseType: 'stream'
  });

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `video-${uuidv4()}.mp4`);
  const writer = fs.createWriteStream(tempFilePath);

  response.data.pipe(writer);
  await new Promise<void>((resolve, reject) => {
    writer.on('finish', () => resolve());
    writer.on('error', () => reject());
  });

  try {
    // Create a Gemini model instance
    const generativeModel = model;

    // Create prompt for peak moment detection
    const prompt = `
      Analyze this video and identify the TOP 3-5 most exciting/engaging moments for a highlights reel.
      
      CRITICAL REQUIREMENTS:
      1. The total combined duration of ALL segments must be EXACTLY 30 seconds or less
      2. Each individual segment should be 2-4 seconds long for optimal pacing
      3. Focus on high-energy moments: action, laughter, key dialogue, visual highlights, or dramatic moments
      4. Avoid static scenes, long pauses, repetitive content, or boring transitions
      5. Select diverse moments from different parts of the video (not consecutive segments)
      6. Prioritize quality over quantity - better to have 3 great moments than 5 mediocre ones
      
      Calculate the total duration before responding. If segments exceed 30 seconds total, reduce segment count or duration.
      
      RESPONSE FORMAT - Return ONLY this exact JSON format with no additional text:
      [[12.5, 18.0], [45.2, 51.7], [89.1, 95.8]]
      
      Where each pair is [start_seconds, end_seconds] with decimal precision.
      
      Do not include any explanation, markdown, or other text. Only the JSON array.
      
      REMEMBER: Total duration MUST NOT exceed 30 seconds.
    `;

    // Read video file as base64
    const videoBytes = fs.readFileSync(tempFilePath);
    const videoBase64 = videoBytes.toString('base64');

    // Process video with Gemini
    console.log('Analyzing video with Gemini...');
    const result = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'video/mp4',
                data: videoBase64
              }
            }
          ]
        }
      ]
    });

    // Extract JSON array from response
    try {
      // Get the response text
      const responseText = result.response.text().trim();
      console.log('Raw Gemini response:', responseText);
      
      let jsonText = responseText;

      // More robust JSON extraction
      // Remove markdown code blocks
      if (jsonText.includes('```')) {
        const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        } else {
          // If no match, try to extract content between ```
          jsonText = jsonText.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
        }
      }
      
      // Look for JSON array pattern if no clear JSON found yet
      if (!jsonText.trim().startsWith('[')) {
        const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          jsonText = arrayMatch[0];
        }
      }
      
      // Clean up any remaining text around the JSON
      jsonText = jsonText.trim();
      
      // Additional cleanup for common issues
      jsonText = jsonText.replace(/^[^[]*/, ''); // Remove anything before the first [
      jsonText = jsonText.replace(/[^\]]*$/, ''); // Remove anything after the last ]
      
      console.log('Cleaned JSON text:', jsonText);
      
      // Parse the JSON
      const timestamps: [number, number][] = JSON.parse(jsonText);
      
      // Validate that we got an array of arrays
      if (!Array.isArray(timestamps) || timestamps.length === 0) {
        console.error('Invalid response format - expected array of timestamp pairs');
        return [];
      }
      
      // Validate each timestamp pair
      const validTimestamps = timestamps.filter(pair => {
        if (!Array.isArray(pair) || pair.length !== 2) {
          console.warn('Skipping invalid timestamp pair:', pair);
          return false;
        }
        const [start, end] = pair;
        if (typeof start !== 'number' || typeof end !== 'number' || start >= end || start < 0) {
          console.warn('Skipping invalid timestamp values:', pair);
          return false;
        }
        return true;
      });
      
      // Validate and ensure total duration doesn't exceed 30 seconds
      let totalDuration = 0;
      const finalTimestamps: [number, number][] = [];
      
      console.log('Valid segments from Gemini:');
      validTimestamps.forEach((segment, i) => {
        const [start, end] = segment;
        const duration = end - start;
        console.log(`  Segment ${i+1}: ${start.toFixed(2)}s - ${end.toFixed(2)}s (${duration.toFixed(2)}s)`);
      });
      
      // Process segments and enforce 30-second limit
      for (const [start, end] of validTimestamps) {
        const segmentDuration = end - start;
        
        if (totalDuration + segmentDuration <= 30) {
          // Segment fits within our limit
          finalTimestamps.push([start, end]);
          totalDuration += segmentDuration;
        } else {
          // Try to fit a shorter version of this segment
          const remainingTime = 30 - totalDuration;
          if (remainingTime >= 3) { // Only add if we have at least 3 seconds left
            const truncatedEnd = start + remainingTime;
            finalTimestamps.push([start, truncatedEnd]);
            totalDuration = 30;
            console.log(`  Truncated last segment to fit 30s limit: ${start.toFixed(2)}s - ${truncatedEnd.toFixed(2)}s`);
            break; // We've reached our 30-second limit
          } else {
            console.log(`  Skipped segment (would exceed 30s limit)`);
            break;
          }
        }
      }
      
      console.log(`\nFinal selection: ${finalTimestamps.length} segments, total duration: ${totalDuration.toFixed(2)} seconds`);
      finalTimestamps.forEach((segment, i) => {
        const [start, end] = segment;
        console.log(`  Final Segment ${i+1}: ${start.toFixed(2)}s - ${end.toFixed(2)}s (${(end-start).toFixed(2)}s)`);
      });
      
      if (finalTimestamps.length === 0) {
        console.warn('No valid segments found! Returning empty array.');
        return [];
      }
      
      return finalTimestamps;
    } catch (error) {
      console.error(`Failed to parse Gemini response: ${error}`);
      console.error('Raw response was:', result.response.text());
      
      // Fallback: try to extract numbers manually
      const responseText = result.response.text();
      const numberMatches = responseText.match(/\d+\.?\d*/g);
      
      if (numberMatches && numberMatches.length >= 4) {
        console.log('Attempting fallback parsing...');
        const numbers = numberMatches.map(n => parseFloat(n));
        const fallbackTimestamps: [number, number][] = [];
        
        // Group numbers into pairs
        for (let i = 0; i < numbers.length - 1; i += 2) {
          const start = numbers[i];
          const end = numbers[i + 1];
          if (start < end && end - start <= 15) { // Reasonable segment length
            fallbackTimestamps.push([start, end]);
          }
        }
        
        if (fallbackTimestamps.length > 0) {
          console.log('Fallback timestamps found:', fallbackTimestamps);
          // Apply 30-second limit to fallback timestamps
          let totalDuration = 0;
          const limitedFallback: [number, number][] = [];
          
          for (const [start, end] of fallbackTimestamps) {
            const duration = end - start;
            if (totalDuration + duration <= 30) {
              limitedFallback.push([start, end]);
              totalDuration += duration;
            } else {
              break;
            }
          }
          
          if (limitedFallback.length > 0) {
            console.log(`Using fallback: ${limitedFallback.length} segments, ${totalDuration.toFixed(2)}s total`);
            return limitedFallback;
          }
        }
      }
      
      return [];
    }
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Example usage (uncomment to test standalone)
/*
async function main() {
  console.log("Starting main function");
  const cloudinaryUrl = "https://res.cloudinary.com/dgyiptxfq/video/upload/v1750355821/BANGALIANA/WhatsApp_Video_2025-06-19_at_23.21.29_c7b13fd9_x2mthc.mp4";
  try {
    console.log("API Key:", process.env.GEMINI_API_KEY ? "Set (value hidden)" : "Not set");
    console.log("About to call getPeakMoments");
    const peakMoments = await getPeakMoments(cloudinaryUrl);
    console.log("Peak moments detected:");
    peakMoments.forEach((moment, i) => {
      const [start, end] = moment;
      console.log(`Moment ${i+1}: ${start.toFixed(2)}s - ${end.toFixed(2)}s (duration: ${(end-start).toFixed(2)}s)`);
    });
  } catch (error) {
    console.error("Error analyzing video:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run the example (uncomment to test)
// main().catch(err => console.error('Error executing script:', err));
*/