## [2.0.0](https://github.com/omar-dulaimi/prisma-joi-generator/compare/v1.1.0...v2.0.0) (2026-07-28)

### ⚠ BREAKING CHANGES

* **breaking:** the generated schemas changed shape. Object schemas now reference each
other with `Joi.link('#Name')` instead of importing each other, and root schemas are
concatenated onto the new `objectSchemas` registry exported from
`schemas/objects/index.ts`. Regenerate with `npx prisma generate`. If you compose schemas
from the exported `...SchemaObject` key bags directly, concatenate `objectSchemas` onto
them, otherwise Joi throws `AssertError: ... contains link reference ... which is outside
of schema boundaries`. Values nested under a relation filter are now validated where they
were previously accepted unconditionally, so payloads that used to pass may now be
rejected.

Claude-Session: https://claude.ai/code/session_018FDR2Y8LpjgfsdD4FhQVZZ

### 🐛 Bug Fixes

* **breaking:** emit schemas that can be imported, and run on Prisma 7 ([b380b3d](https://github.com/omar-dulaimi/prisma-joi-generator/commit/b380b3d556b9ebd7cc6a6ac20fd43a407549e8ee))
* **ci:** generate before testing, since the suite reads what generate writes ([a52953f](https://github.com/omar-dulaimi/prisma-joi-generator/commit/a52953f3b79427f73e1ac9f5b31d210e8dfea1f3))
* stop dropping Decimal, BigInt, Bytes and enum fields ([2364354](https://github.com/omar-dulaimi/prisma-joi-generator/commit/236435466664abd50296107accc35adacc74f8af))

### 📚 Documentation

* **ci:** describe the workflows that exist and the auth that works ([ea65f44](https://github.com/omar-dulaimi/prisma-joi-generator/commit/ea65f44658f421a805cea84d5a3473b667116c10))

## [1.1.0](https://github.com/omar-dulaimi/prisma-joi-generator/compare/v1.0.0...v1.1.0) (2025-07-26)

### 🚀 Features

* add centralized file type registry system ([d6fb651](https://github.com/omar-dulaimi/prisma-joi-generator/commit/d6fb65174729f2941aa46c431989074f41193a30))
* add comprehensive logging and error handling system ([be8f3eb](https://github.com/omar-dulaimi/prisma-joi-generator/commit/be8f3ebe541399cb7cb57d0a28b32bb717f42f2b))
* implement comprehensive configuration system for file type filtering ([fe1c0b9](https://github.com/omar-dulaimi/prisma-joi-generator/commit/fe1c0b9680c6d069900cd050fb39cc9550fbdffe))
* implement flexible directory organization system ([45e7d6b](https://github.com/omar-dulaimi/prisma-joi-generator/commit/45e7d6b3241be8562019719287953ea8a40a6461))
* integrate file type filtering into core generation engine ([daa0102](https://github.com/omar-dulaimi/prisma-joi-generator/commit/daa01023fa322bada56937ae3342b85a6b739932))

### 🐛 Bug Fixes

* configure semantic-release to publish from package directory ([c20e057](https://github.com/omar-dulaimi/prisma-joi-generator/commit/c20e057c7f89660f669f5b47f56b868044a62c64))
* resolve ESLint errors and improve code quality ([6cbbcd4](https://github.com/omar-dulaimi/prisma-joi-generator/commit/6cbbcd4ac83e050e6dea50cd187fedfdb85d3018))

### 📚 Documentation

* add comprehensive documentation for file type filtering ([343044e](https://github.com/omar-dulaimi/prisma-joi-generator/commit/343044eca87415e6cf825d3be77692ac807b937d))
