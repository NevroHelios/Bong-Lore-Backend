import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:10000/auth/google/callback';

if (!googleClientId || !googleClientSecret) {
  console.error('Google OAuth credentials not found in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
}

console.log('Google OAuth credentials loaded');

export const config = {
    googleClientId,
    googleClientSecret,
    callbackURL,
    postLogoutRedirectUrl: 'http://192.168.233.236/(auth)/login' // Frontend login page
};