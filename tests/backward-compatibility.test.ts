import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

describe('Backward Compatibility Tests', () => {
  const testDir = path.join(__dirname, '../test-regression');
  const schemaPath = path.join(testDir, 'schema.prisma');
  const outputPath = path.join(testDir, 'generated');

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Create legacy configuration test schema
    const legacySchema = `
generator client {
  provider = "prisma-client-js"
}

// Legacy configuration - no new options should work exactly as before
generator joi {
  provider = "node ${path.join(__dirname, '../lib/generator.js')}"
  output   = "./generated"
}

datasource db {
  provider = "sqlite"
  url      = "file:./test.db"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  isActive  Boolean  @default(true)
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id          Int      @id @default(autoincrement())
  title       String
  content     String?
  published   Boolean  @default(false)
  viewCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  author      User     @relation(fields: [authorId], references: [id])
  authorId    Int
}

enum UserRole {
  USER
  ADMIN
}
`;
    
    await fs.writeFile(schemaPath, legacySchema.trim());
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate all operation types with legacy configuration', async () => {
    // Generate schemas
    execSync(`npx prisma generate --schema="${schemaPath}"`, {
      cwd: testDir,
      stdio: 'pipe',
      timeout: 30000 // 30 second timeout
    });

    // Check that output directory exists
    const outputExists = await fs.access(outputPath).then(() => true).catch(() => false);
    expect(outputExists).toBe(true);

    // Check schemas directory structure
    const schemasDir = path.join(outputPath, 'schemas');
    const enumsDir = path.join(outputPath, 'schemas', 'enums');
    const objectsDir = path.join(outputPath, 'schemas', 'objects');

    expect(await fs.access(schemasDir).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(enumsDir).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(objectsDir).then(() => true).catch(() => false)).toBe(true);
  }, 30000);

  it('should generate all expected operation files', async () => {
    const schemasDir = path.join(outputPath, 'schemas');
    const files = await fs.readdir(schemasDir);
    const schemaFiles = files.filter(f => f.endsWith('.schema.ts'));

    // Expected operations for User and Post models
    const expectedOperations = [
      // Create operations
      'createOneUser.schema.ts',
      'createOnePost.schema.ts',
      
      // Find operations  
      'findUniqueUser.schema.ts',
      'findFirstUser.schema.ts',
      'findManyUser.schema.ts',
      'findUniquePost.schema.ts',
      'findFirstPost.schema.ts',
      'findManyPost.schema.ts',
      
      // Update operations
      'updateOneUser.schema.ts',
      'updateManyUser.schema.ts',
      'updateOnePost.schema.ts',
      'updateManyPost.schema.ts',
      
      // Delete operations
      'deleteOneUser.schema.ts',
      'deleteManyUser.schema.ts',
      'deleteOnePost.schema.ts',
      'deleteManyPost.schema.ts',
      
      // Upsert operations
      'upsertOneUser.schema.ts',
      'upsertOnePost.schema.ts',
      
      // Aggregate operations
      'aggregateUser.schema.ts',
      'aggregatePost.schema.ts',
      
      // GroupBy operations
      'groupByUser.schema.ts',
      'groupByPost.schema.ts',
    ];

    for (const expectedFile of expectedOperations) {
      expect(schemaFiles).toContain(expectedFile);
    }
  });

  it('should generate enum schemas', async () => {
    const enumsDir = path.join(outputPath, 'schemas', 'enums');
    const enumFiles = await fs.readdir(enumsDir);
    
    // Should contain UserRole enum
    expect(enumFiles).toContain('UserRole.schema.ts');
    
    // Check enum content
    const userRoleContent = await fs.readFile(
      path.join(enumsDir, 'UserRole.schema.ts'), 
      'utf8'
    );
    expect(userRoleContent).toContain('USER');
    expect(userRoleContent).toContain('ADMIN');
    expect(userRoleContent).toContain('Joi.string().valid');
  });

  it('should generate input object schemas', async () => {
    const objectsDir = path.join(outputPath, 'schemas', 'objects');
    const objectFiles = await fs.readdir(objectsDir);
    
    // Should contain input object types
    const expectedObjects = [
      'UserCreateInput.schema.ts',
      'UserWhereInput.schema.ts',
      'UserWhereUniqueInput.schema.ts',
      'PostCreateInput.schema.ts',
      'PostWhereInput.schema.ts',
      'PostWhereUniqueInput.schema.ts',
    ];

    for (const expectedFile of expectedObjects) {
      expect(objectFiles).toContain(expectedFile);
    }
  });

  it('should generate index files', async () => {
    const schemasDir = path.join(outputPath, 'schemas');
    const enumsDir = path.join(outputPath, 'schemas', 'enums');
    const objectsDir = path.join(outputPath, 'schemas', 'objects');

    // Check for index files
    expect(await fs.access(path.join(schemasDir, 'index.ts')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(path.join(enumsDir, 'index.ts')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(path.join(objectsDir, 'index.ts')).then(() => true).catch(() => false)).toBe(true);
  });

  it('should generate valid TypeScript content', async () => {
    // Check a create operation file
    const createUserPath = path.join(outputPath, 'schemas', 'createOneUser.schema.ts');
    const createUserContent = await fs.readFile(createUserPath, 'utf8');
    
    expect(createUserContent).toContain("import Joi from 'joi'");
    expect(createUserContent).toContain("from './objects'");
    expect(createUserContent).toContain("export const UserCreateSchema");
    expect(createUserContent).toContain("Joi.object().keys");

    // Check a find operation file
    const findManyUserPath = path.join(outputPath, 'schemas', 'findManyUser.schema.ts');
    const findManyUserContent = await fs.readFile(findManyUserPath, 'utf8');
    
    expect(findManyUserContent).toContain("import Joi from 'joi'");
    expect(findManyUserContent).toContain("from './objects'");
    expect(findManyUserContent).toContain("from './enums'");
    expect(findManyUserContent).toContain("export const UserFindManySchema");
  });

  it('should use grouped directory structure by default', async () => {
    const schemasDir = path.join(outputPath, 'schemas');
    const files = await fs.readdir(schemasDir);
    
    // Should have operation files in main schemas directory
    expect(files.filter(f => f.endsWith('.schema.ts')).length).toBeGreaterThan(10);
    
    // Should have subdirectories for organization
    expect(files).toContain('enums');
    expect(files).toContain('objects');
    expect(files).toContain('index.ts');
  });

  it('should maintain import path compatibility', async () => {
    // Check that imports use relative paths as expected
    const createUserPath = path.join(outputPath, 'schemas', 'createOneUser.schema.ts');
    const createUserContent = await fs.readFile(createUserPath, 'utf8');
    
    // Should use relative imports to maintain compatibility
    expect(createUserContent).toContain("from './objects'");
    
    const findManyUserPath = path.join(outputPath, 'schemas', 'findManyUser.schema.ts');
    const findManyUserContent = await fs.readFile(findManyUserPath, 'utf8');
    
    expect(findManyUserContent).toContain("from './objects'");
    expect(findManyUserContent).toContain("from './enums'");
  });
});