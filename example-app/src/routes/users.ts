import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { IdParamSchema, PaginationQuerySchema, ApiResponse, PaginationOptions } from '../types/common';
import prisma from '../lib/prisma';

// Import generated Joi schemas
import { UserCreateSchema } from '../../prisma/generated/schemas/schemas/createOneUser.schema';
import { UserUpdateOneSchema } from '../../prisma/generated/schemas/schemas/updateOneUser.schema';
import { UserFindManySchema } from '../../prisma/generated/schemas/schemas/findManyUser.schema';

const router = Router();

// GET /users - Get all users with pagination
router.get('/', 
  validateQuery(PaginationQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, orderBy, sortOrder }: PaginationOptions = req.query;
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: orderBy ? { [orderBy]: sortOrder } : { createdAt: sortOrder },
        include: {
          posts: {
            select: {
              id: true,
              title: true,
              published: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);

    const response: ApiResponse = {
      success: true,
      data: users,
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

// GET /users/:id - Get user by ID
router.get('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    res.json(response);
  })
);

// POST /users - Create new user
router.post('/', 
  validateBody(UserCreateSchema),
  asyncHandler(async (req: any, res: any) => {
    const userData = req.body.data;
    
    const user = await prisma.user.create({
      data: userData,
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User created successfully',
    };

    res.status(201).json(response);
  })
);

// PUT /users/:id - Update user
router.put('/:id', 
  validateParams(IdParamSchema),
  validateBody(UserUpdateOneSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      throw createError('User not found', 404);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User updated successfully',
    };

    res.json(response);
  })
);

// DELETE /users/:id - Delete user
router.delete('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!existingUser) {
      throw createError('User not found', 404);
    }

    // Delete user (posts will be cascade deleted due to schema constraint)
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    const response: ApiResponse = {
      success: true,
      message: `User deleted successfully. ${existingUser._count.posts} associated posts were also deleted.`,
    };

    res.json(response);
  })
);

// GET /users/:id/posts - Get user's posts
router.get('/:id/posts', 
  validateParams(IdParamSchema),
  validateQuery(PaginationQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { page, limit, orderBy, sortOrder }: PaginationOptions = req.query;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: parseInt(id) },
        skip,
        take: limit,
        orderBy: orderBy ? { [orderBy]: sortOrder } : { createdAt: sortOrder },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({
        where: { authorId: parseInt(id) },
      }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        posts,
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