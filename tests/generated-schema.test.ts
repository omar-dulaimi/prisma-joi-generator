import { describe, it, expect, beforeAll } from 'vitest';
import Joi from 'joi';

describe('Generated Joi Schemas', () => {
  beforeAll(async () => {
    // Ensure schemas are generated before running tests
    const { execSync } = await import('child_process');
    try {
      execSync('npm run gen-example', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to generate schemas:', error);
      throw error;
    }
  });

  describe('Basic Schema Functionality', () => {
    it('should generate valid Joi schemas', async () => {
      // Import generated schemas
      const createOneUser = await import('../prisma/generated/schemas/createOneUser.schema');
      const createOnePost = await import('../prisma/generated/schemas/createOnePost.schema');
      
      expect(createOneUser.UserCreateSchema).toBeDefined();
      expect(createOnePost.PostCreateSchema).toBeDefined();
      
      // Verify they are Joi schemas
      expect(Joi.isSchema(createOneUser.UserCreateSchema)).toBe(true);
      expect(Joi.isSchema(createOnePost.PostCreateSchema)).toBe(true);
    });

    it('should validate user creation data correctly', async () => {
      const { UserCreateSchema } = await import('../prisma/generated/schemas/createOneUser.schema');
      
      // Valid data
      const validUserData = {
        data: {
          email: 'test@example.com',
          name: 'Test User'
        }
      };
      
      const { error: validError, value: validValue } = UserCreateSchema.validate(validUserData);
      expect(validError).toBeUndefined();
      expect(validValue).toEqual(validUserData);
      
      // Invalid data - missing required email
      const invalidUserData = {
        data: {
          name: 'Test User'
        }
      };
      
      const { error: invalidError } = UserCreateSchema.validate(invalidUserData);
      expect(invalidError).toBeDefined();
    });

    it('should validate post creation data correctly', async () => {
      const { PostCreateSchema } = await import('../prisma/generated/schemas/createOnePost.schema');
      
      // Valid data
      const validPostData = {
        data: {
          title: 'Test Post',
          content: 'This is a test post',
          published: false,
          viewCount: 0,
          author: {
            connect: { id: 1 }
          }
        }
      };
      
      const { error: validError, value: validValue } = PostCreateSchema.validate(validPostData);
      expect(validError).toBeUndefined();
      expect(validValue).toEqual(validPostData);
      
      // Invalid data - missing required title
      const invalidPostData = {
        data: {
          content: 'This is a test post'
        }
      };
      
      const { error: invalidError } = PostCreateSchema.validate(invalidPostData);
      expect(invalidError).toBeDefined();
    });
  });

  describe('Schema Exports', () => {
    it('should export all main operation schemas', async () => {
      const schemas = await import('../prisma/generated/schemas');
      
      // Check that main schemas are exported
      expect(schemas.UserCreateSchema).toBeDefined();
      expect(schemas.UserFindManySchema).toBeDefined();
      expect(schemas.UserUpdateSchema).toBeDefined();
      expect(schemas.UserDeleteSchema).toBeDefined();
      
      expect(schemas.PostCreateSchema).toBeDefined();
      expect(schemas.PostFindManySchema).toBeDefined();
      expect(schemas.PostUpdateSchema).toBeDefined();
      expect(schemas.PostDeleteSchema).toBeDefined();
    });

    it('should export enum schemas', async () => {
      const enums = await import('../prisma/generated/schemas/enums');
      
      expect(enums.SortOrderSchema).toBeDefined();
      expect(enums.UserScalarFieldEnumSchema).toBeDefined();
      expect(enums.PostScalarFieldEnumSchema).toBeDefined();
    });

    it('should export object schemas', async () => {
      const objects = await import('../prisma/generated/schemas/objects');
      
      expect(objects.UserCreateInputSchemaObject).toBeDefined();
      expect(objects.PostCreateInputSchemaObject).toBeDefined();
      expect(objects.UserWhereInputSchemaObject).toBeDefined();
      expect(objects.PostWhereInputSchemaObject).toBeDefined();
    });
  });
});