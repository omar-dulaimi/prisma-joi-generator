import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import path from 'path';
import { writeFileSafely } from './utils/writeFileSafely';
import { ValidatedJoiGeneratorConfig } from './types';
import { PathResolver, createPathResolver, FileInfo } from './pathResolver';

export default class Transformer {
  name?: string;
  fields?: PrismaDMMF.SchemaArg[];
  schemaImports?: Set<string>;
  modelOperations?: PrismaDMMF.ModelMapping[];
  enumTypes?: PrismaDMMF.SchemaEnum[];
  static enumNames: Array<string> = [];
  static generatedSchemaFiles: Array<string> = [];
  static generatedSchemaObjectFiles: Array<string> = [];
  static generatedSchemaObjectNames: Array<string> = [];
  static generatedSchemaEnumFiles: Array<string> = [];
  /** Name of the shared object-schema registry exported from the objects barrel. */
  static readonly objectRegistryExport = 'objectSchemas';
  private static outputPath?: string;
  private static config?: ValidatedJoiGeneratorConfig;
  private static pathResolver?: PathResolver;
  constructor({
    name,
    fields,
    modelOperations,
    enumTypes,
  }: {
    name?: string | undefined;
    fields?: PrismaDMMF.SchemaArg[] | undefined;
    schemaImports?: Set<string>;
    modelOperations?: PrismaDMMF.ModelMapping[];
    enumTypes?: PrismaDMMF.SchemaEnum[];
  }) {
    this.name = name ?? '';
    this.fields = fields ?? [];
    this.modelOperations = modelOperations ?? [];
    this.schemaImports = new Set();
    this.enumTypes = enumTypes;
  }

  static setOutputPath(outPath: string) {
    this.outputPath = outPath;
    if (this.config) {
      this.pathResolver = createPathResolver(this.config, outPath);
    }
  }

  static getOutputPath() {
    return this.outputPath;
  }

  static setConfig(config: ValidatedJoiGeneratorConfig) {
    this.config = config;
    if (this.outputPath) {
      this.pathResolver = createPathResolver(config, this.outputPath);
    }
  }

  static getConfig() {
    return this.config;
  }

  static getPathResolver() {
    return this.pathResolver;
  }

  /**
   * Resolves file path using the current configuration
   */
  private resolveFilePath(fileInfo: FileInfo): string {
    if (!Transformer.pathResolver) {
      // Fallback to legacy behavior
      return this.getLegacyPath(fileInfo);
    }
    
    const resolved = Transformer.pathResolver.resolvePath(fileInfo);
    return Transformer.pathResolver.getAbsolutePath(resolved.filePath);
  }

  /**
   * Legacy path resolution for backward compatibility
   */
  private getLegacyPath(fileInfo: FileInfo): string {
    const { category, fileName } = fileInfo;
    
    switch (category) {
      case 'object':
        return path.join(Transformer.outputPath!, `schemas/objects/${fileName}.schema.ts`);
      case 'enum':
        return path.join(Transformer.outputPath!, `schemas/enums/${fileName}.schema.ts`);
      case 'schema':
      default:
        return path.join(Transformer.outputPath!, `schemas/${fileName}.schema.ts`);
    }
  }

  addSchemaImport(name: string) {
    this.schemaImports?.add(name);
  }

  /**
   * Imports for a generated object schema module.
   *
   * Only enum schemas are imported. Enum modules are leaves: they import nothing but Joi, so
   * importing one can never form a cycle. References to other object schemas are emitted as
   * `Joi.link()` instead (see `schemaReference`), so no object module imports another and the
   * object modules have no import cycle left to trip over.
   */
  getAllSchemaImports() {
    return [...(this.schemaImports ?? [])]
      .filter((name) => Transformer.enumNames.includes(name))
      .map((name) => `import { ${name}Schema } from '../enums/${name}.schema'`)
      .join(';\r\n');
  }

  /**
   * A reference from one generated schema to another, deferred until validation time.
   *
   * This used to be `Joi.object().keys(OtherSchemaObject)`, reading the other module's export
   * while this module was still evaluating. Prisma's input types are genuinely cyclic
   * (`UserWhereInput` -> `PostListRelationFilter` -> `PostWhereInput` ->
   * `UserNullableScalarRelationFilter` -> `UserWhereInput`), so no import order exists in which
   * every reference is already initialised. Under ESM that is a hard failure at import:
   *
   *   ReferenceError: Cannot access 'UserWhereInputSchemaObject' before initialization
   *
   * so `import ... from './generated/schemas'` threw before a consumer could validate anything.
   * Compiled to CommonJS it did not throw, which is worse: the reference read `undefined`,
   * `Joi.object().keys(undefined)` is an object schema with no constraints, and every nested
   * relation filter silently accepted anything at all.
   *
   * `Joi.link('#Name')` is Joi's own construct for this, and the generator already used it for
   * self-references. It needs no import, so the cycle disappears from the module graph, and it
   * resolves when the schema runs, by which point every module has finished evaluating. The
   * target is found through the shared registry that `printIndex` emits alongside the object
   * barrel; every generated root schema is concatenated onto it.
   */
  static schemaReference(type: string) {
    return Transformer.enumNames.includes(type)
      ? `${type}Schema`
      : `Joi.link('#${type}')`;
  }

  getPrismaStringLine(
    field: PrismaDMMF.SchemaArg,
    inputType: PrismaDMMF.InputTypeRef,
    inputsLength: number,
  ) {
    const type = inputType.type as string;
    const reference = Transformer.schemaReference(type);
    // An enum reference is a schema in its own right, so a list of them is the enum schema as
    // written; that is how this behaved before and the emitted output is unchanged.
    const value =
      inputType.isList && !Transformer.enumNames.includes(type)
        ? `Joi.array().items(${reference})`
        : reference;

    if (inputsLength === 1) {
      return `  ${field.name}: ${value}`;
    }

    if (inputsLength > 1) {
      return value;
    }

    return '';
  }

  getSchemaObjectLine(field: PrismaDMMF.SchemaArg) {
    let lines: any = field.inputTypes;

    const inputsLength = field.inputTypes.length;
    if (inputsLength === 0) return lines;

    if (inputsLength === 1) {
      lines = lines.map((inputType: PrismaDMMF.InputTypeRef) => {
        if (inputType.type === 'String') {
          return [
            `  ${field.name}: ${
              inputType.isList
                ? 'Joi.array().items(Joi.string())'
                : 'Joi.string()'
            }`,
            field,
          ];
        } else if (inputType.type === 'Int' || inputType.type === 'Float') {
          return [
            `  ${field.name}: ${
              inputType.isList
                ? 'Joi.array().items(Joi.number())'
                : 'Joi.number()'
            }`,
            field,
          ];
        } else if (inputType.type === 'Boolean') {
          return [
            `  ${field.name}: ${
              inputType.isList
                ? 'Joi.array().items(Joi.boolean())'
                : 'Joi.boolean()'
            }`,
            field,
          ];
        } else if (inputType.type === 'DateTime') {
          return [
            `  ${field.name}: ${
              inputType.isList ? 'Joi.array().items(Joi.date())' : 'Joi.date()'
            }`,
            field,
          ];
        } else if (
          inputType.type === 'Decimal' ||
          inputType.type === 'BigInt'
        ) {
          // Prisma accepts either form over the wire, and a Decimal large enough to matter arrives
          // as a string, since a JS number cannot hold it. Joi has no bigint type.
          const scalar = 'Joi.alternatives().try(Joi.number(), Joi.string())';
          return [
            `  ${field.name}: ${
              inputType.isList ? `Joi.array().items(${scalar})` : scalar
            }`,
            field,
          ];
        } else if (inputType.type === 'Bytes') {
          return [
            `  ${field.name}: ${
              inputType.isList
                ? 'Joi.array().items(Joi.binary())'
                : 'Joi.binary()'
            }`,
            field,
          ];
        } else {
          if (
            inputType.namespace === 'prisma' ||
            inputType.namespace === 'model'
          ) {
            if (inputType.type !== this.name) {
              this.addSchemaImport(inputType.type as string);
            }

            return [
              this.getPrismaStringLine(field, inputType, inputsLength),
              field,
              true,
            ];
          }
        }
        return [];
      });
    } else {
      const alternatives = lines.reduce(
        (result: Array<string>, inputType: PrismaDMMF.InputTypeRef) => {
          if (inputType.type === 'String') {
            result.push(
              inputType.isList
                ? 'Joi.array().items(Joi.string())'
                : 'Joi.string()',
            );
          } else if (inputType.type === 'Int' || inputType.type === 'Float') {
            result.push(
              inputType.isList
                ? 'Joi.array().items(Joi.number())'
                : 'Joi.number()',
            );
          } else if (inputType.type === 'Boolean') {
            result.push(
              inputType.isList
                ? 'Joi.array().items(Joi.boolean())'
                : 'Joi.boolean()',
            );
          } else {
            if (
            inputType.namespace === 'prisma' ||
            inputType.namespace === 'model'
          ) {
              if (inputType.type !== this.name) {
                this.addSchemaImport(inputType.type as string);
              }
              result.push(
                this.getPrismaStringLine(field, inputType, inputsLength),
              );
            } else if (inputType.type === 'Json') {
              result.push(
                inputType.isList ? 'Joi.array().items(Joi.any())' : 'Joi.any()',
              );
            } else if (inputType.type === 'DateTime') {
              result.push(
                inputType.isList ? 'Joi.array().items(Joi.date())' : 'Joi.date()',
              );
            } else if (
              inputType.type === 'Decimal' ||
              inputType.type === 'BigInt'
            ) {
              const scalar = 'Joi.alternatives().try(Joi.number(), Joi.string())';
              result.push(
                inputType.isList ? `Joi.array().items(${scalar})` : scalar,
              );
            } else if (inputType.type === 'Bytes') {
              result.push(
                inputType.isList
                  ? 'Joi.array().items(Joi.binary())'
                  : 'Joi.binary()',
              );
            }
          }
          return result;
        },
        [],
      );

      if (alternatives.length > 0) {
        lines = [
          [
            `  ${field.name}: Joi.alternatives().try(${alternatives.join(
              ',\r\n',
            )})`,
            field,
            true,
          ],
        ];
      } else {
        return [[]];
      }
    }

    return lines.filter(Boolean);
  }

  getFieldValidators(
    joiStringWithMainType: string,
    field: PrismaDMMF.SchemaArg,
  ) {
    let joiStringWithAllValidators = joiStringWithMainType;
    const { isRequired, isNullable } = field;
    if (isRequired) {
      joiStringWithAllValidators += '.required()';
    }
    if (isNullable) {
      joiStringWithAllValidators += '.allow(null)';
    }
    return joiStringWithAllValidators;
  }

  wrapWithObject({
    joiStringFields,
    isArray = true,
    forData = false,
  }: {
    joiStringFields: string;
    isArray?: boolean;
    forData?: boolean;
  }) {
    let wrapped = '{';
    wrapped += '\n';
    wrapped += isArray
      ? '  ' + (joiStringFields as unknown as Array<string>).join(',\r\n')
      : '  ' + joiStringFields;
    wrapped += '\n';
    wrapped += forData ? '  ' + '}' : '}';
    return wrapped;
  }

  getImportJoi() {
    let joiImportStatement = "import Joi from 'joi';";
    joiImportStatement += '\n';
    return joiImportStatement;
  }

  getImportsForSchemaObjects() {
    let imports = this.getImportJoi();
    imports += this.getAllSchemaImports();
    imports += '\n\n';
    return imports;
  }

  getImportsForSchemas(additionalImports: Array<string>) {
    let imports = this.getImportJoi();
    imports += [
      `import { ${Transformer.objectRegistryExport} } from './objects'`,
      ...additionalImports,
    ].join(';\r\n');
    imports += '\n\n';
    return imports;
  }

  addExportSchemaObject(schema: string) {
    return `export const ${this.name}SchemaObject = ${schema}`;
  }

  addExportSchema(schema: string, name: string) {
    return `export const ${name}Schema = ${schema}`;
  }

  /**
   * A root operation schema, concatenated onto the shared object registry.
   *
   * The registry is what makes the `Joi.link()` references inside the embedded object schemas
   * resolvable: a link searches its ancestors for a schema registered under that id, and
   * concatenating carries every registration onto this schema without touching its keys or its
   * strictness. Without it Joi throws, at validation time rather than at import:
   *
   *   AssertError: "where.AND" contains link reference "ref:local:UserWhereInput" which is
   *   outside of schema boundaries
   *
   * which is what the self-references the generator already emitted did before this existed.
   */
  addExportRootSchema(schema: string, name: string) {
    return `export const ${name}Schema = ${Transformer.objectRegistryExport}.concat(${schema})`;
  }

  getImportNoCheck() {
    let imports = '// @ts-nocheck';
    imports += '\n';
    return imports;
  }

  getFinalForm(joiStringFields: string) {
    return `${this.getImportNoCheck()}${this.getImportsForSchemaObjects()}${this.addExportSchemaObject(
      this.wrapWithObject({ joiStringFields }),
    )}`;
  }
  async printSchemaObjects() {
    const joiStringFields = (this.fields ?? [])
      .map((field) => {
        const value = this.getSchemaObjectLine(field);
        return value;
      })
      .flatMap((item) => item)
      .filter((item) => item && item.length > 0)
      .map((item) => {
        const [joiStringWithMainType, field, skipValidators] = item;
        const value = skipValidators
          ? joiStringWithMainType
          : this.getFieldValidators(joiStringWithMainType, field);
        return value;
      });

    const filePath = this.resolveFilePath({
      type: 'objects',
      fileName: this.name!,
      modelName: Transformer.pathResolver?.extractModelName(this.name!),
      category: 'object',
    });
    
    await writeFileSafely(
      filePath,
      this.getFinalForm(joiStringFields as unknown as string),
    );
    Transformer.generatedSchemaObjectFiles.push(`./${this.name}.schema`);
    Transformer.generatedSchemaObjectNames.push(this.name!);
  }

  async printModelSchemas() {
    const config = Transformer.config;
    if (!config) {
      throw new Error('Configuration not set. Call Transformer.setConfig() first.');
    }

    for (const model of this.modelOperations ?? []) {
      const {
        model: modelName,
        findUnique,
        findFirst,
        findMany,
        // @ts-expect-error - these properties exist on the model operations object
        createOne,
        // @ts-expect-error - these properties exist on the model operations object
        deleteOne,
        // @ts-expect-error - these properties exist on the model operations object
        updateOne,
        deleteMany,
        updateMany,
        // @ts-expect-error - these properties exist on the model operations object
        upsertOne,
        aggregate,
        groupBy,
      } = model;

      if (findUnique && config.enabledTypes.has('find')) {
        const imports = [
          `import { ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        
        const filePath = this.resolveFilePath({
          type: 'find',
          fileName: findUnique,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject) }).required()`,
            `${modelName}FindUnique`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${findUnique}.schema`);
      }

      if (findFirst && config.enabledTypes.has('find')) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithRelationInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
          `import { ${modelName}ScalarFieldEnumSchema } from './enums'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'find',
          fileName: findFirst,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject), orderBy: Joi.object().keys(${modelName}OrderByWithRelationInputSchemaObject), cursor: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), take: Joi.number(), skip: Joi.number(), distinct: Joi.array().items(${modelName}ScalarFieldEnumSchema) }).required()`,
            `${modelName}FindFirst`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${findFirst}.schema`);
      }

      if (findMany && config.enabledTypes.has('find')) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithRelationInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
          `import { ${modelName}ScalarFieldEnumSchema } from './enums'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'find',
          fileName: findMany,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject), orderBy: Joi.object().keys(${modelName}OrderByWithRelationInputSchemaObject), cursor: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), take: Joi.number(), skip: Joi.number(), distinct: Joi.array().items(${modelName}ScalarFieldEnumSchema)  }).required()`,
            `${modelName}FindMany`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${findMany}.schema`);
      }

      if (createOne && config.enabledTypes.has('create')) {
        const imports = [
          `import { ${modelName}CreateInputSchemaObject } from './objects'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'create',
          fileName: createOne,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ data: Joi.object().keys(${modelName}CreateInputSchemaObject)  }).required()`,
            `${modelName}Create`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${createOne}.schema`);
      }

      if (deleteOne && config.enabledTypes.has('delete')) {
        const imports = [
          `import { ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'delete',
          fileName: deleteOne,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject)  }).required()`,
            `${modelName}DeleteOne`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${deleteOne}.schema`);
      }

      if (deleteMany && config.enabledTypes.has('delete')) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject } from './objects'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'delete',
          fileName: deleteMany,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject)  }).required()`,
            `${modelName}DeleteMany`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${deleteMany}.schema`);
      }

      if (updateOne && config.enabledTypes.has('update')) {
        const imports = [
          `import { ${modelName}UpdateInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'update',
          fileName: updateOne,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ data: Joi.object().keys(${modelName}UpdateInputSchemaObject), where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject)  }).required()`,
            `${modelName}UpdateOne`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${updateOne}.schema`);
      }

      if (updateMany && config.enabledTypes.has('update')) {
        const imports = [
          `import { ${modelName}UpdateManyMutationInputSchemaObject, ${modelName}WhereInputSchemaObject } from './objects'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'update',
          fileName: updateMany,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ data: Joi.object().keys(${modelName}UpdateManyMutationInputSchemaObject), where: Joi.object().keys(${modelName}WhereInputSchemaObject)  }).required()`,
            `${modelName}UpdateMany`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${updateMany}.schema`);
      }

      if (upsertOne && config.enabledTypes.has('upsert')) {
        const imports = [
          `import { ${modelName}WhereUniqueInputSchemaObject, ${modelName}CreateInputSchemaObject, ${modelName}UpdateInputSchemaObject } from './objects'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'upsert',
          fileName: upsertOne,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), data: Joi.object().keys(${modelName}CreateInputSchemaObject), update: Joi.object().keys(${modelName}UpdateInputSchemaObject)  }).required()`,
            `${modelName}Upsert`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${upsertOne}.schema`);
      }

      if (aggregate && config.enabledTypes.has('aggregate')) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithRelationInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'aggregate',
          fileName: aggregate,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject), orderBy: Joi.object().keys(${modelName}OrderByWithRelationInputSchemaObject), cursor: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), take: Joi.number(), skip: Joi.number()  }).required()`,
            `${modelName}Aggregate`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${aggregate}.schema`);
      }

      if (groupBy && config.enabledTypes.has('groupBy')) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithAggregationInputSchemaObject, ${modelName}ScalarWhereWithAggregatesInputSchemaObject } from './objects'`,
          `import { ${modelName}ScalarFieldEnumSchema } from './enums'`,
        ];
        const filePath = this.resolveFilePath({
          type: 'groupBy',
          fileName: groupBy,
          modelName,
          category: 'schema',
        });
        
        await writeFileSafely(
          filePath,
          `${this.getImportsForSchemas(imports)}${this.addExportRootSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject), orderBy: Joi.object().keys(${modelName}OrderByWithAggregationInputSchemaObject), having: Joi.object().keys(${modelName}ScalarWhereWithAggregatesInputSchemaObject), take: Joi.number(), skip: Joi.number(), by: Joi.array().items(${modelName}ScalarFieldEnumSchema).required()  }).required()`,
            `${modelName}GroupBy`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${groupBy}.schema`);
      }
    }
  }

  async printIndex(type: 'SCHEMAS' | 'SCHEMA_OBJECTS' | 'SCHEMA_ENUMS') {
    const filesPaths =
      type === 'SCHEMAS'
        ? Transformer.generatedSchemaFiles
        : type === 'SCHEMA_ENUMS'
        ? Transformer.generatedSchemaEnumFiles
        : Transformer.generatedSchemaObjectFiles;
    // `printModelSchemas` re-runs for every enabled file type, so the same path arrives here
    // many times over. Duplicate `export *` lines are harmless, but the registry below imports
    // each name once and a repeated import is a redeclaration, so dedupe at the source.
    const exports = [...new Set(filesPaths)].map(
      (schemaPath) => `export * from '${schemaPath}';`,
    );

    const outputPath = path.join(
      Transformer.outputPath,
      type === 'SCHEMAS'
        ? `schemas/index.ts`
        : type === 'SCHEMA_ENUMS'
        ? `schemas/enums/index.ts`
        : `schemas/objects/index.ts`,
    );
    const body =
      type === 'SCHEMA_OBJECTS'
        ? Transformer.getObjectRegistry() + exports.join('\r\n')
        : exports.join('\r\n');
    await writeFileSafely(outputPath, body);
  }

  /**
   * The shared registry every generated root schema is concatenated onto.
   *
   * Each object schema is registered under its own name, which is what the `Joi.link('#Name')`
   * references inside the object schemas resolve against. Building it here rather than in each
   * root schema matters: `shared()` clones, so registering N objects onto R roots separately is
   * O(N x R), while building the base once and concatenating is O(N + R).
   *
   * This module is the only place that reads every object schema, and it can do so safely
   * because the object modules import nothing from each other.
   */
  static getObjectRegistry() {
    const names = [...new Set(Transformer.generatedSchemaObjectNames)];
    const imports = names
      .map((name) => `import { ${name}SchemaObject } from './${name}.schema';`)
      .join('\n');
    const registered = names
      .map((name) => `  Joi.object().keys(${name}SchemaObject).id('${name}'),`)
      .join('\n');
    return (
      `import Joi from 'joi';\n` +
      `${imports}\n\n` +
      `/**\n` +
      ` * Every generated object schema, registered under its own name.\n` +
      ` *\n` +
      ` * Object schemas refer to each other with \`Joi.link('#Name')\` rather than by importing\n` +
      ` * each other, because Prisma's input types are cyclic and an import cycle cannot be\n` +
      ` * evaluated. Concatenate this onto any schema that embeds one, and the links resolve:\n` +
      ` *\n` +
      ` *   objectSchemas.concat(Joi.object().keys(UserWhereInputSchemaObject))\n` +
      ` *\n` +
      ` * The generated root schemas already do this for you.\n` +
      ` */\n` +
      `export const ${Transformer.objectRegistryExport} = [\n` +
      `${registered}\n` +
      `].reduce((schema, shared) => schema.shared(shared), Joi.object());\n\n`
    );
  }

  async printEnumSchemas() {
    for (const enumType of this.enumTypes ?? []) {
      const { name, values } = enumType;

      const filePath = this.resolveFilePath({
        type: 'enums',
        fileName: name,
        category: 'enum',
      });
      
      await writeFileSafely(
        filePath,
        `${this.getImportJoi()}\n${this.addExportSchema(
          `Joi.string().valid(...${JSON.stringify(values)})`,
          `${name}`,
        )}`,
      );
      Transformer.generatedSchemaEnumFiles.push(`./${name}.schema`);
    }
  }
}
