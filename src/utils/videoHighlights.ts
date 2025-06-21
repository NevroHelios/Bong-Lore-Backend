import { getPeakMoments } from "./video.time.js";
import { CloudinaryVideoSplitter } from "./videoSplitter.js";
//fix this imports ..amr matha kaaj kor6ena ..sorry 

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analyzes a video using Gemini AI to identify peak moments,
 * then extracts those moments as a new video.
 * 
 * @param cloudinaryUrl URL of the video on Cloudinary
 * @param apiKey Optional Gemini API key (defaults to environment variable)
 * @param outputDir Optional directory to save the output file (defaults to current working directory)
 * @param outputFilename Optional filename for the output video (defaults to video_edited.mp4)
 * @returns Path to the created highlights video
 */
export async function extractVideoHighlights(
  cloudinaryUrl: string,
  apiKey?: string,
  outputDir?: string,
  outputFilename?: string
): Promise<string> {
  console.log('Starting video highlights extraction process...');
  
  // Step 1: Analyze the video to get peak moments using Gemini
  console.log('Analyzing video to find peak moments...');
  const timestamps = await getPeakMoments(cloudinaryUrl, apiKey);
  
  if (!timestamps.length) {
    throw new Error('No peak moments detected in the video');
  }
  
  console.log(`Found ${timestamps.length} peak moments in the video:`);
  timestamps.forEach((moment: [number, number], i: number) => {
    const [start, end] = moment;
    console.log(`Moment ${i+1}: ${start.toFixed(2)}s - ${end.toFixed(2)}s (duration: ${(end-start).toFixed(2)}s)`);
  });
  
  // Step 2: Extract those moments using the video splitter
  console.log('Extracting peak moments from video...');
  const videoSplitter = new CloudinaryVideoSplitter();
  
  try {
    // Determine output location - default to current working directory
    const finalOutputDir = outputDir || process.cwd();
    const finalOutputFilename = outputFilename || `video_edited.mp4`;
    const outputPath = path.join(finalOutputDir, finalOutputFilename);
    
    // Process the video
    const tempOutputPath = await videoSplitter.processVideo(
      cloudinaryUrl, 
      timestamps,
      finalOutputFilename
    );
    
    // Always move the file to the final output location if different from temp location
    if (tempOutputPath !== outputPath) {
      // Ensure output directory exists
      if (!fs.existsSync(finalOutputDir)) {
        fs.mkdirSync(finalOutputDir, { recursive: true });
      }
      
      // Copy the file to the final location
      fs.copyFileSync(tempOutputPath, outputPath);
      console.log(`Copied highlights video to: ${outputPath}`);
      
      return outputPath;
    } else {
      // File is already at the correct location
      console.log(`Highlights video created at: ${outputPath}`);
      return tempOutputPath;
    }
  } finally {
    // Clean up temporary files
    videoSplitter.cleanup();
  }
}

/**
 * Example usage
 */
async function example() {
  try {
    const cloudinaryUrl = "https://res.cloudinary.com/dgyiptxfq/video/upload/v1750355821/BANGALIANA/WhatsApp_Video_2025-06-19_at_23.21.29_c7b13fd9_x2mthc.mp4"
    // Option 1: Basic usage with defaults (will save to current directory as video_edited.mp4)
    const highlightsPath = await extractVideoHighlights(cloudinaryUrl);
    console.log(`Highlights video created at: ${highlightsPath}`);
    
    // Option 2: Save to specific directory with custom filename
    /*
    const customHighlightsPath = await extractVideoHighlights(
      cloudinaryUrl,
      undefined, // Use environment variable for API key
      '/path/to/your/videos', // Custom output directory
      'my-highlights.mp4' // Custom filename
    );
    console.log(`Custom highlights video created at: ${customHighlightsPath}`);
    */
  } catch (error) {
    console.error('Error extracting highlights:', error);
  }
}

// Uncomment to run the example
example().catch(err => console.error('Unhandled error:', err));
