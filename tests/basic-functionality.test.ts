import { describe, it, expect } from 'vitest';
import Joi from 'joi';

describe('Basic Joi Generator Functionality', () => {
  describe('Core Schema Generation', () => {
    it('should import joi package correctly', () => {
      expect(Joi).toBeDefined();
      expect(typeof Joi.object).toBe('function');
      expect(typeof Joi.string).toBe('function');
      expect(typeof Joi.number).toBe('function');
    });

    it('should generate schemas with proper file structure', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Check that the generated directory exists
      const generatedDir = path.join(process.cwd(), 'prisma', 'generated', 'schemas');
      expect(await fs.access(generatedDir).then(() => true).catch(() => false)).toBe(true);
      
      // Check that basic schema files exist
      const createUserFile = path.join(generatedDir, 'createOneUser.schema.ts');
      const createPostFile = path.join(generatedDir, 'createOnePost.schema.ts');
      const indexFile = path.join(generatedDir, 'index.ts');
      
      expect(await fs.access(createUserFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(createPostFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(indexFile).then(() => true).catch(() => false)).toBe(true);
    });

    it('should generate valid typescript files', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const createUserFile = path.join(process.cwd(), 'prisma', 'generated', 'schemas', 'createOneUser.schema.ts');
      const content = await fs.readFile(createUserFile, 'utf-8');
      
      // Check that the file contains expected Joi imports and exports
      expect(content).toContain('import Joi from \'joi\'');
      expect(content).toContain('export const UserCreateSchema');
      expect(content).toContain('Joi.object()');
    });

    it('should generate enum schemas', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const enumsDir = path.join(process.cwd(), 'prisma', 'generated', 'schemas', 'enums');
      expect(await fs.access(enumsDir).then(() => true).catch(() => false)).toBe(true);
      
      // Check for specific enum files
      const sortOrderFile = path.join(enumsDir, 'SortOrder.schema.ts');
      expect(await fs.access(sortOrderFile).then(() => true).catch(() => false)).toBe(true);
      
      const sortOrderContent = await fs.readFile(sortOrderFile, 'utf-8');
      expect(sortOrderContent).toContain('import Joi from \'joi\'');
      expect(sortOrderContent).toContain('export const SortOrderSchema');
    });

    it('should generate object schemas', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const objectsDir = path.join(process.cwd(), 'prisma', 'generated', 'schemas', 'objects');
      expect(await fs.access(objectsDir).then(() => true).catch(() => false)).toBe(true);
      
      // Check for specific object files
      const userCreateFile = path.join(objectsDir, 'UserCreateInput.schema.ts');  
      expect(await fs.access(userCreateFile).then(() => true).catch(() => false)).toBe(true);
      
      const userCreateContent = await fs.readFile(userCreateFile, 'utf-8');
      expect(userCreateContent).toContain('import Joi from \'joi\'');
      expect(userCreateContent).toContain('export const UserCreateInputSchemaObject');
    });
  });

  describe('Direct Joi Schema Testing', () => {
    it('should create simple joi validation schema', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().optional(),
      });

      const { error: validError } = schema.validate({
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(validError).toBeUndefined();

      const { error: invalidError } = schema.validate({
        email: 'invalid-email'
      });
      expect(invalidError).toBeDefined();
    });
  });
});