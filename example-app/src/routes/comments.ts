import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { IdParamSchema, PaginationQuerySchema, ApiResponse, PaginationOptions } from '../types/common';
import prisma from '../lib/prisma';
import Joi from 'joi';

// Import generated Joi schemas
import { CommentCreateSchema } from '../../prisma/generated/schemas/schemas/createOneComment.schema';
import { CommentUpdateOneSchema } from '../../prisma/generated/schemas/schemas/updateOneComment.schema';

const router = Router();

// Custom query schema for comments with additional filters
const CommentQuerySchema = PaginationQuerySchema.keys({
  postId: Joi.number().integer().positive().optional(),
  author: Joi.string().optional(),
});

// GET /comments - Get all comments with filtering and pagination
router.get('/', 
  validateQuery(CommentQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, orderBy, sortOrder, postId, author }: any = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (postId) where.postId = parseInt(postId);
    if (author) where.author = { contains: author };
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ? { [orderBy]: sortOrder } : { createdAt: sortOrder },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: comments,
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

// GET /comments/:id - Get comment by ID
router.get('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw createError('Comment not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: comment,
    };

    res.json(response);
  })
);

// POST /comments - Create new comment
router.post('/', 
  validateBody(CommentCreateSchema),
  asyncHandler(async (req: any, res: any) => {
    const commentData = req.body.data;
    
    // Verify that the post exists
    const post = await prisma.post.findUnique({
      where: { id: commentData.post?.connect?.id || commentData.postId },
      select: { id: true, title: true },
    });

    if (!post) {
      throw createError('Post not found', 404);
    }
    
    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: comment,
      message: 'Comment created successfully',
    };

    res.status(201).json(response);
  })
);

// PUT /comments/:id - Update comment
router.put('/:id', 
  validateParams(IdParamSchema),
  validateBody(CommentUpdateOneSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body.data;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingComment) {
      throw createError('Comment not found', 404);
    }

    const comment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: comment,
      message: 'Comment updated successfully',
    };

    res.json(response);
  })
);

// DELETE /comments/:id - Delete comment
router.delete('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existingComment) {
      throw createError('Comment not found', 404);
    }

    await prisma.comment.delete({
      where: { id: parseInt(id) },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Comment deleted successfully',
    };

    res.json(response);
  })
);

export default router;