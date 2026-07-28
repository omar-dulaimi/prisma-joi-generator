/**
 * Runs the schemas this generator emits, the way a consumer runs them.
 *
 * The vitest suite imports the generator's own `src/`, and where it touches the emitted
 * schemas it does so through Vite's transform, which resolves a circular import to
 * `undefined` instead of failing. Node does not. So the suite stayed green while the
 * published package emitted output that threw on `import` under ESM:
 *
 *   ReferenceError: Cannot access 'UserWhereInputSchemaObject' before initialization
 *
 * and, compiled to CommonJS, silently validated nothing through every relation filter.
 *
 * Usage: tsx scripts/check-emitted-schemas.mts <generated-dir>
 *
 * <generated-dir> is the generator's output directory, the one containing `schemas/`. The
 * module format of the emitted files follows the nearest package.json, so run this both from
 * a CommonJS project and from a `"type": "module"` one: the two fail differently.
 *
 * Expects the User/Post example schema that this repo generates from and that CI generates
 * in its consumer project.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import Joi from 'joi';

const generatedDir = process.argv[2];
if (!generatedDir) {
  console.error('usage: tsx scripts/check-emitted-schemas.mts <generated-dir>');
  process.exit(2);
}

const barrel = pathToFileURL(
  path.resolve(generatedDir, 'schemas', 'index.ts'),
).href;
const objectsBarrel = pathToFileURL(
  path.resolve(generatedDir, 'schemas', 'objects', 'index.ts'),
).href;

const failures: string[] = [];
function fail(what: string, detail: string) {
  failures.push(`${what}\n    ${detail.split('\n').join('\n    ')}`);
}

/**
 * A Joi ValidationError is the schema doing its job. Anything else thrown out of validate()
 * is the emitted output being broken: an unresolvable `Joi.link` throws a bare AssertError,
 * and a reference that read `undefined` throws from inside Joi's internals.
 */
function validate(
  label: string,
  schema: Joi.Schema,
  value: unknown,
): Joi.ValidationError | undefined | 'threw' {
  try {
    return schema.validate(value).error;
  } catch (error) {
    fail(
      `${label} threw instead of returning a validation result`,
      `${(error as Error).constructor.name}: ${(error as Error).message}`,
    );
    return 'threw';
  }
}

function expectAccepted(label: string, schema: Joi.Schema, value: unknown) {
  const error = validate(label, schema, value);
  if (error === 'threw') return;
  if (error) fail(`${label} rejected a valid value`, error.message);
}

function expectRejected(label: string, schema: Joi.Schema, value: unknown) {
  const error = validate(label, schema, value);
  if (error === 'threw') return;
  if (!error) {
    fail(
      `${label} accepted a value it must reject`,
      'the reference it should have applied resolved to nothing, so the schema is unconstrained there',
    );
  }
}

// 1. Importing the emitted schemas must not throw. This is the whole ESM failure: Prisma's
//    input types are cyclic, so an emitted output that imports across the cycle cannot be
//    evaluated by Node at all.
let schemas: Record<string, unknown>;
let objects: Record<string, unknown>;
try {
  schemas = await import(barrel);
  objects = await import(objectsBarrel);
} catch (error) {
  console.error(`FAIL importing ${barrel}`);
  console.error(`  ${(error as Error).constructor.name}: ${(error as Error).message}`);
  process.exit(1);
}

// 2. The shared object registry has to be there and be a schema, because every emitted root
//    schema is concatenated onto it and the `Joi.link` references resolve through it.
if (!Joi.isSchema(objects.objectSchemas)) {
  fail(
    'schemas/objects/index.ts does not export a usable objectSchemas registry',
    `got ${typeof objects.objectSchemas}`,
  );
}

const required = [
  'UserCreateSchema',
  'UserFindFirstSchema',
  'UserFindManySchema',
  'UserUpdateOneSchema',
  'UserDeleteManySchema',
  'PostCreateSchema',
  'PostFindFirstSchema',
  'PostFindManySchema',
  'PostUpdateOneSchema',
  'PostDeleteManySchema',
];
for (const name of required) {
  if (!Joi.isSchema(schemas[name])) {
    fail(`${name} is missing from the emitted barrel`, `got ${typeof schemas[name]}`);
  }
}

// 3. Every emitted schema, run with keys absent and with a plausible payload. An emitted
//    schema that cannot survive `validate({})` is not usable for anything.
let exercised = 0;
for (const [name, exported] of Object.entries(schemas)) {
  if (!Joi.isSchema(exported)) continue;
  exercised++;
  const schema = exported as Joi.Schema;
  validate(`${name}.validate({})`, schema, {});
  validate(`${name}.validate(payload)`, schema, {
    data: { title: 'a title', email: 'a@b.c' },
    where: { id: 1 },
    take: 1,
  });
}
if (exercised === 0) fail('the emitted barrel exported no schemas at all', barrel);

// 4. The cases the README leads with.
const s = schemas as Record<string, Joi.Schema>;
expectAccepted('UserCreateSchema', s.UserCreateSchema, {
  data: { email: 'a@b.c', name: 'A' },
});
expectAccepted('PostCreateSchema', s.PostCreateSchema, {
  data: { title: 'a title', author: { connect: { id: 1 } } },
});
expectRejected('PostCreateSchema', s.PostCreateSchema, { data: { content: 'no title' } });

// 5. A self-reference. `UserWhereInput.AND` is a link to `UserWhereInput`, which is exactly
//    the construct that threw `AssertError: contains link reference "ref:local:UserWhereInput"
//    which is outside of schema boundaries` when nothing registered the target.
expectAccepted('UserFindFirstSchema self-reference', s.UserFindFirstSchema, {
  where: { AND: [{ email: { equals: 'a@b.c' } }] },
});

// 6. A reference across the cycle, in both directions. `PostWhereInput.author` is a link to
//    `UserNullableScalarRelationFilter`, whose `is` links back to `UserWhereInput`. This is
//    the pair of assertions that fails when references resolve to `undefined`: the accept
//    still passes, and the reject quietly does not, because an unconstrained object accepts
//    anything you put in it.
expectAccepted('PostFindManySchema through a relation filter', s.PostFindManySchema, {
  where: { author: { is: { id: 1 } } },
});
expectRejected('PostFindManySchema through a relation filter', s.PostFindManySchema, {
  where: { author: { is: { id: 'not a number' } } },
});
expectAccepted('UserFindManySchema through a list relation filter', s.UserFindManySchema, {
  where: { posts: { some: { title: { equals: 'x' } } } },
});
expectRejected('UserFindManySchema through a list relation filter', s.UserFindManySchema, {
  where: { posts: { some: { title: { equals: 42 } } } },
});

if (failures.length > 0) {
  console.error(`FAIL ${failures.length} problem(s) in ${generatedDir}`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `ok ${generatedDir}: imported cleanly and exercised ${exercised} emitted schemas`,
);
