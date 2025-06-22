# বঙ্গ-Lore Backend

## Bengali Cultural B2B Social Media Platform API

This is the backend server for **বঙ্গ-Lore**, a comprehensive Node.js application powering Bengal's first cultural B2B social media platform. It provides a complete API ecosystem for managing Bengali cultural content, B2B services, and AI-powered cultural insights targeting the ₹84,000 crore Bengali cultural economy.

## 🎯 Project Overview

The বঙ্গ-Lore backend serves as the digital backbone for Bengali cultural communities and businesses, processing millions of cultural interactions while providing sophisticated B2B tools for Durga Puja committees, local businesses, and cultural organizations across Bengal and the global Bengali diaspora.

### Core Capabilities
- **Cultural Content Management**: Handle Bengali text, images, and videos with cultural context
- **AI-Powered Analytics**: Gemini-based content analysis and Bengali story generation
- **B2B Revenue Systems**: Subscription billing, event commerce, and advertising platforms
- **Vector Search**: MongoDB-powered content recommendations and cultural discovery
- **HyperRural Chatbot**: Bengali conversational AI with local cultural intelligence

## 🚀 Key Features

### Authentication & User Management
- **Civic Auth Integration**: Secure identity verification for cultural communities
- **Multi-tier Accounts**: Personal, business, and cultural organization profiles
- **Bengali Profile Support**: Native language profile management
- **Role-based Access**: Granular permissions for different user types

### Content Processing Engine
- **Multi-modal Upload**: Photos, videos, and audio with cultural tagging
- **Cloudinary Integration**: Optimized media storage and delivery
- **AI Content Enhancement**: Gemini-powered cultural story generation (60 words in Bengali)
- **Vector Embeddings**: Semantic search for cultural content discovery
- **Automated Moderation**: Bengali content safety and cultural sensitivity

### B2B Services Infrastructure
- **Event Management**: Durga Puja committee tools and vendor marketplace
- **Subscription Billing**: Tiered pricing from ₹2,999 to ₹15,999 monthly
- **Analytics Dashboard**: Cultural engagement metrics and business intelligence
- **Payment Processing**: Secure transactions for B2B services
- **Campaign Management**: Advertising tools for local Bengali businesses

### AI & Machine Learning
- **Gemini Integration**: Bengali language processing and cultural context understanding
- **Vector Search**: MongoDB Atlas-powered content recommendations
- **HyperRural Chatbot**: Multi-modal Bengali AI assistant with local knowledge
- **Content Analysis**: Automatic tagging, sentiment analysis, and cultural categorization
- **Smart Recommendations**: Personalized cultural content discovery

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: [Node.js](https://nodejs.org/) v18+ with [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Authentication**: [Passport.js](http://www.passportjs.org/) with [JWT](https://jwt.io/)

### AI & Cloud Services
- **AI Platform**: [Google Gemini](https://ai.google.dev/) for Bengali language processing
- **Vector Database**: [MongoDB Atlas Vector Search](https://www.mongodb.com/atlas/search)
- **Media Storage**: [Cloudinary](https://cloudinary.com/) for image/video optimization
- **Search Engine**: Google Search API integration for HyperRural chatbot

### Supporting Services
- **File Uploads**: [Multer](https://github.com/expressjs/multer) with custom Bengali filename handling
- **Validation**: [Joi](https://joi.dev/) with Bengali text validation
- **Logging**: [Winston](https://github.com/winstonjs/winston) with cultural event tracking
- **Rate Limiting**: [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)

## 🏗️ Project Structure

```
src/
├── controllers/          # API route handlers
│   ├── authController.ts       # User authentication
│   ├── postController.ts       # Cultural content management
│   ├── eventController.ts      # Durga Puja events
│   ├── businessController.ts   # B2B services
│   └── chatbotController.ts    # HyperRural AI
├── models/              # Database schemas
│   ├── User.ts               # User profiles
│   ├── Post.ts               # Cultural posts
│   ├── Event.ts              # Cultural events
│   ├── Business.ts           # Business accounts
│   ├── Transaction.ts        # B2B payments
│   └── ChatHistory.ts        # Chatbot conversations
├── routes/              # API endpoints
│   ├── auth.ts
│   ├── posts.ts
│   ├── events.ts
│   ├── business.ts
│   └── chatbot.ts
├── services/            # Business logic
│   ├── geminiService.ts      # AI content generation
│   ├── vectorService.ts      # Content recommendations
│   ├── paymentService.ts     # B2B billing
│   └── analyticsService.ts   # Business insights
├── middleware/          # Request processing
│   ├── authMiddleware.ts
│   ├── validationMiddleware.ts
│   └── bengaliMiddleware.ts
├── utils/              # Utility functions
│   ├── bengaliUtils.ts       # Bengali text processing
│   ├── vectorUtils.ts        # Embedding generation
│   └── culturalUtils.ts      # Cultural context helpers
├── config/             # Configuration
│   ├── database.ts
│   ├── cloudinary.ts
│   └── gemini.ts
└── app.ts              # Express application
```

## 📋 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/refresh      # Token refresh
POST /api/auth/logout       # User logout
```

### Cultural Content
```
GET    /api/posts          # Get cultural feed
POST   /api/posts          # Create cultural post
GET    /api/posts/:id      # Get specific post
PUT    /api/posts/:id      # Update post
DELETE /api/posts/:id      # Delete post
POST   /api/posts/:id/like # Like/unlike post
```

### Events & Business
```
GET    /api/events         # Discover cultural events
POST   /api/events         # Create event (B2B)
GET    /api/business       # Business dashboard
POST   /api/business/ads   # Create advertisement
GET    /api/analytics      # Business analytics
```

### HyperRural Chatbot
```
POST   /api/chat/message   # Send message to Bengali AI
GET    /api/chat/history   # Get conversation history
POST   /api/chat/voice     # Voice message processing
```

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd borbonash-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build and start:**
   ```bash
   npm run build
   npm start
   ```

### Development Mode
```bash
npm run dev  # Auto-restart on changes
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=10000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bonglore?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CIVIC_AUTH_CLIENT_ID=your_civic_auth_client_id
CIVIC_AUTH_CLIENT_SECRET=your_civic_auth_client_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
SARVAM_API_KEY=your_sarvam_api_key_here

# Cloud Services
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payment Processing (for B2B features)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# External APIs
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id

# Monitoring & Analytics
SENTRY_DSN=your_sentry_dsn_for_error_tracking
MIXPANEL_TOKEN=your_mixpanel_token_for_analytics

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## 🎯 Business Model Integration

### Revenue Streams
The backend implements three primary B2B revenue streams:

1. **Event-Commerce Ecosystem** (₹15-25 lakhs annually)
   - Durga Puja committee partnerships
   - Vendor marketplace commissions
   - Premium event listings

2. **Hyperlocal B2B Advertising** (₹10-20 lakhs annually)
   - Sponsored content placement
   - Business profile promotions
   - Cultural event advertising

3. **Premium Business Services** (₹5-15 lakhs annually)
   - Advanced analytics access
   - Custom API integrations
   - Dedicated account management

### Subscription Tiers
```typescript
// Pricing configuration
const SUBSCRIPTION_TIERS = {
  BASIC: { price: 2999, features: ['basic_analytics', 'profile_listing'] },
  STANDARD: { price: 7999, features: ['enhanced_visibility', 'customer_insights'] },
  PREMIUM: { price: 15999, features: ['full_analytics', 'priority_support', 'custom_features'] }
};
```

## 🧠 AI Integration Architecture

### Gemini Services
```typescript
// Bengali content generation
const generateBengaliStory = async (mediaUrl: string, context: string) => {
  const prompt = `Generate a 60-word story in Bengali about this ${context}`;
  return await geminiClient.generateContent(prompt);
};

// Cultural content analysis
const analyzeCulturalContent = async (content: string) => {
  return await geminiClient.analyzeContent({
    text: content,
    language: 'bn',
    culturalContext: 'bengali'
  });
};
```

### Vector Search Implementation
```typescript
// MongoDB vector search for recommendations
const findSimilarPosts = async (postId: string, limit: number = 10) => {
  return await Post.aggregate([
    {
      $vectorSearch: {
        index: "cultural_content_vector_index",
        path: "embeddings",
        queryVector: await getPostEmbedding(postId),
        numCandidates: 100,
        limit: limit
      }
    }
  ]);
};
```

## 🔐 Security & Compliance

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Bengali Content**: Specialized handling for Bengali text encoding
- **GDPR Compliance**: User data management for global Bengali diaspora
- **Content Moderation**: AI-powered safety checks for cultural content

### Rate Limiting
```typescript
// API rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
};
```

## 📊 Monitoring & Analytics

### Performance Metrics
- **Response Time**: < 200ms for cultural content delivery
- **Uptime**: 99.9% availability for B2B services
- **Bengali AI Accuracy**: > 95% for content generation
- **Vector Search Speed**: < 50ms for content recommendations

### Business Intelligence
- Daily active users and engagement metrics
- B2B subscription conversion rates
- Cultural event participation tracking
- Revenue per customer analysis

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report
```

### API Testing
```bash
npm run test:api           # API endpoint tests
npm run test:bengali       # Bengali language processing tests
npm run test:business      # B2B functionality tests
```

## 🚀 Deployment

### Development
```bash
npm run dev                # Local development
npm run build             # Build for production
npm run start             # Start production server
```

### Production
```bash
# Docker deployment
docker build -t bonglore-backend .
docker run -p 10000:10000 bonglore-backend

# PM2 process management
pm2 start dist/app.js --name bonglore-backend
pm2 logs bonglore-backend
pm2 restart bonglore-backend
```

## 📈 Scaling Considerations

### Database Optimization
- **Indexing**: Optimized indexes for Bengali text search
- **Sharding**: Horizontal scaling for large cultural datasets
- **Caching**: Redis integration for frequently accessed content

### Load Balancing
- **API Gateway**: Rate limiting and request routing
- **CDN**: Cloudinary integration for media delivery
- **Microservices**: Modular architecture for independent scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/bengali-enhancement`
3. Commit changes: `git commit -m 'Add Bengali festival calendar API'`
4. Push to branch: `git push origin feature/bengali-enhancement`
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Add Bengali language tests for new features
- Document B2B integration points
- Include cultural context in AI prompts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bengali cultural experts and community advisors
- Google Gemini team for Bengali language support
- MongoDB Atlas team for vector search capabilities
- Durga Puja committees across Bengal for their partnership
- Open source Bengali NLP community

---

**বঙ্গ-Lore Backend** - *Powering Bengali cultural commerce through modern technology* 🇧🇩

For support, contact: support@bonglore.com
