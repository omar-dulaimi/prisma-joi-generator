# Prisma Joi Generator

[![npm version](https://badge.fury.io/js/prisma-joi-generator.svg)](https://badge.fury.io/js/prisma-joi-generator)
[![npm](https://img.shields.io/npm/dt/prisma-joi-generator.svg)](https://www.npmjs.com/package/prisma-joi-generator)
[![HitCount](https://hits.dwyl.com/omar-dulaimi/prisma-joi-generator.svg?style=flat)](http://hits.dwyl.com/omar-dulaimi/prisma-joi-generator)
[![npm](https://img.shields.io/npm/l/prisma-joi-generator.svg)](LICENSE)

Automatically generate [Joi](https://joi.dev/api) schemas from your [Prisma](https://github.com/prisma/prisma) Schema, and use them to validate your API endpoints or any other use you have. Updates every time `npx prisma generate` runs.

<p align="center">
  <a href="https://www.buymeacoffee.com/omardulaimi">
    <img src="https://cdn.buymeacoffee.com/buttons/default-black.png" alt="Buy Me A Coffee" height="41" width="174">
  </a>
</p>

## Table of Contents

- [Supported Prisma Versions](#supported-prisma-versions)
- [Installation](#installing)
- [Usage](#usage)
- [Additional Options](#additional-options)

# Supported Prisma Versions

### Prisma 4

- 0.2.0 and higher

### Prisma 2/3

- 0.1.1 and lower

## Installation

Using npm:

```bash
 npm install prisma-joi-generator
```

Using yarn:

```bash
 yarn add prisma-joi-generator
```

# Usage

1- Star this repo 😉

2- Add the generator to your Prisma schema

```prisma
generator joi {
  provider = "prisma-joi-generator"
}
```

3- Running `npx prisma generate` for the following schema.prisma

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
}
```

will generate the following files

![Joi Schemas](https://raw.githubusercontent.com/omar-dulaimi/prisma-joi-generator/master/joiSchemas.png)

4- Use generated schemas somewhere in your API logic, like middleware or decorator

```ts
import { PostCreateSchema } from './prisma/generated/schemas';

app.post('/blog', async (req, res, next) => {
  const { body } = req;
  const result = PostCreateSchema.validate(body);
});
```

## Additional Options

| Option   |  Description                                   | Type     |  Default      |
| -------- | ---------------------------------------------- | -------- | ------------- |
| `output` | Output directory for the generated joi schemas | `string` | `./generated` |

Use additional options in the `schema.prisma`

```prisma
generator joi {
  provider   = "prisma-joi-generator"
  output     = "./generated-joi-schemas"
}
```
