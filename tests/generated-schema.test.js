"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const joi_1 = __importDefault(require("joi"));
(0, vitest_1.describe)('Generated Joi Schemas', () => {
    (0, vitest_1.beforeAll)(async () => {
        // Ensure schemas are generated before running tests
        const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
        try {
            execSync('npm run gen-example', { stdio: 'inherit' });
        }
        catch (error) {
            console.error('Failed to generate schemas:', error);
            throw error;
        }
    });
    (0, vitest_1.describe)('Basic Schema Functionality', () => {
        (0, vitest_1.it)('should generate valid Joi schemas', async () => {
            // Import generated schemas
            const createOneUser = await Promise.resolve().then(() => __importStar(require('../prisma/generated/schemas/createOneUser.schema')));
            const createOnePost = await Promise.resolve().then(() => __importStar(require('../prisma/generated/schemas/createOnePost.schema')));
            (0, vitest_1.expect)(createOneUser.UserCreateSchema).toBeDefined();
            (0, vitest_1.expect)(createOnePost.PostCreateSchema).toBeDefined();
            // Verify they are Joi schemas
            (0, vitest_1.expect)(joi_1.default.isSchema(createOneUser.UserCreateSchema)).toBe(true);
            (0, vitest_1.expect)(joi_1.default.isSchema(createOnePost.PostCreateSchema)).toBe(true);
        });
        (0, vitest_1.it)('should validate user creation data correctly', async () => {
            const { UserCreateSchema } = await Promise.resolve().then(() => __importStar(require('../prisma/generated/schemas/createOneUser.schema')));
            // Valid data
            const validUserData = {
                data: {
                    email: 'test@example.com',
                    name: 'Test User'
                }
            };
            const { error: validError, value: validValue } = UserCreateSchema.validate(validUserData);
            (0, vitest_1.expect)(validError).toBeUndefined();
            (0, vitest_1.expect)(validValue).toEqual(validUserData);
            // Invalid data - missing required email
            const invalidUserData = {
                data: {
                    name: 'Test User'
                }
            };
            const { error: invalidError } = UserCreateSchema.validate(invalidUserData);
            (0, vitest_1.expect)(invalidError).toBeDefined();
        });
        (0, vitest_1.it)('should validate post creation data correctly', async () => {
            const { PostCreateSchema } = await Promise.resolve().then(() => __importStar(require('../prisma/generated/schemas/createOnePost.schema')));
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
            (0, vitest_1.expect)(validError).toBeUndefined();
            (0, vitest_1.expect)(validValue).toEqual(validPostData);
            // Invalid data - missing required title
            const invalidPostData = {
                data: {
                    content: 'This is a test post'
                }
            };
            const { error: invalidError } = PostCreateSchema.validate(invalidPostData);
            (0, vitest_1.expect)(invalidError).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Schema Exports', () => {
        (0, vitest_1.it)('should export all main operation schemas', async () => {
            const schemas = await Promise.resolve().then(() => __importStar(require('../prisma/generated/schemas')));
            // Check that main schemas are exported
            (0, vitest_1.expect)(schemas.UserCreateSchema).toBeDefined();
            (0, vitest_1.expect)(schemas.UserFindManySchema).toBeDefined();
            (0, vitest_1.expect)(schemas.UserUpdateSchema).toBeDefined();
            (0, vitest_1.expect)(schemas.UserDeleteSchema).toBeDefined();
            (0, vitest_1.expect)(schemas.PostCreateSchema).toBeDefined();
            (0, vitest_1.expect)(schemas.PostFindManySchema).toBeDefined();
            (0, vitest_1.expect)(schemas.PostUpdateSchema).toBeDefined();
            (0, vitest_1.expect)(schemas.PostDeleteSchema).toBeDefined();
        });
        (0, vitest_1.it)('should export enum schemas', async () => {
            const enums = await Promise.resolve().then(() => __importStar(require('../prisma/generated/schemas/enums')));
            (0, vitest_1.expect)(enums.SortOrderSchema).toBeDefined();
            (0, vitest_1.expect)(enums.UserScalarFieldEnumSchema).toBeDefined();
            (0, vitest_1.expect)(enums.PostScalarFieldEnumSchema).toBeDefined();
        });
        (0, vitest_1.it)('should export object schemas', async () => {
            const objects = await Promise.resolve().then(() => __importStar(require('../prisma/generated/schemas/objects')));
            (0, vitest_1.expect)(objects.UserCreateInputSchemaObject).toBeDefined();
            (0, vitest_1.expect)(objects.PostCreateInputSchemaObject).toBeDefined();
            (0, vitest_1.expect)(objects.UserWhereInputSchemaObject).toBeDefined();
            (0, vitest_1.expect)(objects.PostWhereInputSchemaObject).toBeDefined();
        });
    });
});
//# sourceMappingURL=generated-schema.test.js.map