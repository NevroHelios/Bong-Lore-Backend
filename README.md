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
