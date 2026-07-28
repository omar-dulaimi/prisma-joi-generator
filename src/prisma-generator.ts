import {
  DMMF,
  EnvValue,
  GeneratorOptions,
} from '@prisma/generator-helper';
import { promises as fs } from 'fs';
import removeDir from './utils/removeDir';
import Transformer from './transformer';
import { parseGeneratorConfig, ValidatedJoiGeneratorConfig } from './types';
import { fileTypeRegistry, GenerationContext } from './registry';
import { logger } from './utils/logger';

/**
 * Resolves a schema value that may be written as `env("SOME_VAR")`.
 *
 * Inlined from `@prisma/internals`. That package is a private implementation detail of the
 * Prisma CLI rather than a public API: it is pinned to one Prisma major and ships its own
 * schema parser, so depending on it from a generator drags a second, mismatched copy of
 * Prisma into every consumer's project.
 */
export function parseEnvValue(object: EnvValue): string {
  if (object.fromEnvVar && object.fromEnvVar !== 'null') {
    const value = process.env[object.fromEnvVar];
    if (!value) {
      throw new Error(
        `Attempted to load provider value using \`env(${object.fromEnvVar})\` but it was not present. Please ensure that ${object.fromEnvVar} is present in your Environment Variables`,
      );
    }
    return value;
  }
  return object.value as string;
}

export async function generate(options: GeneratorOptions) {
  const timer = logger.timer('Total generation');
  
  try {
    logger.info('Starting Prisma Joi Generator');

    // The lists the index files and the object registry are built from are static, so a second
    // generate() in the same process would emit references to the previous run's files.
    Transformer.generatedSchemaFiles = [];
    Transformer.generatedSchemaObjectFiles = [];
    Transformer.generatedSchemaObjectNames = [];
    Transformer.generatedSchemaEnumFiles = [];

    // Parse and validate generator configuration
    const parseTimer = logger.timer('Configuration parsing');
    const config = parseGeneratorConfig(options);
    parseTimer();
    
    // Log configuration summary
    logger.configSummary({
      strategy: config.filterStrategy,
      directoryStrategy: config.directoryStrategy,
      enabledTypes: Array.from(config.enabledTypes),
      outputPath: parseEnvValue(options.generator.output as EnvValue),
    });
    
    await handleGeneratorOutputValue(options.generator.output as EnvValue, config);

    // Prisma parses and validates the schema before it starts a generator and hands the result
    // over as `options.dmmf`, a field that has existed unchanged through Prisma 6 and 7. This
    // used to call `getDMMF({ datamodel, previewFeatures })` from `@prisma/internals` instead,
    // which re-parsed the schema with a bundled Prisma 6. On Prisma 7 the two parsers cannot
    // agree: Prisma 7 removed `url` from the datasource block, so a valid Prisma 7 schema made
    // the bundled parser fail with `P1012: Argument "url" is missing in data source block`,
    // while adding the `url` back to satisfy it made Prisma 7 itself reject the schema.
    logger.debug('Reading the DMMF Prisma passed to the generator');
    const prismaClientDmmf: DMMF.Document = options.dmmf;

    logger.generationStart(
      prismaClientDmmf.datamodel.models.length,
      Array.from(config.enabledTypes)
    );

    // Create required directories based on configuration
    const dirTimer = logger.timer('Directory creation');
    await createRequiredDirectories(config, [...prismaClientDmmf.datamodel.models]);
    dirTimer();

    // Set up enum names for the transformer (global state needed for cross-references)
    const allEnumTypes = [
      ...prismaClientDmmf.schema.enumTypes.prisma,
      ...(prismaClientDmmf.schema.enumTypes.model ?? [])
    ];
    Transformer.enumNames = allEnumTypes.map((enumItem) => enumItem.name) ?? [];

    // Prepare generation context
    const transformer = new Transformer({});
    const generationContext: GenerationContext = {
      transformer,
      dmmf: {
        models: [...prismaClientDmmf.datamodel.models],
        inputObjectTypes: [...prismaClientDmmf.schema.inputObjectTypes.prisma],
        enumTypes: allEnumTypes,
        fieldRefTypes: [...(prismaClientDmmf.schema.fieldRefTypes?.prisma || [])],
        modelOperations: [...prismaClientDmmf.mappings.modelOperations],
      },
      config,
    };

    // Execute generation using the registry system
    logger.debug('Starting file generation');
    const generationTimer = logger.timer('Schema generation');
    await fileTypeRegistry.executeGeneration(generationContext);
    generationTimer();

    // Generate index files if enabled
    if (config.generateIndex) {
      logger.debug('Generating index files');
      const indexTimer = logger.timer('Index generation');
      await generateIndex();
      indexTimer();
    }

    // Count generated files for summary
    const fileCount = await countGeneratedFiles(parseEnvValue(options.generator.output as EnvValue));
    timer();
    logger.generationComplete(fileCount);
    
  } catch (error) {
    timer();
    logger.error('Generation failed', error);
    throw error;
  }
}

async function createRequiredDirectories(config: ValidatedJoiGeneratorConfig, models: DMMF.Model[]) {
  const pathResolver = Transformer.getPathResolver();
  if (!pathResolver) {
    logger.debug('No path resolver available, using legacy directory structure');
    return; // Fallback to current behavior
  }

  const modelNames = models.map(model => model.name);
  const requiredDirectories = pathResolver.getRequiredDirectories(modelNames);
  
  logger.debug(`Creating ${requiredDirectories.length} directories`);
  for (const directory of requiredDirectories) {
    const absolutePath = pathResolver.getAbsolutePath(directory);
    logger.directoryCreation(directory, config.directoryStrategy);
    await fs.mkdir(absolutePath, { recursive: true });
  }
}

async function countGeneratedFiles(outputPath: string): Promise<number> {
  try {
    const files = await fs.readdir(outputPath, { recursive: true });
    return files.filter(file => typeof file === 'string' && file.endsWith('.ts')).length;
  } catch (error) {
    logger.warn('Could not count generated files', error);
    return 0;
  }
}

async function handleGeneratorOutputValue(generatorOutputValue: EnvValue, config: ValidatedJoiGeneratorConfig) {
  const outputDirectoryPath = parseEnvValue(generatorOutputValue);

  // create the output directory and delete contents that might exist from a previous run
  await fs.mkdir(outputDirectoryPath, { recursive: true });
  const isRemoveContentsOnly = true;
  await removeDir(outputDirectoryPath, isRemoveContentsOnly);

  Transformer.setOutputPath(outputDirectoryPath);
  Transformer.setConfig(config);
}

// This used to refuse to run unless a `prisma-client-js` or `prisma-client` generator was
// present, purely so it could read `previewFeatures` off it and hand them to its own parser.
// Nothing here imports or extends the client, and the parser is gone, so the requirement went
// with it: the generator now runs next to either client provider, or on its own.

// Legacy generation functions removed - now handled by FileTypeRegistry

async function generateIndex() {
  const transformer = new Transformer({});
  await transformer.printIndex('SCHEMAS');
  await transformer.printIndex('SCHEMA_OBJECTS');
  await transformer.printIndex('SCHEMA_ENUMS');
}
