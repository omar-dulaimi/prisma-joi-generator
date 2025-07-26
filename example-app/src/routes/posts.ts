import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { IdParamSchema, PaginationQuerySchema, ApiResponse, PaginationOptions } from '../types/common';
import prisma from '../lib/prisma';
import Joi from 'joi';

// Import generated Joi schemas
import { PostCreateSchema } from '../../prisma/generated/schemas/schemas/createOnePost.schema';
import { PostUpdateOneSchema } from '../../prisma/generated/schemas/schemas/updateOnePost.schema';
import { PostFindManySchema } from '../../prisma/generated/schemas/schemas/findManyPost.schema';

const router = Router();

// Custom query schema for posts with additional filters
const PostQuerySchema = PaginationQuerySchema.keys({
  published: Joi.boolean().optional(),
  authorId: Joi.number().integer().positive().optional(),
  search: Joi.string().optional(),
  featured: Joi.boolean().optional(),
});

// GET /posts - Get all posts with filtering and pagination
router.get('/', 
  validateQuery(PostQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, orderBy, sortOrder, published, authorId, search, featured }: any = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (published !== undefined) where.published = published === 'true' || published === true;
    if (authorId) where.authorId = parseInt(authorId);
    if (featured !== undefined) where.featured = featured === 'true' || featured === true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ? { [orderBy]: sortOrder } : { createdAt: sortOrder },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  })
);

// GET /posts/:id - Get post by ID
router.get('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Latest 10 comments
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw createError('Post not found', 404);
    }

    // Increment view count
    await prisma.post.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } },
    });

    const response: ApiResponse = {
      success: true,
      data: { ...post, viewCount: post.viewCount + 1 },
    };

    res.json(response);
  })
);

// POST /posts - Create new post
router.post('/', 
  validateBody(PostCreateSchema),
  asyncHandler(async (req: any, res: any) => {
    const postData = req.body.data;
    
    // Generate slug from title if not provided
    if (!postData.slug && postData.title) {
      postData.slug = postData.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    }

    // Set publishedAt if publishing
    if (postData.published && !postData.publishedAt) {
      postData.publishedAt = new Date();
    }
    
    const post = await prisma.post.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: post,
      message: 'Post created successfully',
    };

    res.status(201).json(response);
  })
);

// PUT /posts/:id - Update post
router.put('/:id', 
  validateParams(IdParamSchema),
  validateBody(PostUpdateOneSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body.data;

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost) {
      throw createError('Post not found', 404);
    }

    // Handle publishing logic
    if (updateData.published && !existingPost.published && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    } else if (updateData.published === false) {
      updateData.publishedAt = null;
    }

    // Update slug if title changed and no slug provided
    if (updateData.title && !updateData.slug) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    }

    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: post,
      message: 'Post updated successfully',
    };

    res.json(response);
  })
);

// DELETE /posts/:id - Delete post
router.delete('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!existingPost) {
      throw createError('Post not found', 404);
    }

    // Delete post (comments will be cascade deleted due to schema constraint)
    await prisma.post.delete({
      where: { id: parseInt(id) },
    });

    const response: ApiResponse = {
      success: true,
      message: `Post deleted successfully. ${existingPost._count.comments} associated comments were also deleted.`,
    };

    res.json(response);
  })
);

// POST /posts/:id/like - Like/unlike post
router.post('/:id/like', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, likes: true, title: true },
    });

    if (!post) {
      throw createError('Post not found', 404);
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true, title: true },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedPost,
      message: 'Post liked successfully',
    };

    res.json(response);
  })
);

// GET /posts/:id/comments - Get post comments
router.get('/:id/comments', 
  validateParams(IdParamSchema),
  validateQuery(PaginationQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { page, limit, orderBy, sortOrder }: PaginationOptions = req.query;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true },
    });

    if (!post) {
      throw createError('Post not found', 404);
    }

    const skip = (page - 1) * limit;
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: parseInt(id) },
        skip,
        take: limit,
        orderBy: orderBy ? { [orderBy]: sortOrder } : { createdAt: sortOrder },
      }),
      prisma.comment.count({
        where: { postId: parseInt(id) },
      }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        post,
        comments,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  })
);

export default router;