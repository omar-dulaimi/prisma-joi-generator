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
(0, vitest_1.describe)('Basic Joi Generator Functionality', () => {
    (0, vitest_1.describe)('Core Schema Generation', () => {
        (0, vitest_1.it)('should import joi package correctly', () => {
            (0, vitest_1.expect)(joi_1.default).toBeDefined();
            (0, vitest_1.expect)(typeof joi_1.default.object).toBe('function');
            (0, vitest_1.expect)(typeof joi_1.default.string).toBe('function');
            (0, vitest_1.expect)(typeof joi_1.default.number).toBe('function');
        });
        (0, vitest_1.it)('should generate schemas with proper file structure', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            // Check that the generated directory exists
            const generatedDir = path.join(process.cwd(), 'prisma', 'generated', 'schemas');
            (0, vitest_1.expect)(await fs.access(generatedDir).then(() => true).catch(() => false)).toBe(true);
            // Check that basic schema files exist
            const createUserFile = path.join(generatedDir, 'createOneUser.schema.ts');
            const createPostFile = path.join(generatedDir, 'createOnePost.schema.ts');
            const indexFile = path.join(generatedDir, 'index.ts');
            (0, vitest_1.expect)(await fs.access(createUserFile).then(() => true).catch(() => false)).toBe(true);
            (0, vitest_1.expect)(await fs.access(createPostFile).then(() => true).catch(() => false)).toBe(true);
            (0, vitest_1.expect)(await fs.access(indexFile).then(() => true).catch(() => false)).toBe(true);
        });
        (0, vitest_1.it)('should generate valid typescript files', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const createUserFile = path.join(process.cwd(), 'prisma', 'generated', 'schemas', 'createOneUser.schema.ts');
            const content = await fs.readFile(createUserFile, 'utf-8');
            // Check that the file contains expected Joi imports and exports
            (0, vitest_1.expect)(content).toContain('import Joi from \'joi\'');
            (0, vitest_1.expect)(content).toContain('export const UserCreateSchema');
            (0, vitest_1.expect)(content).toContain('Joi.object()');
        });
        (0, vitest_1.it)('should generate enum schemas', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const enumsDir = path.join(process.cwd(), 'prisma', 'generated', 'schemas', 'enums');
            (0, vitest_1.expect)(await fs.access(enumsDir).then(() => true).catch(() => false)).toBe(true);
            // Check for specific enum files
            const sortOrderFile = path.join(enumsDir, 'SortOrder.schema.ts');
            (0, vitest_1.expect)(await fs.access(sortOrderFile).then(() => true).catch(() => false)).toBe(true);
            const sortOrderContent = await fs.readFile(sortOrderFile, 'utf-8');
            (0, vitest_1.expect)(sortOrderContent).toContain('import Joi from \'joi\'');
            (0, vitest_1.expect)(sortOrderContent).toContain('export const SortOrderSchema');
        });
        (0, vitest_1.it)('should generate object schemas', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const objectsDir = path.join(process.cwd(), 'prisma', 'generated', 'schemas', 'objects');
            (0, vitest_1.expect)(await fs.access(objectsDir).then(() => true).catch(() => false)).toBe(true);
            // Check for specific object files
            const userCreateFile = path.join(objectsDir, 'UserCreateInput.schema.ts');
            (0, vitest_1.expect)(await fs.access(userCreateFile).then(() => true).catch(() => false)).toBe(true);
            const userCreateContent = await fs.readFile(userCreateFile, 'utf-8');
            (0, vitest_1.expect)(userCreateContent).toContain('import Joi from \'joi\'');
            (0, vitest_1.expect)(userCreateContent).toContain('export const UserCreateInputSchemaObject');
        });
    });
    (0, vitest_1.describe)('Direct Joi Schema Testing', () => {
        (0, vitest_1.it)('should create simple joi validation schema', () => {
            const schema = joi_1.default.object({
                email: joi_1.default.string().email().required(),
                name: joi_1.default.string().optional(),
            });
            const { error: validError } = schema.validate({
                email: 'test@example.com',
                name: 'Test User'
            });
            (0, vitest_1.expect)(validError).toBeUndefined();
            const { error: invalidError } = schema.validate({
                email: 'invalid-email'
            });
            (0, vitest_1.expect)(invalidError).toBeDefined();
        });
    });
});
//# sourceMappingURL=basic-functionality.test.js.map