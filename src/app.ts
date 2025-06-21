import express, { Request, Response, NextFunction } from 'express'; // Default import for express, named imports for types
import * as dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import router from './routes/index.js';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middlewares/authmiddleware.js';
import authrouter from './routes/authroutes.js';
import mediaProcessingRoutes from './routes/mediaProcessingRoutes.js';
import postroutes from './routes/postroutes.js';
import eventroutes from './routes/eventroutes.js';
import collectionroutes from './routes/collectionroutes.js';
import vectorSearchRoutes from './routes/vectorSearchRoutes.js';
import tagroutes from './routes/tagroutes.js';
import { connectDB } from './dbconfig/dbconnect.js';
import User from './models/User.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());

// Apply the JWT authentication middleware to all routes
app.use(authMiddleware);

// Public routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Sorbonash backend running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Authentication routes (public - no auth middleware needed for login/logout/callback)
app.use('/auth', authrouter);

// Protected API routes
app.use('/api', router);

// Post routes with auth middleware - directly mounted
interface AuthenticatedRequest extends Request {
  user?: any;
}

interface TypedResponse<T = any> extends Response<T> {}

app.use(
  '/api/posts',
  (req: AuthenticatedRequest, res: TypedResponse, next: NextFunction) => {
    // authMiddleware(req, res, next);
  },
  postroutes
);

// Event routes
app.use(
  '/api/events',
  (req: AuthenticatedRequest, res: TypedResponse, next: NextFunction) => {
    // authMiddleware(req, res, next);
  },
  eventroutes
);

// Collection routes
app.use(
  '/api/collections',
  (req: AuthenticatedRequest, res: TypedResponse, next: NextFunction) => {
    // authMiddleware(req, res, next);
  },
  collectionroutes
);

// Media processing routes with auth middleware
interface MediaProcessingRequest extends Request {
  user?: any;
}

interface MediaProcessingResponse<T = any> extends Response<T> {}

app.use(
  '/api/processing',
  (req: MediaProcessingRequest, res: MediaProcessingResponse, next: NextFunction) => {
    authMiddleware(req, res, next);
  },
  mediaProcessingRoutes
);

// Vector search routes
app.use(
  '/api/vector',
  (req: AuthenticatedRequest, res: TypedResponse, next: NextFunction) => {
    next(); // No auth required for search endpoints
  },
  vectorSearchRoutes
);

// Tag routes
app.use('/api/tags', tagroutes);

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
