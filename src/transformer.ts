import { DMMF as PrismaDMMF } from '@prisma/client/runtime';
import path from 'path';
import { writeFileSafely } from './utils/writeFileSafely';

export default class Transformer {
  name?: string;
  fields?: PrismaDMMF.SchemaArg[];
  schemaImports?: Set<string>;
  modelOperations?: PrismaDMMF.ModelMapping[];
  enumTypes?: PrismaDMMF.SchemaEnum[];
  static enumNames: Array<string> = [];
  static generatedSchemaFiles: Array<string> = [];
  static generatedSchemaObjectFiles: Array<string> = [];
  static generatedSchemaEnumFiles: Array<string> = [];
  private static outputPath?: string;
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
  }

  static getOutputPath() {
    return this.outputPath;
  }

  addSchemaImport(name: string) {
    this.schemaImports?.add(name);
  }

  getAllSchemaImports() {
    return [...(this.schemaImports ?? [])]
      .map((name) =>
        Transformer.enumNames.includes(name)
          ? `import { ${name}Schema } from '../enums/${name}.schema'`
          : `import { ${name}SchemaObject } from './${name}.schema'`,
      )
      .join(';\r\n');
  }

  getPrismaStringLine(
    field: PrismaDMMF.SchemaArg,
    inputType: PrismaDMMF.SchemaArgInputType,
    inputsLength: number,
  ) {
    if (inputsLength === 1) {
      if (inputType.isList) {
        if (inputType.type === this.name) {
          return `  ${
            field.name
          }: Joi.array().items(${`Joi.link('#${inputType.type}')`})`;
        } else {
          return `  ${field.name}: ${
            Transformer.enumNames.includes(inputType.type as string)
              ? `${`${inputType.type}Schema`}`
              : `Joi.array().items(Joi.object().keys(${`${inputType.type}SchemaObject`}))`
          }`;
        }
      } else {
        if (inputType.type === this.name) {
          return `  ${field.name}: ${`Joi.link('#${inputType.type}')`}`;
        } else {
          return `  ${field.name}: ${
            Transformer.enumNames.includes(inputType.type as string)
              ? `${`${inputType.type}Schema`}`
              : `Joi.object().keys(${`${inputType.type}SchemaObject`})`
          }`;
        }
      }
    }

    if (inputsLength > 1) {
      if (inputType.isList) {
        if (inputType.type === this.name) {
          return `Joi.array().items(${`Joi.link('#${inputType.type}')`})`;
        } else {
          return `${
            Transformer.enumNames.includes(inputType.type as string)
              ? `${`${inputType.type}Schema`}`
              : `Joi.array().items(Joi.object().keys(${`${inputType.type}SchemaObject`}))`
          }`;
        }
      } else {
        if (inputType.type === this.name) {
          return `${`Joi.link('#${inputType.type}')`}`;
        } else {
          return `${
            Transformer.enumNames.includes(inputType.type as string)
              ? `${`${inputType.type}Schema`}`
              : `Joi.object().keys(${`${inputType.type}SchemaObject`})`
          }`;
        }
      }
    }
    return '';
  }

  getSchemaObjectLine(field: PrismaDMMF.SchemaArg) {
    let lines: any = field.inputTypes;

    const inputsLength = field.inputTypes.length;
    if (inputsLength === 0) return lines;

    if (inputsLength === 1) {
      lines = lines.map((inputType: PrismaDMMF.SchemaArgInputType) => {
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
        } else {
          if (inputType.namespace === 'prisma') {
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
        (result: Array<string>, inputType: PrismaDMMF.SchemaArgInputType) => {
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
            if (inputType.namespace === 'prisma') {
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
    imports += [...additionalImports].join(';\r\n');
    imports += '\n\n';
    return imports;
  }

  addExportSchemaObject(schema: string) {
    return `export const ${this.name}SchemaObject = ${schema}`;
  }

  addExportSchema(schema: string, name: string) {
    return `export const ${name}Schema = ${schema}`;
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

    await writeFileSafely(
      path.join(
        Transformer.outputPath,
        `schemas/objects/${this.name}.schema.ts`,
      ),
      this.getFinalForm(joiStringFields as unknown as string),
    );
    Transformer.generatedSchemaObjectFiles.push(`./${this.name}.schema`);
  }

  async printModelSchemas() {
    for (const model of this.modelOperations ?? []) {
      const {
        model: modelName,
        findUnique,
        findFirst,
        findMany,
        create,
        update,
        deleteMany,
        updateMany,
        upsert,
        aggregate,
        groupBy,
      } = model;

      if (findUnique) {
        const imports = [
          `import { ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${findUnique}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject) }).required()`,
            `${modelName}FindUnique`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${findUnique}.schema`);
      }

      if (findFirst) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithRelationInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
          `import { ${modelName}ScalarFieldEnumSchema } from './enums'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${findFirst}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject), orderBy: Joi.object().keys(${modelName}OrderByWithRelationInputSchemaObject), cursor: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), take: Joi.number(), skip: Joi.number(), distinct: Joi.array().items(${modelName}ScalarFieldEnumSchema) }).required()`,
            `${modelName}FindFirst`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${findFirst}.schema`);
      }

      if (findMany) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithRelationInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
          `import { ${modelName}ScalarFieldEnumSchema } from './enums'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${findMany}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject), orderBy: Joi.object().keys(${modelName}OrderByWithRelationInputSchemaObject), cursor: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), take: Joi.number(), skip: Joi.number(), distinct: Joi.array().items(${modelName}ScalarFieldEnumSchema)  }).required()`,
            `${modelName}FindMany`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${findMany}.schema`);
      }

      if (create) {
        const imports = [
          `import { ${modelName}CreateInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${create}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ data: Joi.object().keys(${modelName}CreateInputSchemaObject)  }).required()`,
            `${modelName}Create`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${create}.schema`);
      }

      if (model.delete) {
        const imports = [
          `import { ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(
            Transformer.outputPath,
            `schemas/${model.delete}.schema.ts`,
          ),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject)  }).required()`,
            `${modelName}DeleteOne`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${model.delete}.schema`);
      }

      if (deleteMany) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${deleteMany}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject)  }).required()`,
            `${modelName}DeleteMany`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${deleteMany}.schema`);
      }

      if (update) {
        const imports = [
          `import { ${modelName}UpdateInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${update}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ data: Joi.object().keys(${modelName}UpdateInputSchemaObject), where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject)  }).required()`,
            `${modelName}UpdateOne`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${update}.schema`);
      }

      if (updateMany) {
        const imports = [
          `import { ${modelName}UpdateManyMutationInputSchemaObject, ${modelName}WhereInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${updateMany}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ data: Joi.object().keys(${modelName}UpdateManyMutationInputSchemaObject), where: Joi.object().keys(${modelName}WhereInputSchemaObject)  }).required()`,
            `${modelName}UpdateMany`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${updateMany}.schema`);
      }

      if (upsert) {
        const imports = [
          `import { ${modelName}WhereUniqueInputSchemaObject, ${modelName}CreateInputSchemaObject, ${modelName}UpdateInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${upsert}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), data: Joi.object().keys(${modelName}CreateInputSchemaObject), update: Joi.object().keys(${modelName}UpdateInputSchemaObject)  }).required()`,
            `${modelName}Upsert`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${upsert}.schema`);
      }

      if (aggregate) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithRelationInputSchemaObject, ${modelName}WhereUniqueInputSchemaObject } from './objects'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${aggregate}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
            `Joi.object().keys({ where: Joi.object().keys(${modelName}WhereInputSchemaObject), orderBy: Joi.object().keys(${modelName}OrderByWithRelationInputSchemaObject), cursor: Joi.object().keys(${modelName}WhereUniqueInputSchemaObject), take: Joi.number(), skip: Joi.number()  }).required()`,
            `${modelName}Aggregate`,
          )}`,
        );
        Transformer.generatedSchemaFiles.push(`./${aggregate}.schema`);
      }

      if (groupBy) {
        const imports = [
          `import { ${modelName}WhereInputSchemaObject, ${modelName}OrderByWithAggregationInputSchemaObject, ${modelName}ScalarWhereWithAggregatesInputSchemaObject } from './objects'`,
          `import { ${modelName}ScalarFieldEnumSchema } from './enums'`,
        ];
        await writeFileSafely(
          path.join(Transformer.outputPath, `schemas/${groupBy}.schema.ts`),
          `${this.getImportsForSchemas(imports)}${this.addExportSchema(
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
    const exports = filesPaths.map(
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
    await writeFileSafely(outputPath, `${exports.join('\r\n')}`);
  }

  async printEnumSchemas() {
    for (const enumType of this.enumTypes ?? []) {
      const { name, values } = enumType;

      await writeFileSafely(
        path.join(Transformer.outputPath, `schemas/enums/${name}.schema.ts`),
        `${this.getImportJoi()}\n${this.addExportSchema(
          `Joi.string().valid(...${JSON.stringify(values)})`,
          `${name}`,
        )}`,
      );
      Transformer.generatedSchemaEnumFiles.push(`./${name}.schema`);
    }
  }
}
