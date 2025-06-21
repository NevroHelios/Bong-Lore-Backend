declare module '@google/generative-ai' {
  export enum HarmCategory {
    HARM_CATEGORY_UNSPECIFIED = 'HARM_CATEGORY_UNSPECIFIED',
    HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT'
  }

  export enum HarmBlockThreshold {
    HARM_BLOCK_THRESHOLD_UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
    BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
    BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
    BLOCK_HIGH_AND_ABOVE = 'BLOCK_HIGH_AND_ABOVE',
    BLOCK_NONE = 'BLOCK_NONE'
  }

  export interface GenerationConfig {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    candidateCount?: number;
  }

  export interface SafetySetting {
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }

  export interface Part {
    text?: string;
    inlineData?: {
      data: string;
      mimeType: string;
    };
  }

  export interface Content {
    role: string;
    parts: Part[];
  }

  export interface GenerateContentRequest {
    contents: Content[];
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
  }

  export interface GenerateContentResult {
    response: {
      text: () => string;
    };
  }

  export interface GenerativeModel {
    generateContent(request: GenerateContentRequest): Promise<GenerateContentResult>;
  }

  export interface GoogleGenerativeAIOptions {
    model: string;
  }

  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: GoogleGenerativeAIOptions): GenerativeModel;
  }
}
