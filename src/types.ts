// Configuration types for Prisma Joi Generator
import { GeneratorOptions } from '@prisma/generator-helper';

/**
 * Supported Joi file types that can be generated
 */
export type JoiFileType = 
  | 'create'      // CreateInput schemas
  | 'update'      // UpdateInput schemas  
  | 'upsert'      // UpsertInput schemas
  | 'unchecked'   // UncheckedInput schemas (create/update without relations)
  | 'filter'      // WhereInput and filter schemas
  | 'orderBy'     // OrderBy schemas
  | 'aggregate'   // Aggregate operation schemas
  | 'groupBy'     // GroupBy operation schemas
  | 'find'        // Find operation schemas (findMany, findFirst, findUnique)
  | 'delete'      // Delete operation schemas
  | 'enums'       // Enum schemas
  | 'objects';    // Object/input type schemas

/**
 * Directory organization strategy
 */
export type DirectoryStrategy = 
  | 'flat'        // All files in schemas/ directory
  | 'grouped'     // Files organized in subdirectories (objects/, enums/, etc.)
  | 'by-model';   // Files organized by model name

/**
 * File type filtering strategy
 */
export type FilterStrategy = 
  | 'whitelist'   // Only generate specified types
  | 'blacklist'   // Generate all except specified types
  | 'selective'; // Fine-grained boolean control per type

/**
 * Configuration for file type filtering and organization
 */
export interface JoiGeneratorConfig {
  /**
   * Strategy for filtering file types
   * @default 'selective'
   */
  filterStrategy?: FilterStrategy;

  /**
   * Directory organization strategy
   * @default 'grouped'
   */
  directoryStrategy?: DirectoryStrategy;

  /**
   * File types to include when using whitelist strategy
   */
  includeTypes?: JoiFileType[];

  /**
   * File types to exclude when using blacklist strategy
   */
  excludeTypes?: JoiFileType[];

  /**
   * Fine-grained control over each file type (selective strategy)
   */
  fileTypes?: Partial<Record<JoiFileType, boolean>>;

  /**
   * Custom output directory structure
   */
  directories?: {
    /** Base directory for schemas @default 'schemas' */
    base?: string;
    /** Subdirectory for object schemas @default 'objects' */
    objects?: string;
    /** Subdirectory for enum schemas @default 'enums' */
    enums?: string;
    /** Subdirectory for model-specific schemas when using by-model strategy */
    models?: string;
  };

  /**
   * Whether to generate TypeScript declaration files
   * @default true
   */
  generateTypes?: boolean;

  /**
   * Whether to generate index files for easier imports
   * @default true
   */
  generateIndex?: boolean;

  /**
   * Custom naming patterns for generated files
   */
  naming?: {
    /** Pattern for schema file names @default '{operation}.schema' */
    schemaFiles?: string;
    /** Pattern for object file names @default '{name}.schema' */
    objectFiles?: string;
    /** Pattern for enum file names @default '{name}.schema' */
    enumFiles?: string;
  };
}

/**
 * Default configuration ensuring backward compatibility
 */
export const DEFAULT_CONFIG: Required<JoiGeneratorConfig> = {
  filterStrategy: 'selective',
  directoryStrategy: 'grouped',
  includeTypes: [],
  excludeTypes: [],
  fileTypes: {
    create: true,
    update: true,
    upsert: true,
    unchecked: true,
    filter: true,
    orderBy: true,
    aggregate: true,
    groupBy: true,
    find: true,
    delete: true,
    enums: true,
    objects: true,
  },
  directories: {
    base: 'schemas',
    objects: 'objects',
    enums: 'enums',
    models: 'models',
  },
  generateTypes: true,
  generateIndex: true,
  naming: {
    schemaFiles: '{operation}.schema',
    objectFiles: '{name}.schema',
    enumFiles: '{name}.schema',
  },
};

/**
 * Parsed and validated generator configuration
 */
export interface ValidatedJoiGeneratorConfig extends Required<JoiGeneratorConfig> {
  /** Computed set of enabled file types after applying filter strategy */
  enabledTypes: Set<JoiFileType>;
}

/**
 * Configuration validation errors
 */
export class JoiGeneratorConfigError extends Error {
  constructor(
    message: string, 
    public field?: string,
    public suggestion?: string,
    public validValues?: string[]
  ) {
    let fullMessage = `Joi Generator Configuration Error: ${message}`;
    
    if (field) {
      fullMessage += `\n  Field: ${field}`;
    }
    
    if (validValues && validValues.length > 0) {
      fullMessage += `\n  Valid values: ${validValues.join(', ')}`;
    }
    
    if (suggestion) {
      fullMessage += `\n  Suggestion: ${suggestion}`;
    }
    
    fullMessage += `\n  Documentation: https://github.com/omar-dulaimi/prisma-joi-generator#configuration-options`;
    
    super(fullMessage);
    this.name = 'JoiGeneratorConfigError';
  }
}

/**
 * Validates a generator configuration object
 */
export function validateJoiGeneratorConfig(config: Partial<JoiGeneratorConfig>): ValidatedJoiGeneratorConfig {
  const validatedConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate filter strategy
  if (config.filterStrategy && !['whitelist', 'blacklist', 'selective'].includes(config.filterStrategy)) {
    throw new JoiGeneratorConfigError(
      `Invalid filterStrategy: ${config.filterStrategy}`,
      'filterStrategy',
      'Use "selective" for individual type flags (create="true"), "whitelist" for includeTypes, or "blacklist" for excludeTypes',
      ['selective', 'whitelist', 'blacklist']
    );
  }

  // Validate directory strategy
  if (config.directoryStrategy && !['flat', 'grouped', 'by-model'].includes(config.directoryStrategy)) {
    throw new JoiGeneratorConfigError(
      `Invalid directoryStrategy: ${config.directoryStrategy}`,
      'directoryStrategy',
      'Use "grouped" for type-based folders (default), "flat" for single directory, or "by-model" for model-based organization',
      ['flat', 'grouped', 'by-model']
    );
  }

  // Validate include types for whitelist strategy
  if (config.includeTypes) {
    const validFileTypes = ['create', 'update', 'upsert', 'unchecked', 'filter', 'orderBy', 'aggregate', 'groupBy', 'find', 'delete', 'enums', 'objects'];
    const invalidTypes = config.includeTypes.filter(type => !validFileTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw new JoiGeneratorConfigError(
        `Invalid file types in includeTypes: ${invalidTypes.join(', ')}`,
        'includeTypes',
        'Use comma-separated list of valid file types, e.g., "create,find,objects,enums"',
        validFileTypes
      );
    }
  }

  // Validate exclude types for blacklist strategy
  if (config.excludeTypes) {
    const validFileTypes = ['create', 'update', 'upsert', 'unchecked', 'filter', 'orderBy', 'aggregate', 'groupBy', 'find', 'delete', 'enums', 'objects'];
    const invalidTypes = config.excludeTypes.filter(type => !validFileTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw new JoiGeneratorConfigError(
        `Invalid file types in excludeTypes: ${invalidTypes.join(', ')}`,
        'excludeTypes',
        'Use comma-separated list of valid file types to exclude, e.g., "aggregate,groupBy"',
        validFileTypes
      );
    }
  }

  // Validate strategy-specific requirements
  if (validatedConfig.filterStrategy === 'whitelist' && (!config.includeTypes || config.includeTypes.length === 0)) {
    throw new JoiGeneratorConfigError(
      'includeTypes must be specified and non-empty when using whitelist strategy',
      'includeTypes',
      'Add includeTypes with desired file types, e.g., includeTypes = "create,find,objects,enums"',
      ['create', 'update', 'find', 'delete', 'objects', 'enums']
    );
  }

  if (validatedConfig.filterStrategy === 'blacklist' && (!config.excludeTypes || config.excludeTypes.length === 0)) {
    throw new JoiGeneratorConfigError(
      'excludeTypes must be specified and non-empty when using blacklist strategy',
      'excludeTypes',
      'Add excludeTypes with file types to exclude, e.g., excludeTypes = "aggregate,groupBy,unchecked"',
      ['aggregate', 'groupBy', 'unchecked', 'filter', 'orderBy']
    );
  }

  // Compute enabled types based on strategy
  let enabledTypes = new Set<JoiFileType>();
  
  switch (validatedConfig.filterStrategy) {
    case 'whitelist':
      enabledTypes = new Set(validatedConfig.includeTypes);
      break;
      
    case 'blacklist': {
      const allTypes: JoiFileType[] = ['create', 'update', 'upsert', 'unchecked', 'filter', 'orderBy', 'aggregate', 'groupBy', 'find', 'delete', 'enums', 'objects'];
      enabledTypes = new Set(allTypes.filter(type => !validatedConfig.excludeTypes.includes(type)));
      break;
    }
      
    case 'selective':
      enabledTypes = new Set(
        Object.entries(validatedConfig.fileTypes)
          .filter(([_, enabled]) => enabled)
          .map(([type, _]) => type as JoiFileType)
      );
      break;
  }

  // Validate that at least one type is enabled
  if (enabledTypes.size === 0) {
    throw new JoiGeneratorConfigError(
      'At least one file type must be enabled',
      'fileTypes'
    );
  }

  // Validate directory names don't contain invalid characters
  const directoryRegex = /^[a-zA-Z0-9_-]+$/;
  if (config.directories) {
    for (const [key, value] of Object.entries(config.directories)) {
      if (value && !directoryRegex.test(value)) {
        throw new JoiGeneratorConfigError(
          `Invalid directory name '${value}' for ${key}. Directory names must contain only letters, numbers, underscores, and hyphens`,
          `directories.${key}`
        );
      }
    }
  }

  return {
    ...validatedConfig,
    enabledTypes,
  };
}

/**
 * Parses generator configuration from Prisma GeneratorOptions
 */
export function parseGeneratorConfig(options: GeneratorOptions): ValidatedJoiGeneratorConfig {
  const generatorConfig = options.generator.config || {};
  
  // Convert Prisma config values (which are strings) to appropriate types
  const parsedConfig: Partial<JoiGeneratorConfig> = {};

  // Parse filter strategy
  if (generatorConfig.filterStrategy) {
    parsedConfig.filterStrategy = getConfigString(generatorConfig.filterStrategy) as FilterStrategy;
  }

  // Parse directory strategy
  if (generatorConfig.directoryStrategy) {
    parsedConfig.directoryStrategy = getConfigString(generatorConfig.directoryStrategy) as DirectoryStrategy;
  }

  // Parse include types (array format: "create,update,upsert")
  if (generatorConfig.includeTypes) {
    parsedConfig.includeTypes = parseCommaSeparatedTypes(generatorConfig.includeTypes);
  }

  // Parse exclude types (array format: "aggregate,groupBy")
  if (generatorConfig.excludeTypes) {
    parsedConfig.excludeTypes = parseCommaSeparatedTypes(generatorConfig.excludeTypes);
  }

  // Parse individual file type flags
  const fileTypes: Partial<Record<JoiFileType, boolean>> = {};
  const supportedTypes: JoiFileType[] = ['create', 'update', 'upsert', 'unchecked', 'filter', 'orderBy', 'aggregate', 'groupBy', 'find', 'delete', 'enums', 'objects'];
  
  for (const type of supportedTypes) {
    if (generatorConfig[type] !== undefined) {
      fileTypes[type] = parseBooleanString(getConfigString(generatorConfig[type]));
    }
  }
  
  if (Object.keys(fileTypes).length > 0) {
    parsedConfig.fileTypes = fileTypes;
  }

  // Parse directory configuration
  const directories: Partial<NonNullable<JoiGeneratorConfig['directories']>> = {};
  if (generatorConfig.baseDirectory) {
    directories.base = getConfigString(generatorConfig.baseDirectory);
  }
  if (generatorConfig.objectsDirectory) {
    directories.objects = getConfigString(generatorConfig.objectsDirectory);
  }
  if (generatorConfig.enumsDirectory) {
    directories.enums = getConfigString(generatorConfig.enumsDirectory);
  }
  if (generatorConfig.modelsDirectory) {
    directories.models = getConfigString(generatorConfig.modelsDirectory);
  }
  
  if (Object.keys(directories).length > 0) {
    parsedConfig.directories = directories;
  }

  // Parse boolean flags
  if (generatorConfig.generateTypes !== undefined) {
    parsedConfig.generateTypes = parseBooleanString(getConfigString(generatorConfig.generateTypes));
  }
  
  if (generatorConfig.generateIndex !== undefined) {
    parsedConfig.generateIndex = parseBooleanString(getConfigString(generatorConfig.generateIndex));
  }

  // Parse naming patterns
  const naming: Partial<NonNullable<JoiGeneratorConfig['naming']>> = {};
  if (generatorConfig.schemaFilePattern) {
    naming.schemaFiles = getConfigString(generatorConfig.schemaFilePattern);
  }
  if (generatorConfig.objectFilePattern) {
    naming.objectFiles = getConfigString(generatorConfig.objectFilePattern);
  }
  if (generatorConfig.enumFilePattern) {
    naming.enumFiles = getConfigString(generatorConfig.enumFilePattern);
  }
  
  if (Object.keys(naming).length > 0) {
    parsedConfig.naming = naming;
  }

  // Legacy support: parse enabledTypes (alternative to includeTypes)
  if (generatorConfig.enabledTypes && !parsedConfig.includeTypes) {
    parsedConfig.includeTypes = parseCommaSeparatedTypes(generatorConfig.enabledTypes);
    parsedConfig.filterStrategy = 'whitelist';
  }

  // Legacy support: parse disabledTypes (alternative to excludeTypes)
  if (generatorConfig.disabledTypes && !parsedConfig.excludeTypes) {
    parsedConfig.excludeTypes = parseCommaSeparatedTypes(generatorConfig.disabledTypes);
    parsedConfig.filterStrategy = 'blacklist';
  }

  return validateJoiGeneratorConfig(parsedConfig);
}

/**
 * Extracts string value from Prisma config (handles string | string[])
 */
function getConfigString(value: string | string[]): string {
  return Array.isArray(value) ? value[0] || '' : value;
}

/**
 * Parses comma-separated types from Prisma config
 */
function parseCommaSeparatedTypes(value: string | string[]): JoiFileType[] {
  const stringValue = getConfigString(value);
  return stringValue
    .split(',')
    .map((s: string) => s.trim() as JoiFileType)
    .filter(Boolean);
}

/**
 * Parses string boolean values from Prisma config
 */
function parseBooleanString(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  throw new JoiGeneratorConfigError(`Invalid boolean value: "${value}". Expected true/false, 1/0, or yes/no`);
}