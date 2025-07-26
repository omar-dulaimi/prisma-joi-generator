# 🚀 Prisma Joi Generator - Express.js Demo

A comprehensive Express.js API demonstrating the use of **generated Joi schemas** from Prisma with SQLite database. This project showcases full CRUD operations, request validation, error handling, and pagination using the Prisma Joi Generator.

## ✨ Features

- **🛡️ Generated Joi Validation**: All endpoints use auto-generated Joi schemas from Prisma
- **📚 Full CRUD Operations**: Complete Create, Read, Update, Delete operations for all models
- **🔍 Advanced Filtering**: Search, pagination, and sorting capabilities
- **💾 SQLite Database**: Lightweight database perfect for development and demos
- **🎯 Type-Safe**: Full TypeScript support with Prisma types
- **🚨 Error Handling**: Comprehensive error handling with detailed messages
- **📖 Self-Documenting**: Built-in API documentation endpoint
- **🌱 Sample Data**: Pre-populated database with realistic sample data

## 📋 Models

The API includes the following models with full CRUD support:

### 👥 Users
- User management with profile information
- User posts relationship
- Account status tracking

### 📝 Posts
- Blog post management with rich content
- Publishing workflow (draft/published)
- View counts and likes
- Author relationships
- Auto-generated slugs

### 💬 Comments
- Comment system for posts
- Author information
- Nested relationships

### 🏷️ Categories
- Content categorization
- Slug-based access
- Color coding support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate database and schemas**:
   ```bash
   npm run db:push
   npm run db:generate
   ```

3. **Seed the database**:
   ```bash
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Visit `http://localhost:3000/docs` for complete API documentation, or see the endpoints below:

### 🔗 Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message with API overview |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/docs` | Complete API documentation |

### 👥 Users API

| Method | Endpoint | Description | Validation Schema |
|--------|----------|-------------|-------------------|
| `GET` | `/api/users` | Get all users with pagination | Query params |
| `GET` | `/api/users/:id` | Get user by ID | ID param |
| `POST` | `/api/users` | Create new user | `UserCreateSchema` |
| `PUT` | `/api/users/:id` | Update user | `UserUpdateSchema` |
| `DELETE` | `/api/users/:id` | Delete user | ID param |
| `GET` | `/api/users/:id/posts` | Get user's posts | ID param + pagination |

### 📝 Posts API

| Method | Endpoint | Description | Validation Schema |
|--------|----------|-------------|-------------------|
| `GET` | `/api/posts` | Get all posts with filtering | Query params |
| `GET` | `/api/posts/:id` | Get post by ID | ID param |
| `POST` | `/api/posts` | Create new post | `PostCreateSchema` |
| `PUT` | `/api/posts/:id` | Update post | `PostUpdateSchema` |
| `DELETE` | `/api/posts/:id` | Delete post | ID param |
| `POST` | `/api/posts/:id/like` | Like a post | ID param |
| `GET` | `/api/posts/:id/comments` | Get post comments | ID param + pagination |

### 💬 Comments API

| Method | Endpoint | Description | Validation Schema |
|--------|----------|-------------|-------------------|
| `GET` | `/api/comments` | Get all comments with filtering | Query params |
| `GET` | `/api/comments/:id` | Get comment by ID | ID param |
| `POST` | `/api/comments` | Create new comment | `CommentCreateSchema` |
| `PUT` | `/api/comments/:id` | Update comment | `CommentUpdateSchema` |
| `DELETE` | `/api/comments/:id` | Delete comment | ID param |

### 🏷️ Categories API

| Method | Endpoint | Description | Validation Schema |
|--------|----------|-------------|-------------------|
| `GET` | `/api/categories` | Get all categories | Query params |
| `GET` | `/api/categories/:id` | Get category by ID | ID param |
| `GET` | `/api/categories/slug/:slug` | Get category by slug | Slug param |
| `POST` | `/api/categories` | Create new category | `CategoryCreateSchema` |
| `PUT` | `/api/categories/:id` | Update category | `CategoryUpdateSchema` |
| `DELETE` | `/api/categories/:id` | Delete category | ID param |

## 🔍 Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `orderBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: desc)

### Filtering (Posts)
- `published`: Filter by published status
- `authorId`: Filter by author ID
- `search`: Search in title and content
- `featured`: Filter featured posts

### Filtering (Comments)
- `postId`: Filter by post ID
- `author`: Search by author name

### Filtering (Categories)
- `search`: Search in name and description

## 📖 Request/Response Examples

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "user@example.com",
      "name": "John Doe",
      "bio": "Software developer"
    }
  }'
```

### Get Posts with Filtering
```bash
curl "http://localhost:3000/api/posts?published=true&page=1&limit=5&search=prisma"
```

### Create Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "My New Post",
      "content": "Post content here...",
      "published": true,
      "author": {
        "connect": { "id": 1 }
      }
    }
  }'
```

## 🛡️ Validation

All endpoints use **generated Joi schemas** from Prisma for request validation:

- **Automatic Generation**: Schemas are generated from your Prisma models
- **Type Safety**: Full TypeScript support with proper typing
- **Comprehensive Validation**: All Prisma constraints are enforced
- **Clear Error Messages**: Detailed validation errors with field-level feedback

Example validation error response:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "data.email",
      "message": "\"email\" must be a valid email",
      "value": "invalid-email"
    }
  ]
}
```

## 📊 Database Schema

The SQLite database includes:

```sql
-- Users table with profile information
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  avatar TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts with rich content and metadata
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  viewCount INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  slug TEXT UNIQUE,
  tags TEXT, -- JSON string
  featured BOOLEAN DEFAULT false,
  authorId INTEGER REFERENCES users(id) ON DELETE CASCADE,
  -- ... timestamps
);

-- Comments linked to posts
-- Categories for content organization
```

## 🧪 Testing the API

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Check health**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Get API documentation**:
   ```bash
   curl http://localhost:3000/docs
   ```

4. **List users**:
   ```bash
   curl http://localhost:3000/api/users
   ```

5. **Create a new user**:
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"data": {"email": "test@example.com", "name": "Test User"}}'
   ```

## 🏗️ Project Structure

```
src/
├── lib/
│   └── prisma.ts          # Database connection
├── middleware/
│   ├── errorHandler.ts    # Error handling middleware
│   └── validation.ts      # Joi validation middleware
├── routes/
│   ├── users.ts          # User CRUD routes
│   ├── posts.ts          # Post CRUD routes
│   ├── comments.ts       # Comment CRUD routes
│   └── categories.ts     # Category CRUD routes
├── types/
│   └── common.ts         # Common types and schemas
├── index.ts              # Express app setup
└── seed.ts               # Database seeding script

prisma/
├── schema.prisma         # Prisma schema definition
├── dev.db               # SQLite database file
└── generated/
    └── schemas/         # Generated Joi schemas
        ├── schemas/     # Operation schemas
        ├── objects/     # Input object schemas
        └── enums/       # Enum schemas
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client and Joi schemas |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with sample data |

## 🌟 Key Features Demonstrated

### ✅ Generated Joi Validation
- All CRUD operations use generated Joi schemas
- Type-safe validation with comprehensive error messages
- Automatic schema updates when Prisma models change

### ✅ Comprehensive CRUD Operations
- Create, read, update, delete for all models
- Relationship handling (users ↔ posts ↔ comments)
- Cascade deletes and data integrity

### ✅ Advanced Query Capabilities
- Pagination with configurable limits
- Sorting by any field with asc/desc order
- Full-text search across multiple fields
- Boolean and relational filtering

### ✅ Professional Error Handling
- Prisma error mapping to HTTP status codes
- Detailed validation error responses
- Consistent API response format
- Development vs production error messages

### ✅ Database Best Practices
- Proper foreign key relationships
- Cascade delete constraints
- Optimized queries with selective field loading
- Transaction support for data integrity

## 🚀 Production Considerations

This demo includes production-ready patterns:

- **Environment Configuration**: Ready for environment variables
- **Error Logging**: Structured error logging
- **Request Validation**: Comprehensive input validation
- **Database Optimization**: Efficient queries and indexing
- **API Documentation**: Self-documenting endpoints
- **Type Safety**: Full TypeScript coverage

## 📝 License

This demo project is part of the Prisma Joi Generator and is licensed under the MIT License.

---

🎉 **Happy coding!** This demo showcases the power of generated Joi schemas for building robust, type-safe APIs with minimal boilerplate code.