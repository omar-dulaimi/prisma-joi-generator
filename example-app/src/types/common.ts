import Joi from 'joi';

// Common parameter schemas
export const IdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// Common query schemas
export const PaginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  orderBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  sortOrder?: 'asc' | 'desc';
}