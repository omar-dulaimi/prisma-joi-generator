import {
  DMMF,
  EnvValue,
  GeneratorConfig,
  GeneratorOptions,
} from '@prisma/generator-helper';
import { getDMMF, parseEnvValue } from '@prisma/internals';
import { promises as fs } from 'fs';
import removeDir from './utils/removeDir';
import Transformer from './transformer';

export async function generate(options: GeneratorOptions) {
  try {
    await handleGeneratorOutputValue(options.generator.output as EnvValue);

    const prismaClientGeneratorConfig = 
      getGeneratorConfigByProvider(options.otherGenerators, 'prisma-client-js') ||
      getGeneratorConfigByProvider(options.otherGenerators, 'prisma-client');

    if (!prismaClientGeneratorConfig) {
      throw new Error(
        'Prisma Joi Generator requires either "prisma-client-js" or "prisma-client" generator to be present in your schema.prisma file.\n\n' +
        'Please add one of the following to your schema.prisma:\n\n' +
        '// For the legacy generator:\n' +
        'generator client {\n' +
        '  provider = "prisma-client-js"\n' +
        '}\n\n' +
        '// Or for the new generator (Prisma 6.12.0+):\n' +
        'generator client {\n' +
        '  provider = "prisma-client"\n' +
        '}'
      );
    }

    const prismaClientDmmf = await getDMMF({
      datamodel: options.datamodel,
      previewFeatures: prismaClientGeneratorConfig?.previewFeatures,
    });

    checkForCustomPrismaClientOutputPath(prismaClientGeneratorConfig);

    const modelOperations = prismaClientDmmf.mappings.modelOperations;
    const inputObjectTypes = prismaClientDmmf.schema.inputObjectTypes.prisma;
    const fieldRefTypes = prismaClientDmmf.schema.fieldRefTypes?.prisma || [];
    // Note: outputObjectTypes and enumTypes are available but not currently used in generation

    await generateEnumSchemas(
      [...prismaClientDmmf.schema.enumTypes.prisma],
      [...(prismaClientDmmf.schema.enumTypes.model ?? [])],
    );

    const mutableInputObjectTypes = [...inputObjectTypes];
    
    await generateFieldRefSchemas([...fieldRefTypes]);
    await generateObjectSchemas(mutableInputObjectTypes);
    await generateModelSchemas(
      [...prismaClientDmmf.datamodel.models],
      [...modelOperations],
    );
    await generateIndex();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function handleGeneratorOutputValue(generatorOutputValue: EnvValue) {
  const outputDirectoryPath = parseEnvValue(generatorOutputValue);

  // create the output directory and delete contents that might exist from a previous run
  await fs.mkdir(outputDirectoryPath, { recursive: true });
  const isRemoveContentsOnly = true;
  await removeDir(outputDirectoryPath, isRemoveContentsOnly);

  Transformer.setOutputPath(outputDirectoryPath);
}

function getGeneratorConfigByProvider(
  generators: GeneratorConfig[],
  provider: string,
) {
  return generators.find((it) => parseEnvValue(it.provider) === provider);
}

function checkForCustomPrismaClientOutputPath(
  prismaClientGeneratorConfig: GeneratorConfig | undefined,
) {
  if (prismaClientGeneratorConfig?.isCustomOutput) {
    // Store custom output path for future use if needed
    // Transformer.setPrismaClientOutputPath(
    //   prismaClientGeneratorConfig.output?.value as string,
    // );
  }
}

async function generateEnumSchemas(
  prismaSchemaEnum: DMMF.SchemaEnum[],
  modelSchemaEnum: DMMF.SchemaEnum[],
) {
  const enumTypes = [...prismaSchemaEnum, ...modelSchemaEnum];
  const enumNames = enumTypes.map((enumItem) => enumItem.name);
  Transformer.enumNames = enumNames ?? [];
  const transformer = new Transformer({
    enumTypes,
  });
  await transformer.printEnumSchemas();
}

async function generateFieldRefSchemas(fieldRefTypes: DMMF.FieldRefType[]) {
  for (let i = 0; i < fieldRefTypes.length; i += 1) {
    const fields = fieldRefTypes[i]?.fields;
    const name = fieldRefTypes[i]?.name;
    const transformer = new Transformer({ name, fields: [...(fields || [])] });
    await transformer.printSchemaObjects();
  }
}

async function generateObjectSchemas(inputObjectTypes: DMMF.InputType[]) {
  for (let i = 0; i < inputObjectTypes.length; i += 1) {
    const fields = inputObjectTypes[i]?.fields;
    const name = inputObjectTypes[i]?.name;
    const transformer = new Transformer({ name, fields: [...(fields || [])] });
    await transformer.printSchemaObjects();
  }
}

async function generateModelSchemas(
  models: DMMF.Model[],
  modelOperations: DMMF.ModelMapping[],
) {
  const transformer = new Transformer({
    modelOperations,
  });
  await transformer.printModelSchemas();
}

async function generateIndex() {
  const transformer = new Transformer({});
  await transformer.printIndex('SCHEMAS');
  await transformer.printIndex('SCHEMA_OBJECTS');
  await transformer.printIndex('SCHEMA_ENUMS');
}
