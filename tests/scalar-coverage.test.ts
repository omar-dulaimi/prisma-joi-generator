import { execSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * The example schema this project's other tests generate from uses only Int, String, Boolean and
 * DateTime. Every field type outside that set was dropped from the generated input schemas without
 * a word, and the suite could not see it because no fixture had one.
 *
 * The result was wrong in both directions: a valid row was rejected because the field "is not
 * allowed", and a row missing a required field passed.
 */
const SCHEMA = `
generator client {
  provider = "prisma-client-js"
  output   = "./client"
}

generator joi {
  provider = "node ${join(process.cwd(), 'lib', 'generator.js')}"
  output   = "./generated"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Tier {
  free
  pro
}

model Account {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  balance   Decimal
  views     BigInt
  avatar    Bytes
  meta      Json
  tier      Tier     @default(free)
  active    Boolean  @default(true)
  score     Float
  createdAt DateTime @default(now())
}
`;

let dir: string;
let createInput: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'joi-scalars-'));
  writeFileSync(join(dir, 'schema.prisma'), SCHEMA);
  writeFileSync(
    join(dir, 'prisma.config.ts'),
    `import { defineConfig } from 'prisma/config';\nexport default defineConfig({ schema: './schema.prisma' });\n`,
  );

  // The temp project needs the repo's dependencies to resolve `prisma/config` and the generator.
  symlinkSync(join(process.cwd(), 'node_modules'), join(dir, 'node_modules'), 'dir');

  execSync(`npx prisma generate --schema ${join(dir, 'schema.prisma')}`, {
    cwd: dir,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: 'postgresql://u:p@localhost:5432/d' },
  });

  createInput = readFileSync(
    join(dir, 'generated', 'schemas', 'objects', 'AccountCreateInput.schema.ts'),
    'utf-8',
  );
}, 180_000);

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('every scalar type reaches the generated input schema', () => {
  it.each([
    ['String', 'email'],
    ['Decimal', 'balance'],
    ['BigInt', 'views'],
    ['Bytes', 'avatar'],
    ['Json', 'meta'],
    ['Float', 'score'],
    ['Boolean', 'active'],
    ['DateTime', 'createdAt'],
  ])('includes the %s field', (_type, field) => {
    expect(createInput).toMatch(new RegExp(`\\b${field}:`));
  });

  /** A user-defined enum arrives as namespace 'model', which the type check did not accept. */
  it('includes an enum field, whose namespace is model rather than prisma', () => {
    expect(createInput).toMatch(/\btier:/);
    expect(createInput).toMatch(/TierSchema/);
  });

  it('marks a field with no default as required', () => {
    expect(createInput).toMatch(/balance:.*required\(\)/);
  });

  it('accepts a Decimal as a string, since one too large for a JS number arrives as one', () => {
    expect(createInput).toMatch(/balance:.*Joi\.string\(\)/);
  });

  it('maps Bytes to binary rather than dropping or stringifying it', () => {
    expect(createInput).toMatch(/avatar:.*Joi\.binary\(\)/);
  });
});
