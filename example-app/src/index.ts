import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { ApiResponse } from './types/common';

// Import routes
import usersRouter from './routes/users';
import postsRouter from './routes/posts';
import commentsRouter from './routes/comments';
import categoriesRouter from './routes/categories';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'Prisma Joi Express Demo API is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  };
  res.json(response);
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/categories', categoriesRouter);

// Welcome endpoint
app.get('/', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'Welcome to Prisma Joi Express Demo API',
    data: {
      version: '1.0.0',
      endpoints: {
        users: '/api/users',
        posts: '/api/posts',
        comments: '/api/comments',
        categories: '/api/categories',
        health: '/health',
      },
      documentation: {
        swagger: '/docs',
        postman: 'Available in the repository',
      },
    },
  };
  res.json(response);
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'API Documentation',
    data: {
      title: 'Prisma Joi Generator Demo API',
      description: 'A comprehensive Express.js API demonstrating the use of generated Joi schemas from Prisma',
      endpoints: {
        users: {
          'GET /api/users': 'Get all users with pagination',
          'GET /api/users/:id': 'Get user by ID',
          'POST /api/users': 'Create new user',
          'PUT /api/users/:id': 'Update user',
          'DELETE /api/users/:id': 'Delete user',
          'GET /api/users/:id/posts': 'Get user posts',
        },
        posts: {
          'GET /api/posts': 'Get all posts with filtering and pagination',
          'GET /api/posts/:id': 'Get post by ID',
          'POST /api/posts': 'Create new post',
          'PUT /api/posts/:id': 'Update post',
          'DELETE /api/posts/:id': 'Delete post',
          'POST /api/posts/:id/like': 'Like a post',
          'GET /api/posts/:id/comments': 'Get post comments',
        },
        comments: {
          'GET /api/comments': 'Get all comments with filtering and pagination',
          'GET /api/comments/:id': 'Get comment by ID',
          'POST /api/comments': 'Create new comment',
          'PUT /api/comments/:id': 'Update comment',
          'DELETE /api/comments/:id': 'Delete comment',
        },
        categories: {
          'GET /api/categories': 'Get all categories with pagination',
          'GET /api/categories/:id': 'Get category by ID',
          'GET /api/categories/slug/:slug': 'Get category by slug',
          'POST /api/categories': 'Create new category',
          'PUT /api/categories/:id': 'Update category',
          'DELETE /api/categories/:id': 'Delete category',
        },
      },
      validation: 'All endpoints use generated Joi schemas for request validation',
      database: 'SQLite with Prisma ORM',
      features: [
        'Full CRUD operations for all models',
        'Request validation using generated Joi schemas',
        'Pagination and filtering',
        'Error handling with detailed messages',
        'Relationship handling',
        'Auto-generated slugs',
      ],
    },
  };
  res.json(response);
});

// 404 handler
app.all('*', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

export default app;