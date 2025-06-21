import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-pro-vision';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Convert file to base64 and get its MIME type
async function fileToGenerativePart(filePathOrUrl: string): Promise<any> {
  let buffer: Buffer;
  if (filePathOrUrl.startsWith('http')) {
    const response = await fetch(filePathOrUrl);
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    buffer = await fs.promises.readFile(filePathOrUrl);
  }
  const fileType = await fileTypeFromBuffer(buffer);
  const mimeType = fileType ? fileType.mime : 'application/octet-stream';
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };
}

// Get embedding from Gemini for text input
async function getGeminiEmbeddingFromText(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = `Generate a dense vector embedding for the following Bengali cultural text or tag. Return only a JSON array of numbers.\nText: ${text}`;
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
    ]
  });
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[.*?\]/s);
  if (!jsonMatch) throw new Error('No valid embedding array found in Gemini response');
  return JSON.parse(jsonMatch[0]);
}

// --- TEXT EMBEDDING (TAGS, DESCRIPTIONS) ---
// Example: Gemini API, replace with your provider if needed
export async function getTextEmbedding(text: string): Promise<number[]> {
  return getGeminiEmbeddingFromText(text);
}

// --- IMAGE EMBEDDING (PHOTOS) ---
// Example: Gemini API, replace with your provider if needed
export async function getImageEmbedding(filePathOrUrl: string): Promise<number[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const generativePart = await fileToGenerativePart(filePathOrUrl);
  const prompt = 'Generate a dense vector embedding for this Bengali cultural image. Return only a JSON array of numbers.';
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }, generativePart] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
    ]
  });
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[.*?\]/s);
  if (!jsonMatch) throw new Error('No valid embedding array found in Gemini response');
  return JSON.parse(jsonMatch[0]);
}

// --- MULTIMODAL EMBEDDING (IMAGE + TEXT) ---
// Example: Gemini API, replace with your provider if needed
export async function getMultimodalEmbedding(filePathOrUrl: string, text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const generativePart = await fileToGenerativePart(filePathOrUrl);
  const prompt = `Generate a dense vector embedding for this Bengali cultural image and the following text: ${text}. Return only a JSON array of numbers.`;
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }, generativePart] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
    ]
  });
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[.*?\]/s);
  if (!jsonMatch) throw new Error('No valid embedding array found in Gemini response');
  return JSON.parse(jsonMatch[0]);
}

// --- CULTURAL CONTEXT EMBEDDING ---
// Example: Gemini API, replace with your provider if needed
export async function getCulturalContextEmbedding(title: string, tags: string[], context: string): Promise<number[]> {
  const fullText = `Bengali cultural item: ${title}. Tags: ${tags.join(', ')}. Context: ${context}`;
  return getGeminiEmbeddingFromText(fullText);
}

// --- USAGE EXAMPLES ---
// (You can call these functions from your models or routes)
// const tagEmbedding = await getTextEmbedding('durga-puja');
// const imageEmbedding = await getImageEmbedding('/path/to/photo.jpg');
// const multimodalEmbedding = await getMultimodalEmbedding('/path/to/photo.jpg', 'durga-puja, festival');
// const culturalEmbedding = await getCulturalContextEmbedding('Durga Puja', ['festival', 'goddess-durga'], 'A major Bengali festival.');

export default {
  getTextEmbedding,
  getImageEmbedding,
  getMultimodalEmbedding,
  getCulturalContextEmbedding
};
