<div align="center">
  
  # ⚡ Prisma Joi Generator

  ### 🚀 **Automatically generate Joi schemas from your Prisma schema**

  <p>
    <a href="https://www.npmjs.com/package/prisma-joi-generator">
      <img src="https://img.shields.io/npm/v/prisma-joi-generator/latest.svg?style=for-the-badge&logo=npm&color=blue" alt="Latest Version">
    </a>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/prisma-joi-generator">
      <img src="https://img.shields.io/npm/dt/prisma-joi-generator.svg?style=for-the-badge&logo=npm&color=green" alt="Downloads">
    </a>
    <a href="https://github.com/omar-dulaimi/prisma-joi-generator/actions">
      <img src="https://img.shields.io/github/actions/workflow/status/omar-dulaimi/prisma-joi-generator/ci.yml?style=for-the-badge&logo=github" alt="CI Status">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/npm/l/prisma-joi-generator.svg?style=for-the-badge&color=purple" alt="License">
    </a>
  </p>

  <p>
    <strong>🎯 Zero-config • 🛡️ Type-safe • ⚡ Fast • 🔧 Customizable</strong>
  </p>

</div>

---

<br>

<div align="center">
  <h3>💡 Transform your Prisma schema into powerful validation schemas</h3>
  <p><em>Automatically generates Joi schemas for all Prisma operations with full TypeScript support</em></p>
</div>

<div align="center">
  
  ## 💖 **Support This Project**
  
  <p><em>If this tool accelerates your development, consider supporting its growth</em></p>
  
  <a href="https://github.com/sponsors/omar-dulaimi">
    <img src="https://img.shields.io/badge/💝_Sponsor_on_GitHub-ea4aaa?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Sponsors" height="45">
  </a>
  
  <p><strong>✨ Your sponsorship drives innovation and keeps this project thriving ✨</strong></p>
  
</div>

<div align="center">
  
  ## 🚀 **Latest Stable Release** - Prisma 6 and Prisma 7 Support!
  
  <table>
    <tr>
      <td align="center">
        <img src="https://img.shields.io/badge/🎉_STABLE_RELEASE-green?style=for-the-badge&logo=checkmark" alt="Stable Release">
      </td>
    </tr>
    <tr>
      <td align="center">
        <strong>🎉 Production Ready on Prisma 6 and Prisma 7!</strong>
      </td>
    </tr>
  </table>
  
</div>

### ✨ **Latest Features**

🆙 **Prisma 6 and Prisma 7 Compatibility**:
- **Reads the schema Prisma already parsed**, so it brings no Prisma of its own and cannot
  disagree with your CLI about your schema
- **Any client generator, or none**: `prisma-client`, `prisma-client-js`, or neither
- **Enhanced Type Safety** with improved TypeScript integration
- **Modern Dependencies** updated to latest stable versions

🔧 **Enhanced Development Experience** - Modern tooling and CI/CD pipeline:
- **Vitest Testing** with comprehensive coverage
- **ESLint 9** with latest linting standards  
- **Semantic Release** for automated versioning

### ✨ **Core Features**

<div align="center">
  
  | 🚀 **Feature** | 📦 **Version** | 🎯 **Benefit** |
  |----------------|----------------|------------------|
  | **New Prisma Client** | `6.12.0+` | 🆕 ESM-compatible generator support |
  | **Prisma** | `6.12.0+` and `7.x` | 🏃‍♂️ Latest features & performance |
  | **Joi** | `17.13.3+` | 🛡️ Enhanced validation & type safety |
  | **TypeScript** | `5.8+` | ⚡ Cutting-edge language features |
  | **Testing** | `Vitest 3` | 🧪 Comprehensive coverage |
  | **Tooling** | `ESLint 9` | 🔧 Modern dev experience |
  | **Multi-DB** | `All Providers` | 🗄️ PostgreSQL, MySQL, MongoDB, SQLite+ |
  
</div>

<div align="center">
  
  ### 📦 **Installation**
  
</div>

```bash
# 🚀 Install the latest release
npm install prisma-joi-generator
```

### 🔄 Upgrading

Requirements:
- **Node.js 18+** 
- **Prisma 6.12.0+, including Prisma 7** 
- **Joi 17.13.3+** 

Update your dependencies and re-run `npx prisma generate`. Coming from 1.1.0 or earlier, read
[how the generated schemas reference each other](#how-the-generated-schemas-reference-each-other)
first: the emitted output changed shape, because the shape it had could not be imported from an
ES module.

```bash
npm update prisma-joi-generator
npx prisma generate
```

<div align="center">
  
  ## 📚 **Navigation**
  
  <table>
    <tr>
      <td><a href="#-features">✨ Features</a></td>
      <td><a href="#-quick-start">🚀 Quick Start</a></td>
      <td><a href="#-generated-output">📋 Output</a></td>
      <td><a href="#️-configuration-options">⚙️ Config</a></td>
    </tr>
    <tr>
      <td><a href="#-advanced-usage">🔧 Advanced</a></td>
      <td><a href="#-examples">📚 Examples</a></td>
      <td><a href="#-troubleshooting">🔍 Troubleshooting</a></td>
      <td><a href="#-contributing">🤝 Contributing</a></td>
    </tr>
  </table>
  
</div>

<div align="center">
  
  ## ✨ **Why Choose Prisma Joi Generator?**
  
</div>

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/🚀-Zero_Config-blue?style=for-the-badge" alt="Zero Config">
      <br><strong>Works instantly</strong><br><em>Sensible defaults included</em>
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/🔄-Auto_Generated-green?style=for-the-badge" alt="Auto Generated">
      <br><strong>Always in sync</strong><br><em>Updates with schema changes</em>
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/🛡️-Type_Safe-purple?style=for-the-badge" alt="Type Safe">
      <br><strong>100% TypeScript</strong><br><em>Catch errors at compile time</em>
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/🎯-Comprehensive-orange?style=for-the-badge" alt="Comprehensive">
      <br><strong>Full CRUD coverage</strong><br><em>All Prisma operations included</em>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/badge/⚙️-Configurable-red?style=for-the-badge" alt="Configurable">
      <br><strong>Highly customizable</strong><br><em>Adapt to your needs</em>
    </td>
    <td align="center">
      <img src="https://img.shields.io/badge/📦-Lightweight-yellow?style=for-the-badge" alt="Lightweight">
      <br><strong>Minimal footprint</strong><br><em>Fast generation & runtime</em>
    </td>
    <td align="center">
      <img src="https://img.shields.io/badge/🗄️-Multi_DB-cyan?style=for-the-badge" alt="Multi Database">
      <br><strong>All databases</strong><br><em>PostgreSQL, MySQL, MongoDB+</em>
    </td>
    <td align="center">
      <img src="https://img.shields.io/badge/🎨-Flexible-pink?style=for-the-badge" alt="Flexible">
      <br><strong>Your way</strong><br><em>Custom paths & options</em>
    </td>
  </tr>
</table>

## 🚀 Quick Start

### Installation

```bash
# NPM
npm install prisma-joi-generator

# Yarn
yarn add prisma-joi-generator

# PNPM  
pnpm add prisma-joi-generator
```

### Setup

1. **Star this repo** 😉

2. **Add the generator to your Prisma schema.**

`prisma generate` refuses to run on a schema with no `datasource` block, so here is a
complete one that works as written. No client generator is required: add one if you want a
Prisma Client, leave it out if you only want Joi schemas.

**Prisma 7** removed `url` from the datasource block. The connection URL goes in
`prisma.config.ts` instead:

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./generated/schemas"
}

datasource db {
  provider = "sqlite"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

**Prisma 6 and below** keep the `url` on the datasource:

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./generated/schemas"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

3. **Generate your Joi schemas:**

```bash
npx prisma generate
```

## 🆕 Prisma Client Generator Support

This generator reads the schema Prisma has already parsed, so it works next to any client
generator, or next to none at all. It never imports or extends the Prisma Client.

### Generator Compatibility

Any of these work:

#### Legacy Generator (Existing Projects)
```prisma
generator client {
  provider = "prisma-client-js"
}

generator joi {
  provider = "prisma-joi-generator"
  output   = "./generated/schemas"
}
```

#### New ESM-Compatible Generator (Prisma 6.12.0+)
```prisma
generator client {
  provider = "prisma-client"
  output = "./src/generated/client"
  runtime = "nodejs"
  moduleFormat = "esm"
  generatedFileExtension = "ts"
  importFileExtension = "ts"
}

generator joi {
  provider = "prisma-joi-generator"
  output   = "./generated/schemas"
}
```

#### No Client Generator

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./generated/schemas"
}
```

### Key Benefits of the New Generator

- **🔗 ESM Compatibility** - Full ES Module support
- **📂 Custom Output Location** - Generate client outside `node_modules`
- **🔧 Runtime Flexibility** - Support for Bun, Deno, Cloudflare Workers
- **⚡ Better Performance** - Optimized code generation
- **🔮 Future-Ready** - The default in Prisma 7

### Migration Guide

**Existing Projects**: No changes needed - continue using `prisma-client-js`

**New Projects**: Consider using the new `prisma-client` generator for modern features

**Gradual Migration**: Both generators are supported simultaneously during the transition

> **Prisma 7 needs a release newer than 1.1.0.** Up to and including 1.1.0 this package
> declared `@prisma/internals` as a dependency and re-parsed your schema with the copy of
> Prisma 6 that came with it. On a Prisma 7 schema that parse fails with
> `P1012: Argument "url" is missing in data source block`, reported under a
> `Prisma CLI Version : 6.19.3` banner from a project that has no Prisma 6 in it, and adding
> the `url` back to satisfy it makes Prisma 7 itself reject the schema. There was no schema
> that both parsers accepted. Newer releases use the DMMF Prisma hands to every generator and
> carry no Prisma of their own.

## 📋 Generated Output

For the following schema:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String
  content   String?
  published Boolean  @default(false)
  viewCount Int      @default(0)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
  likes     BigInt
}
```

The generator creates different directory structures based on your configuration:

#### Grouped Structure (Default)
```
📁 generated/schemas/
├── 📁 enums/           // Enum validation schemas
│   ├── 📄 PostScalarFieldEnum.schema.ts
│   └── 📄 UserScalarFieldEnum.schema.ts
├── 📁 objects/         // Input type schemas  
│   ├── 📄 UserCreateInput.schema.ts
│   ├── 📄 UserWhereInput.schema.ts
│   └── 📄 PostCreateInput.schema.ts
├── 📄 findManyUser.schema.ts
├── 📄 findUniqueUser.schema.ts
├── 📄 createOneUser.schema.ts
├── 📄 updateOneUser.schema.ts
├── 📄 deleteOneUser.schema.ts
├── 📄 findManyPost.schema.ts
├── 📄 createOnePost.schema.ts
└── 📄 index.ts         // Barrel exports
```

#### By-Model Structure
```
📁 generated/schemas/
├── 📁 enums/           // Shared enums
├── 📁 models/
│   ├── 📁 user/
│   │   ├── 📄 findManyUser.schema.ts
│   │   ├── 📄 createOneUser.schema.ts
│   │   ├── 📁 objects/
│   │   │   ├── 📄 UserCreateInput.schema.ts
│   │   │   └── 📄 UserWhereInput.schema.ts
│   │   └── 📄 index.ts
│   └── 📁 post/
│       ├── 📄 findManyPost.schema.ts
│       ├── 📄 createOnePost.schema.ts
│       ├── 📁 objects/
│       └── 📄 index.ts
└── 📄 index.ts
```

#### Flat Structure
```
📁 generated/schemas/
├── 📄 findManyUser.schema.ts
├── 📄 createOneUser.schema.ts
├── 📄 UserCreateInput.schema.ts
├── 📄 UserWhereInput.schema.ts
├── 📄 PostScalarFieldEnum.schema.ts
├── 📄 findManyPost.schema.ts
├── 📄 createOnePost.schema.ts
└── 📄 index.ts
```

### How the Generated Schemas Reference Each Other

Prisma's input types are cyclic: `UserWhereInput` reaches `PostListRelationFilter`, which
reaches `PostWhereInput`, which reaches back to `UserWhereInput`. TypeScript modules cannot
express that by importing each other, so the emitted object schemas do not. Each one refers to
the others with `Joi.link('#TypeName')`, and `schemas/objects/index.ts` exports an
`objectSchemas` registry that every link resolves against.

The generated root schemas already carry it, so most of the time this is invisible:

```ts
import { UserFindManySchema } from './generated/schemas';

// emitted as: objectSchemas.concat(Joi.object().keys({ ... }))
UserFindManySchema.validate({ where: { posts: { some: { title: { equals: 'hello' } } } } });
```

If you compose a schema out of the exported `...SchemaObject` key bags yourself, concatenate
the registry onto it, otherwise Joi has nowhere to resolve the links and throws
`AssertError: ... contains link reference ... which is outside of schema boundaries`:

```ts
import Joi from 'joi';
import { objectSchemas, UserWhereInputSchemaObject } from './generated/schemas/objects';

const myFilter = objectSchemas.concat(Joi.object().keys(UserWhereInputSchemaObject));
```

> **Upgrading from 1.1.0 or earlier.** Before this, object schemas embedded each other directly.
> That output could not be imported from an ES module at all, failing with
> `ReferenceError: Cannot access 'UserWhereInputSchemaObject' before initialization`, and when
> compiled to CommonJS every reference across a cycle silently resolved to `undefined`, so each
> relation filter accepted absolutely anything. If you were relying on that, values nested
> under a relation filter are now validated, and a self-referential `where.AND` no longer
> throws.

### Version Compatibility

| Version | Prisma | Joi | TypeScript | Node.js | Status |
|---------|--------|-----|------------|---------|--------|
| **Latest** | 6.12.0+ and 7.x | 17.13.3+ | 5.8+ | 18+ | ✅ **Stable** - verified against Prisma 6.19 and 7.9 on Node 22 and 24 |
| **1.1.0 and earlier** | 6.12.0 - 6.x | 17.13.3+ | 5.8+ | 18+ | ⛔ **Prisma 6 only** - fails on Prisma 7, see the note above |
| **Legacy** | 4.0.0+ | 17.0+ | 4.7+ | 16+ | 📦 **Deprecated** - Limited Support |

> **Recommendation**: Use `npm install prisma-joi-generator` for the latest stable release with full features and modern tooling.

## ⚙️ Configuration Options

The Prisma Joi Generator offers powerful configuration options to customize file generation, organization, and filtering according to your project needs.

### Core Configuration

| Option | Description | Type | Default |
|--------|-------------|------|---------|
| `output` | Output directory for generated files | `string` | `"./generated"` |

### 🔧 File Type Filtering

Control which types of validation schemas are generated:

| File Type | Description | Default |
|-----------|-------------|---------|
| `create` | Create operation schemas (createOne, createMany) | `true` |
| `update` | Update operation schemas (updateOne, updateMany) | `true` |
| `upsert` | Upsert operation schemas | `true` |
| `find` | Find operation schemas (findUnique, findFirst, findMany) | `true` |
| `delete` | Delete operation schemas (deleteOne, deleteMany) | `true` |
| `aggregate` | Aggregate operation schemas | `true` |
| `groupBy` | GroupBy operation schemas | `true` |
| `objects` | Input object schemas (WhereInput, CreateInput, etc.) | `true` |
| `enums` | Enum validation schemas | `true` |
| `filter` | Filter and where input schemas | `true` |
| `orderBy` | OrderBy input schemas | `true` |
| `unchecked` | Unchecked input schemas (without relations) | `true` |

### 📁 Directory Organization

Configure how generated files are organized:

| Strategy | Description | Structure |
|----------|-------------|-----------|
| `grouped` | Organize by file type (default) | `schemas/`, `schemas/objects/`, `schemas/enums/` |
| `flat` | All files in single directory | `schemas/` |
| `by-model` | Organize by model name | `schemas/models/User/`, `schemas/models/Post/` |

### Basic Configuration Examples

#### Minimal Setup
```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./src/schemas"
}
```

#### Custom File Types
```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./generated/validation"
  
  // Only generate create and find operations
  create = "true"
  find = "true"
  update = "false"
  delete = "false"
  objects = "true"
  enums = "true"
}
```

#### Flat Directory Structure
```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./schemas"
  directoryStrategy = "flat"
}
```

### 🎯 Common Use Cases

#### REST API - Minimal Set
Perfect for REST APIs that only need create and read operations:

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./src/validation/schemas"
  
  // Only essential operations
  create = "true"
  find = "true"
  update = "false"
  delete = "false"
  upsert = "false"
  aggregate = "false"
  groupBy = "false"
  
  // Required supporting schemas
  objects = "true"
  enums = "true"
}
```

#### Full Feature API
Complete validation for complex applications:

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./schemas"
  directoryStrategy = "by-model"
  
  // All operations enabled (default behavior)
  create = "true"
  update = "true"
  upsert = "true"
  find = "true"
  delete = "true"
  aggregate = "true"
  groupBy = "true"
  objects = "true"
  enums = "true"
  filter = "true"
  orderBy = "true"
  unchecked = "true"
}
```

#### Read-Only API
For analytics dashboards or reporting systems:

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./generated/read-schemas"
  
  // Only read operations
  create = "false"
  update = "false"
  delete = "false"
  upsert = "false"
  find = "true"
  aggregate = "true"
  groupBy = "true"
  
  // Supporting schemas for filtering and sorting
  objects = "true"
  enums = "true"
  filter = "true"
  orderBy = "true"
}
```

#### GraphQL Integration
Optimized for GraphQL resolvers with custom directory structure:

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./src/graphql/validation"
  directoryStrategy = "grouped"
  
  // GraphQL typically needs input validation
  create = "true"
  update = "true"
  find = "true"
  delete = "true"
  objects = "true"
  enums = "true"
  filter = "true"
  
  // GraphQL handles its own aggregation
  aggregate = "false"
  groupBy = "false"
}
```

### 📋 Advanced Configuration Reference

#### Filter Strategy Options

```prisma
generator joi {
  provider = "prisma-joi-generator"
  
  // Strategy 1: Selective (default) - Use individual flags
  create = "true"
  find = "false"
  
  // Strategy 2: Whitelist - Only generate specified types
  filterStrategy = "whitelist"
  includeTypes = "create,find,objects,enums"
  
  // Strategy 3: Blacklist - Generate all except specified
  filterStrategy = "blacklist"
  excludeTypes = "aggregate,groupBy,unchecked"
}
```

#### Directory Customization

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./validation"
  
  // Directory structure
  directoryStrategy = "grouped"
  
  // Custom directory names
  baseDirectory = "schemas"
  objectsDirectory = "inputs"
  enumsDirectory = "constants"
  modelsDirectory = "entities"
}
```

#### File Naming Patterns

```prisma
generator joi {
  provider = "prisma-joi-generator"
  
  // Customize file naming patterns
  schemaFilePattern = "{operation}.validation"
  objectFilePattern = "{name}.input"
  enumFilePattern = "{name}.enum"
}
```

### 🔄 Migration Guide

#### Upgrading from Basic to Filtered Generation

**Before (v0.1.x):**
```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./schemas"
}
```

**After (v0.2.x+):**
```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./schemas"
  
  // Explicitly enable only needed types for better performance
  create = "true"
  find = "true"
  update = "true"
  delete = "false"    // Skip if not needed
  aggregate = "false" // Skip if not needed
  
  objects = "true"
  enums = "true"
}
```

#### Benefits of Migration:
- 🚀 **Faster generation** - Only creates needed schemas
- 📦 **Smaller bundle size** - Fewer files to import
- 🎯 **Better organization** - Clear intent in configuration
- 🛡️ **Type safety** - Prevents accidental usage of disabled operations

## 🔧 Advanced Usage

### Model Customizations

Hide specific models from generation:

```prisma
/// @@Gen.model(hide: true)
model InternalLog {
  id        Int      @id @default(autoincrement())
  message   String
  createdAt DateTime @default(now())
}
```

### Database Provider Support

The generator supports all Prisma database providers:

- **PostgreSQL** - Complete support including advanced types
- **MySQL** - Full compatibility with all MySQL features  
- **MongoDB** - Native MongoDB schema generation
- **SQLite** - Perfect for development and testing
- **SQL Server** - Enterprise-grade support
- **CockroachDB** - Distributed database support

## 📚 Examples

### Express.js API Validation

```typescript
import express from 'express';
import { PostCreateOneSchema, UserFindManySchema } from './generated/schemas';

const app = express();

// Create post with validation
app.post('/posts', async (req, res) => {
  try {
    const { error, value } = PostCreateOneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ errors: error.details });
    }
    const post = await prisma.post.create(value);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query with validation
app.get('/users', async (req, res) => {
  const { error, value } = UserFindManySchema.validate(req.query);
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  const users = await prisma.user.findMany(value);
  res.json(users);
});
```

### Next.js API Routes

```typescript
// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { UserCreateOneSchema } from '../../generated/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { error, value } = UserCreateOneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    try {
      const user = await prisma.user.create(value);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### Fastify Integration

```typescript
import Fastify from 'fastify';
import { PostCreateOneSchema, PostFindManySchema } from './generated/schemas';

const fastify = Fastify();

fastify.post('/posts', {
  preHandler: async (request, reply) => {
    const { error } = PostCreateOneSchema.validate(request.body);
    if (error) {
      reply.code(400).send({ error: error.message });
      return;
    }
  }
}, async (request, reply) => {
  const post = await prisma.post.create({ data: request.body });
  return post;
});
```

## 🔧 API Reference

### Generated Schema Types

The generator creates the following types of schemas:

#### Operation Schemas
- **Create Operations**: `ModelCreateOneSchema`, `ModelCreateManySchema`
- **Read Operations**: `ModelFindManySchema`, `ModelFindUniqueSchema`, `ModelFindFirstSchema`
- **Update Operations**: `ModelUpdateOneSchema`, `ModelUpdateManySchema`, `ModelUpsertSchema`
- **Delete Operations**: `ModelDeleteOneSchema`, `ModelDeleteManySchema`
- **Aggregate Operations**: `ModelAggregateSchema`, `ModelGroupBySchema`

#### Input Object Schemas
- **Create Inputs**: `ModelCreateInputObjectSchema`, `ModelCreateNestedInputObjectSchema`
- **Update Inputs**: `ModelUpdateInputObjectSchema`, `ModelUpdateNestedInputObjectSchema`
- **Where Inputs**: `ModelWhereInputObjectSchema`, `ModelWhereUniqueInputObjectSchema`
- **Order Inputs**: `ModelOrderByInputObjectSchema`

### Schema Naming Convention

All generated schemas follow a consistent naming pattern:
```
{ModelName}{Operation}{Type}Schema
```

Examples:
- `UserCreateOneSchema` - Schema for creating a single user
- `PostFindManyArgsSchema` - Schema for finding multiple posts with arguments
- `UserWhereInputObjectSchema` - Schema for user where conditions

## 🔍 Troubleshooting

### Latest Version Information

**Prisma Compatibility**
- Works on Prisma 6.12.0+ and Prisma 7
- Works next to `prisma-client-js`, next to `prisma-client`, or with no client generator
- Brings no Prisma of its own, so it cannot disagree with the CLI about your schema

**Current Requirements**
- Requires Node.js 18+
- Requires Prisma 6.12.0+ and Joi 17.13.3+
- All peer dependencies must be compatible

**Upgrading to Latest Version**
- Backup your project before upgrading
- Update all related dependencies (Prisma, Joi, TypeScript)
- Re-run `npx prisma generate` after upgrading
- Test thoroughly in development environment

### Common Issues

**Generator compatibility errors**
- No client generator is required. `prisma-client-js`, `prisma-client` and a schema with
  neither all work
- Your schema does need a `datasource` block, because `prisma generate` will not run without one

**Error: Cannot find module './generated/schemas'**
- Ensure you've run `npx prisma generate` after adding the generator
- Check that your output path is correct

**TypeScript errors in generated schemas**
- Make sure all dependencies are installed and up to date
- Ensure your TypeScript version is 5.8 or higher
- Verify all Prisma packages are on the same version

**Generated schemas not updating**
- Run `npx prisma generate` after modifying your schema
- Check that the generator is properly configured in `schema.prisma`
- Clear your build cache and regenerate

**Joi validation errors**
- Ensure you have Joi 17.13.3+ installed for compatibility
- Check that your input schemas match your Prisma model types
- Review Joi documentation for proper validation syntax

**Generator fails to run**
- Ensure you have the correct version installed
- Check that your `schema.prisma` syntax is valid
- Verify Node.js version compatibility (18+)
- Clear node_modules and reinstall dependencies

### 🔧 Configuration Issues

**No files generated with selective filtering**
- Ensure at least one file type is enabled (e.g., `create = "true"`)
- Check that `objects = "true"` and `enums = "true"` are enabled for supporting schemas
- Verify your configuration syntax uses string values (`"true"` not `true`)

**Missing operation schemas (createOne, findMany, etc.)**
- Confirm the operation type is enabled in configuration (e.g., `create = "true"` for createOne schemas)
- Check that required dependencies are enabled (`objects` and `enums`)
- Ensure your models define the operations you're trying to generate

**Directory structure not as expected**
- Verify `directoryStrategy` is set correctly (`"grouped"`, `"flat"`, or `"by-model"`)
- Check custom directory names if using directory customization
- Ensure output path exists and has write permissions

**Configuration parsing errors**
- Use string values for boolean flags: `create = "true"` not `create = true`
- Use comma-separated lists for arrays: `includeTypes = "create,find,objects"`
- Check that all configuration keys are spelled correctly

**Filter strategy not working**
```prisma
// ❌ Wrong: Mixed strategies
generator joi {
  provider = "prisma-joi-generator"
  filterStrategy = "whitelist"
  create = "true"  // Don't mix individual flags with strategies
}

// ✅ Correct: Consistent strategy
generator joi {
  provider = "prisma-joi-generator"
  filterStrategy = "whitelist"
  includeTypes = "create,find,objects,enums"
}
```

**Performance issues with large schemas**
- Enable only needed file types to reduce generation time
- Use `directoryStrategy = "flat"` for smaller projects
- Consider splitting large schemas into multiple generators

**TypeScript import errors with filtered schemas**
- Regenerate schemas after changing configuration
- Update your imports to match the generated file structure
- Check that index files are generated (`generateIndex = "true"`)

### 📊 Configuration Validation

To debug configuration issues, you can temporarily enable all types and gradually disable:

```prisma
generator joi {
  provider = "prisma-joi-generator"
  output   = "./debug-schemas"
  
  // Enable everything first
  create = "true"
  update = "true"
  find = "true"
  delete = "true"
  objects = "true"
  enums = "true"
  
  // Then gradually disable what you don't need
  // aggregate = "false"
  // groupBy = "false"
}
```

### Getting Help

- 🐛 **Bug Reports**: [Create a bug report](https://github.com/omar-dulaimi/prisma-joi-generator/issues/new)
- 💡 **Feature Requests**: [Request a feature](https://github.com/omar-dulaimi/prisma-joi-generator/issues/new)
- 💬 **Discussions**: [Join the discussion](https://github.com/omar-dulaimi/prisma-joi-generator/discussions)

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Development Setup

1. **Fork and clone the repository**
```bash
git clone https://github.com/your-username/prisma-joi-generator.git
cd prisma-joi-generator
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development build**
```bash
npm run gen-example
```

4. **Run tests**
```bash
npm test
```

### Testing

We have comprehensive tests covering:
- **Unit Tests**: Core transformation logic
- **Integration Tests**: End-to-end schema generation
- **Multi-Provider Tests**: All database providers
- **Performance Tests**: Large schema handling

Run specific test suites:
```bash
npx vitest run               // Every test file, which is what CI runs
npm run test:basic           // Basic functionality
npm run test:coverage        // Coverage reports
```

The test suite imports this repo's `src/`, so it cannot tell you whether the package it
produces works. Two more checks cover that gap, and CI runs both:

```bash
npm run gen-example          // Build, then generate from the example schema
npm run check:emitted        // Run the emitted schemas under Node's own loader
npm run package              // Assemble the directory that gets published
```

### Contribution Guidelines

1. **Create an issue** for bugs or feature requests
2. **Follow the existing code style** (ESLint + Prettier)
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** with a clear description

### Code Style

We use ESLint and Prettier for consistent code formatting:
```bash
npm run lint      // Check and fix linting issues
npm run format    // Format code with Prettier
```

### Release Process

This project uses semantic versioning and automated releases:
- **Patch**: Bug fixes and small improvements
- **Minor**: New features and enhancements  
- **Major**: Breaking changes

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🔗 Related Projects

- [prisma-zod-generator](https://github.com/omar-dulaimi/prisma-zod-generator) - Generate Zod schemas from Prisma schema
- [prisma-trpc-generator](https://github.com/omar-dulaimi/prisma-trpc-generator) - Generate tRPC routers from Prisma schema
- [Prisma](https://github.com/prisma/prisma) - Database toolkit and ORM
- [Joi](https://joi.dev/) - The most powerful schema description language and data validator for JavaScript

## 🙏 Acknowledgments

- [Prisma](https://github.com/prisma/prisma) - Modern database toolkit
- [Joi](https://joi.dev/) - Powerful schema validation for JavaScript
- All our [contributors](https://github.com/omar-dulaimi/prisma-joi-generator/graphs/contributors)

---

<br>

---

<div align="center">
  
  <h3>🌟 **Show Your Support** 🌟</h3>
  
  <a href="https://github.com/omar-dulaimi/prisma-joi-generator">
    <img src="https://img.shields.io/github/stars/omar-dulaimi/prisma-joi-generator?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars">
  </a>
  
  <br><br>
  
  <table>
    <tr>
      <td align="center">
        <img src="https://img.shields.io/badge/💎-Latest_Stable-success?style=for-the-badge&logo=npm" alt="Stable">
        <br>
        <code>v1.0.0</code>
      </td>
      <td align="center">
        <img src="https://img.shields.io/badge/📦-Legacy_Version-lightgrey?style=for-the-badge&logo=archive" alt="Legacy">
        <br>
        <code>v0.2.0</code>
      </td>
    </tr>
  </table>
  
  <br>
  
  <p>
    <strong>Made with ❤️ by</strong>
    <a href="https://github.com/omar-dulaimi">
      <img src="https://img.shields.io/badge/Omar_Dulaimi-100000?style=for-the-badge&logo=github&logoColor=white" alt="Omar Dulaimi">
    </a>
  </p>
  
  <p><em>⚡ Accelerating Prisma development, one schema at a time</em></p>
  
</div>