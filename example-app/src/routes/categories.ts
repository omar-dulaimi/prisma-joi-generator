import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { IdParamSchema, PaginationQuerySchema, ApiResponse, PaginationOptions } from '../types/common';
import prisma from '../lib/prisma';
import Joi from 'joi';

// Import generated Joi schemas
import { CategoryCreateSchema } from '../../prisma/generated/schemas/schemas/createOneCategory.schema';
import { CategoryUpdateOneSchema } from '../../prisma/generated/schemas/schemas/updateOneCategory.schema';

const router = Router();

// Custom query schema for categories
const CategoryQuerySchema = PaginationQuerySchema.keys({
  search: Joi.string().optional(),
});

// GET /categories - Get all categories with pagination
router.get('/', 
  validateQuery(CategoryQuerySchema),
  asyncHandler(async (req: any, res: any) => {
    const { page, limit, orderBy, sortOrder, search }: any = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ? { [orderBy]: sortOrder } : { name: 'asc' },
      }),
      prisma.category.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: categories,
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

// GET /categories/:id - Get category by ID
router.get('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      throw createError('Category not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: category,
    };

    res.json(response);
  })
);

// GET /categories/slug/:slug - Get category by slug
router.get('/slug/:slug', 
  asyncHandler(async (req: any, res: any) => {
    const { slug } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw createError('Category not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: category,
    };

    res.json(response);
  })
);

// POST /categories - Create new category
router.post('/', 
  validateBody(CategoryCreateSchema),
  asyncHandler(async (req: any, res: any) => {
    const categoryData = req.body.data;
    
    // Generate slug from name if not provided
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    }
    
    const category = await prisma.category.create({
      data: categoryData,
    });

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category created successfully',
    };

    res.status(201).json(response);
  })
);

// PUT /categories/:id - Update category
router.put('/:id', 
  validateParams(IdParamSchema),
  validateBody(CategoryUpdateOneSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body.data;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      throw createError('Category not found', 404);
    }

    // Update slug if name changed and no slug provided
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category updated successfully',
    };

    res.json(response);
  })
);

// DELETE /categories/:id - Delete category
router.delete('/:id', 
  validateParams(IdParamSchema),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      throw createError('Category not found', 404);
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
    };

    res.json(response);
  })
);

export default router;