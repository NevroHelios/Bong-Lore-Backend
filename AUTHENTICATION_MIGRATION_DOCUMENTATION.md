# Authentication Migration: Civic Auth to Google OAuth

## 1. Overview and Status

**Migration Status: COMPLETED**

All references to Civic Auth have been successfully replaced with Google OAuth/Passport authentication across the entire codebase. This project has been migrated from Civic Auth to Google OAuth for authentication.

## 2. Key Changes

1. Removed Civic Auth dependencies
2. Added Passport and Google OAuth 2.0 authentication
3. Updated user model to include Google ID
4. Updated authentication middleware and routes
5. Modified environment variables

## 3. Files Modified

### Package Dependencies

- **Removed**: `@civic/auth`, `civic-sip-api`
- **Added**: `passport`, `passport-google-oauth2`, `express-session`
- **Added types**: `@types/passport`, `@types/passport-google-oauth2`, `@types/express-session`

### Configuration & Setup

- `authConfig.ts`: Updated to use Google OAuth credentials
- `app.ts`: Replaced Civic Auth middleware with Passport initialization and Google strategy
- `models/User.ts`: Added `googleId` field to support Google OAuth authentication
- `middlewares/authmiddleware.ts`: Updated to use Passport's isAuthenticated method

### Routes & Controllers

- `routes/authroutes.ts`: Updated to use Passport Google OAuth routes
- `routes/mediaProcessingRoutes.ts`: Updated to get user info from Passport
- **Controllers updated**:
  - `controllers/authcontroller.ts`: Complete rewrite
  - `controllers/collectioncontroller.ts`: Updated user authentication and lookup methods
  - `controllers/eventcontroller.ts`
  - `controllers/postcontroller.ts`
  - `controllers/vectorSearchController.ts`

### Type Definitions

- `types/express.d.ts`: Updated to define the Express.User interface
- `types/passport.d.ts`: Updated to define Passport integration with Express
- `types/passport-google-oauth2.d.ts`: Added to provide type definitions
- `types/express-session-module.d.ts`: Added to handle express-session imports
- `types/passport-module.d.ts`: Added to handle passport imports

## 4. Data & Authentication Flow Changes

### User Data Structure Changes

**Before (Civic Auth)**:

```typescript
{
  name: string;
  email: string;
  id: string; // Civic Auth ID
}
```

**After (Passport Google OAuth)**:

```typescript
{
  _id: mongoose.Types.ObjectId; // MongoDB document ID
  name: string;
  email: string;
  googleId: string; // Google ID
}
```

### Key Pattern Changes

- `user.id` → `user._id` (property name change)
- `req.civicAuth.getUser()` → `req.user` (access pattern change)
- User lookup by `name` → User lookup by `_id` (database query change)

### Authentication Flow

1. User navigates to `/auth/google`
2. User is redirected to Google login page
3. After successful login, Google redirects back to `/auth/google/callback`
4. Passport verifies the user and either creates a new user or finds an existing one
5. User is logged in and a session is created
6. Protected routes check if the user is authenticated using `req.isAuthenticated()`

## 5. Controller Update Patterns

### Authentication Check and User Retrieval

**OLD**:

```typescript
const user = await req.civicAuth.getUser();
if (!user?.name) {
  return res.status(401).json({ message: "User not authenticated" });
}

const existingUser = await User.findOne({ name: user.name });
if (!existingUser) {
  return res.status(404).json({ message: "User not found in database" });
}
```

**NEW**:

```typescript
if (!req.isAuthenticated || !req.isAuthenticated()) {
  return res.status(401).json({ message: "User not authenticated" });
}

const user = req.user as Express.User;
const existingUser = await User.findById(user._id);
if (!existingUser) {
  return res.status(404).json({ message: "User not found in database" });
}
```

## 6. Installation and Setup

1. **Install the dependencies**:

```bash
npm install passport passport-google-oauth2 express-session
npm install --save-dev @types/passport @types/passport-google-oauth2 @types/express-session
```

2. **Create a Google OAuth application**:

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs (e.g., http://localhost:10000/auth/google/callback)
   - Copy the Client ID and Client Secret

3. **Set up environment variables**:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:10000/auth/google/callback
SESSION_SECRET=your-session-secret
```

## 7. Testing

Before deploying to production, thoroughly test:

1. Google OAuth login flow
2. User session persistence
3. Protected routes
4. User data access patterns

## 8. Future Improvements

Consider implementing:

1. Role-based authentication (admin/user)
2. Enhanced session security settings
3. Additional OAuth providers if needed

## 9. Migration Best Practices

For future reference, when migrating authentication in Express applications:

1. Install required packages (passport, passport strategies)
2. Configure the strategy in app.js/app.ts
3. Update user model to include OAuth provider fields
4. Update auth middleware to use passport's isAuthenticated
5. Update controllers to get user info from req.user
6. Update routes to use passport authentication
7. Update environment variables
8. Test thoroughly
