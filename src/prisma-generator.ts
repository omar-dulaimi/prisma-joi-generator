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
import { parseGeneratorConfig, ValidatedJoiGeneratorConfig } from './types';
import { fileTypeRegistry, GenerationContext } from './registry';
import { logger } from './utils/logger';

export async function generate(options: GeneratorOptions) {
  const timer = logger.timer('Total generation');
  
  try {
    logger.info('Starting Prisma Joi Generator');
    
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

    logger.debug('Loading Prisma DMMF');
    const dmmfTimer = logger.timer('DMMF loading');
    const prismaClientDmmf = await getDMMF({
      datamodel: options.datamodel,
      previewFeatures: prismaClientGeneratorConfig?.previewFeatures,
    });
    dmmfTimer();

    checkForCustomPrismaClientOutputPath(prismaClientGeneratorConfig);

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

// Legacy generation functions removed - now handled by FileTypeRegistry

async function generateIndex() {
  const transformer = new Transformer({});
  await transformer.printIndex('SCHEMAS');
  await transformer.printIndex('SCHEMA_OBJECTS');
  await transformer.printIndex('SCHEMA_ENUMS');
}
