# Sorbonash Backend

## Prerequisites
- Node.js >= 18
- MongoDB Atlas or local MongoDB

## Setup
1. Copy `.env.example` to `.env` and fill in your credentials.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build the project:
   ```sh
   npm run build
   ```
4. Start the server:
   ```sh
   npm start
   ```

## Development (Hot Reload)
```sh
npm run dev
```

## Project Structure
- `src/models/` — Mongoose models
- `src/app.ts` — Main Express app

## Environment Variables
- `MONGODB_URI` — MongoDB connection string
- `GEMINI_API_KEY` — Gemini API key
- `JWT_SECRET` — JWT secret for authentication

---

Add your routes, controllers, and middleware in the `src/` directory as needed.


src/utils/geminiVision.ts:160:83 - error TS2561: Object literal may only specify known properties, but 'content' does not exist in type 'EmbedContentParameters'. Did you mean to write 'contents'?

160 const result = await genAI.models.embedContent({ model: EMBEDDING_MODEL_NAME, content: text });
~~~~~~~

src/utils/geminiVision.ts:161:19 - error TS2551: Property 'embedding' does not exist on type 'EmbedContentResponse'. Did you mean 'embeddings'?

161 return result.embedding.values;
~~~~~~~~~

node_modules/@google/genai/dist/node/node.d.ts:1551:5
1551 embeddings?: ContentEmbedding[];
~~~~~~~~~~
'embeddings' is declared here.

src/utils/geminiVision.ts:176:83 - error TS2561: Object literal may only specify known properties, but 'content' does not exist in type 'EmbedContentParameters'. Did you mean to write 'contents'?

176 const result = await genAI.models.embedContent({ model: EMBEDDING_MODEL_NAME, content: textToEmbed });
~~~~~~~

src/utils/geminiVision.ts:177:19 - error TS2551: Property 'embedding' does not exist on type 'EmbedContentResponse'. Did you mean 'embeddings'?

177 return result.embedding.values;
~~~~~~~~~

node_modules/@google/genai/dist/node/node.d.ts:1551:5
1551 embeddings?: ContentEmbedding[];
~~~~~~~~~~
'embeddings' is declared here.

src/utils/geminiVision.ts:194:83 - error TS2561: Object literal may only specify known properties, but 'content' does not exist in type 'EmbedContentParameters'. Did you mean to write 'contents'?

194 const result = await genAI.models.embedContent({ model: EMBEDDING_MODEL_NAME, content: textToEmbed });
~~~~~~~

src/utils/geminiVision.ts:195:19 - error TS2551: Property 'embedding' does not exist on type 'EmbedContentResponse'. Did you mean 'embeddings'?

195 return result.embedding.values;
~~~~~~~~~

node_modules/@google/genai/dist/node/node.d.ts:1551:5
1551 embeddings?: ContentEmbedding[];
~~~~~~~~~~
'embeddings' is declared here.

src/utils/geminiVision.ts:217:25 - error TS2339: Property 'getGenerativeModel' does not exist on type 'GoogleGenAI'.

217 const model = genAI.getGenerativeModel({ model: VISION_MODEL_NAME });
~~~~~~~~~~~~~~~~~~

src/utils/geminiVision.ts:325:25 - error TS2339: Property 'getGenerativeModel' does not exist on type 'GoogleGenAI'.

325 const model = genAI.getGenerativeModel({ model: VISION_MODEL_NAME });
~~~~~~~~~~~~~~~~~~

Found 8 errors in the same file, starting at: src/utils/geminiVision.ts:160

[nodemon] app crashed - waiting for file changes before starting...fix the error..