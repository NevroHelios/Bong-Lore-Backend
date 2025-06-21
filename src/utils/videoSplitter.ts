import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

/**
 * Interface representing a video segment with start and end times
 */
interface VideoSegment {
  start: number;
  end: number;
}

/**
 * Class for handling Cloudinary video operations including
 * downloading, splitting by timestamps, and merging
 */
export class CloudinaryVideoSplitter {
  private tempDir: string;
  
  constructor() {
    // Create a unique temp directory for this instance
    this.tempDir = path.join(os.tmpdir(), `video-splitter-${uuidv4()}`);
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * Downloads a video from Cloudinary URL
   * 
   * @param cloudinaryUrl The Cloudinary URL of the video
   * @returns Path to the downloaded video file
   */
  async downloadVideo(cloudinaryUrl: string): Promise<string> {
    console.log(`Downloading video from ${cloudinaryUrl}...`);
    
    const response = await axios({
      method: 'get',
      url: cloudinaryUrl,
      responseType: 'stream'
    });
    
    const videoPath = path.join(this.tempDir, `original-${uuidv4()}.mp4`);
    const writer = fs.createWriteStream(videoPath);
    
    response.data.pipe(writer);
    
    return new Promise<string>((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Video downloaded to ${videoPath}`);
        resolve(videoPath);
      });
      writer.on('error', (err) => {
        console.error('Error downloading video:', err);
        reject(err);
      });
    });
  }
  
  /**
   * Splits a video into segments based on the provided timestamps
   * 
   * @param videoPath Path to the input video file
   * @param segments Array of start and end times for each segment
   * @returns Array of paths to the created segment files
   */
  async splitVideo(videoPath: string, segments: VideoSegment[]): Promise<string[]> {
    console.log(`Splitting video into ${segments.length} segments...`);
    
    const segmentPaths: string[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const { start, end } = segments[i];
      const duration = end - start;
      
      if (duration <= 0) {
        console.warn(`Skipping segment ${i+1} as duration is invalid: ${duration}`);
        continue;
      }
      
      const outputPath = path.join(this.tempDir, `segment-${i+1}-${uuidv4()}.mp4`);
      
      console.log(`Extracting segment ${i+1}: ${start}s to ${end}s (duration: ${duration.toFixed(2)}s)`);
      
      await this.executeFFmpeg([
        '-i', videoPath,
        '-ss', start.toString(),
        '-t', duration.toString(),
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        outputPath
      ]);
      
      segmentPaths.push(outputPath);
      console.log(`Created segment ${i+1}: ${start}s to ${end}s at ${outputPath}`);
    }
    
    return segmentPaths;
  }
  
  /**
   * Merges multiple video segments into a single video
   * 
   * @param segmentPaths Array of paths to the segment files
   * @param outputFilename Optional name for the output file
   * @returns Path to the merged video file
   */
  async mergeSegments(segmentPaths: string[], outputFilename?: string): Promise<string> {
    if (segmentPaths.length === 0) {
      throw new Error('No segments provided for merging');
    }
    
    console.log(`Merging ${segmentPaths.length} segments...`);
    
    // Verify all segment files exist
    for (const segmentPath of segmentPaths) {
      if (!fs.existsSync(segmentPath)) {
        throw new Error(`Segment file not found: ${segmentPath}`);
      }
      console.log(`Verified segment exists: ${path.basename(segmentPath)}`);
    }
    
    // Create a file that lists all segments to merge
    const listFilePath = path.join(this.tempDir, 'segments.txt');
    const listContent = segmentPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(listFilePath, listContent);
    
    console.log('Segment list content:');
    console.log(listContent);
    
    // Output path for the merged video
    const outputPath = path.join(this.tempDir, outputFilename || `merged-${uuidv4()}.mp4`);
    
    await this.executeFFmpeg([
      '-f', 'concat',
      '-safe', '0',
      '-i', listFilePath,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputPath
    ]);
    
    console.log(`Merged video created at ${outputPath}`);
    
    // Validate the merged video
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`Merged video size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Use ffprobe to get video duration if available
      try {
        const ffprobe = spawn('ffprobe', [
          '-v', 'quiet',
          '-show_entries', 'format=duration',
          '-of', 'csv=p=0',
          outputPath
        ]);
        
        let duration = '';
        ffprobe.stdout.on('data', (data) => {
          duration += data.toString();
        });
        
        await new Promise<void>((resolve) => {
          ffprobe.on('close', () => {
            const durationSeconds = parseFloat(duration.trim());
            if (!isNaN(durationSeconds)) {
              console.log(`Merged video duration: ${durationSeconds.toFixed(2)} seconds`);
            }
            resolve();
          });
        });
      } catch (error) {
        console.log('Could not get video duration (ffprobe not available)');
      }
    } else {
      throw new Error('Merged video file was not created');
    }
    
    return outputPath;
  }
  
  /**
   * Cleans up temporary files and directories
   */
  cleanup(): void {
    console.log(`Cleaning up temporary files in ${this.tempDir}...`);
    if (fs.existsSync(this.tempDir)) {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.tempDir, file));
      }
      fs.rmdirSync(this.tempDir);
    }
    console.log('Cleanup complete');
  }
  
  /**
   * Helper method to execute FFmpeg commands
   * 
   * @param args Array of command line arguments for FFmpeg
   * @returns Promise that resolves when the command completes
   */
  private executeFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Executing FFmpeg: ffmpeg ${args.join(' ')}`);
      
      const ffmpeg = spawn('ffmpeg', ['-y', ...args]); // -y to overwrite output files
      
      // Collect both stdout and stderr
      let stdout = '';
      let stderr = '';
      
      ffmpeg.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('FFmpeg completed successfully');
          resolve();
        } else {
          console.error(`FFmpeg process exited with code ${code}`);
          console.error('STDERR:', stderr);
          console.error('STDOUT:', stdout);
          reject(new Error(`FFmpeg process failed with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (err) => {
        console.error('Failed to start FFmpeg process:', err);
        reject(err);
      });
    });
  }
  
  /**
   * Main function to process a Cloudinary video: download, split, and merge
   * 
   * @param cloudinaryUrl URL of the video on Cloudinary
   * @param timestamps Array of timestamp pairs [start, end] in seconds
   * @param outputFilename Optional name for the output file
   * @returns Path to the processed video file
   */
  async processVideo(
    cloudinaryUrl: string, 
    timestamps: [number, number][], 
    outputFilename?: string
  ): Promise<string> {
    try {
      // Download the video
      const videoPath = await this.downloadVideo(cloudinaryUrl);
      
      // Convert timestamps to segments
      const segments: VideoSegment[] = timestamps.map(([start, end]) => ({ start, end }));
      
      // Split the video
      const segmentPaths = await this.splitVideo(videoPath, segments);
      
      // Merge the segments
      const outputPath = await this.mergeSegments(segmentPaths, outputFilename);
      
      return outputPath;
    } catch (error) {
      console.error('Error processing video:', error);
      throw error;
    }
  }
}

/**
 * Example usage:
 *
 * const splitter = new CloudinaryVideoSplitter();
 * 
 * async function extractHighlights() {
 *   try {
 *     const cloudinaryUrl = "https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4";
 *     const timestamps: [number, number][] = [
 *       [10, 15],  // 10s to 15s
 *       [30, 40],  // 30s to 40s
 *       [60, 70]   // 60s to 70s
 *     ];
 *     
 *     const highlightsVideoPath = await splitter.processVideo(cloudinaryUrl, timestamps, "highlights.mp4");
 *     console.log(`Highlights video created at: ${highlightsVideoPath}`);
 *     
 *     // Don't forget to clean up when done
 *     splitter.cleanup();
 *   } catch (error) {
 *     console.error("Failed to extract highlights:", error);
 *   }
 * }
 * 
 * extractHighlights();
 */

