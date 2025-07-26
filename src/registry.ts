// File Type Registry System for Prisma Joi Generator
import type { DMMF as PrismaDMMF } from '@prisma/generator-helper';
import { JoiFileType, ValidatedJoiGeneratorConfig } from './types';
import Transformer from './transformer';
import { logger } from './utils/logger';

/**
 * Metadata for a file type
 */
export interface FileTypeMetadata {
  /** Display name for the file type */
  displayName: string;
  /** Description of what this file type generates */
  description: string;
  /** Priority level for generation order (lower = higher priority) */
  priority: number;
  /** File types that this type depends on */
  dependencies: JoiFileType[];
  /** Category for organization */
  category: 'model-operations' | 'input-objects' | 'enums' | 'field-refs';
  /** Whether this type generates multiple files per model */
  perModel: boolean;
}

/**
 * Context for file generation
 */
export interface GenerationContext {
  /** Transformer instance */
  transformer: any;
  /** Prisma DMMF data */
  dmmf?: {
    models?: PrismaDMMF.Model[];
    inputObjectTypes?: PrismaDMMF.InputType[];
    enumTypes?: PrismaDMMF.SchemaEnum[];
    fieldRefTypes?: PrismaDMMF.FieldRefType[];
    modelOperations?: PrismaDMMF.ModelMapping[];
  };
  /** Configuration */
  config: ValidatedJoiGeneratorConfig;
  /** Model name (for per-model types) */
  modelName?: string;
}

/**
 * Function signature for file type generators
 */
export type FileTypeGenerator = (context: GenerationContext) => Promise<void>;

/**
 * Registry entry for a file type
 */
export interface FileTypeRegistryEntry {
  type: JoiFileType;
  metadata: FileTypeMetadata;
  generator: FileTypeGenerator;
}

/**
 * Centralized registry for managing Joi file types and their generation functions
 */
export class FileTypeRegistry {
  private registry = new Map<JoiFileType, FileTypeRegistryEntry>();
  private config?: ValidatedJoiGeneratorConfig;

  constructor() {
    this.registerBuiltInTypes();
  }

  /**
   * Sets the current configuration
   */
  setConfig(config: ValidatedJoiGeneratorConfig) {
    this.config = config;
  }

  /**
   * Registers a file type with its metadata and generator function
   */
  register(entry: FileTypeRegistryEntry) {
    this.registry.set(entry.type, entry);
  }

  /**
   * Checks if a file type is enabled based on current configuration
   */
  isEnabled(type: JoiFileType): boolean {
    if (!this.config) {
      return true; // Default to enabled if no config
    }
    return this.config.enabledTypes.has(type);
  }

  /**
   * Gets all registered file types
   */
  getAllTypes(): JoiFileType[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Gets enabled file types based on current configuration
   */
  getEnabledTypes(): JoiFileType[] {
    return this.getAllTypes().filter(type => this.isEnabled(type));
  }

  /**
   * Gets file types by category
   */
  getTypesByCategory(category: FileTypeMetadata['category']): JoiFileType[] {
    return this.getAllTypes().filter(type => {
      const entry = this.registry.get(type);
      return entry?.metadata.category === category;
    });
  }

  /**
   * Gets metadata for a file type
   */
  getMetadata(type: JoiFileType): FileTypeMetadata | undefined {
    return this.registry.get(type)?.metadata;
  }

  /**
   * Gets generator function for a file type
   */
  getGenerator(type: JoiFileType): FileTypeGenerator | undefined {
    return this.registry.get(type)?.generator;
  }

  /**
   * Gets enabled file types sorted by priority and dependencies
   */
  getGenerationOrder(): JoiFileType[] {
    const enabledTypes = this.getEnabledTypes();
    const sorted: JoiFileType[] = [];
    const processing = new Set<JoiFileType>();
    const processed = new Set<JoiFileType>();

    const visit = (type: JoiFileType) => {
      if (processed.has(type)) return;
      if (processing.has(type)) {
        throw new Error(`Circular dependency detected involving file type: ${type}`);
      }

      processing.add(type);
      const entry = this.registry.get(type);
      if (entry) {
        // Process dependencies first
        for (const dep of entry.metadata.dependencies) {
          if (enabledTypes.includes(dep)) {
            visit(dep);
          }
        }
      }
      processing.delete(type);
      processed.add(type);
      sorted.push(type);
    };

    // Sort by priority first, then resolve dependencies
    const prioritySorted = enabledTypes.sort((a, b) => {
      const priorityA = this.getMetadata(a)?.priority ?? 100;
      const priorityB = this.getMetadata(b)?.priority ?? 100;
      return priorityA - priorityB;
    });

    for (const type of prioritySorted) {
      visit(type);
    }

    return sorted;
  }

  /**
   * Validates that all dependencies for enabled types are also enabled
   */
  validateDependencies(): string[] {
    const errors: string[] = [];
    const enabledTypes = new Set(this.getEnabledTypes());

    for (const type of enabledTypes) {
      const entry = this.registry.get(type);
      if (entry) {
        for (const dep of entry.metadata.dependencies) {
          if (!enabledTypes.has(dep)) {
            errors.push(`File type '${type}' requires '${dep}' to be enabled`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Executes generation for all enabled file types in dependency order with memory optimization
   */
  async executeGeneration(context: GenerationContext): Promise<void> {
    this.setConfig(context.config);
    
    // Validate dependencies
    const dependencyErrors = this.validateDependencies();
    if (dependencyErrors.length > 0) {
      logger.error('Dependency validation failed', new Error(dependencyErrors.join('\n')));
      throw new Error(`Dependency validation failed:\n${dependencyErrors.join('\n')}`);
    }

    const generationOrder = this.getGenerationOrder();
    const skippedTypes = this.getAllTypes().filter(type => !this.isEnabled(type));
    
    // Log what will be generated and what will be skipped
    if (skippedTypes.length > 0) {
      logger.debug(`Skipping file types: ${skippedTypes.join(', ')}`);
    }
    
    // Progress tracking
    let completedTypes = 0;
    const totalTypes = generationOrder.length;
    logger.info(`📊 Starting generation: ${totalTypes} file types, ${context.dmmf?.models?.length || 0} models`);
    
    for (const type of generationOrder) {
      const generator = this.getGenerator(type);
      if (generator) {
        completedTypes++;
        logger.fileTypeProgress(type, 'start');
        logger.info(`🔄 [${completedTypes}/${totalTypes}] Generating ${type} schemas...`);
        const timer = logger.timer(`${type} generation`);
        
        try {
          // Memory optimization: Process in batches for model operations
          const metadata = this.getMetadata(type);
          if (metadata?.perModel && context.dmmf?.models && context.dmmf.models.length > 10) {
            await this.generateInBatches(context, generator, type);
          } else {
            await generator(context);
          }
          
          timer();
          logger.fileTypeProgress(type, 'complete');
          
          // Force garbage collection hint for large schemas
          if (context.dmmf?.models && context.dmmf.models.length > 20) {
            if (global.gc) {
              global.gc();
              logger.debug(`🗑️  Garbage collection triggered after ${type} generation`);
            }
          }
        } catch (error) {
          timer();
          logger.error(`Failed to generate ${type} schemas`, error);
          throw error;
        }
      } else {
        logger.fileTypeProgress(type, 'skip', 'no generator function');
      }
    }
    
    logger.info(`✅ Generation complete: ${completedTypes} file types processed`);
  }

  /**
   * Generates files in batches to reduce memory usage for large schemas
   */
  private async generateInBatches(
    context: GenerationContext, 
    generator: FileTypeGenerator, 
    type: JoiFileType,
    batchSize: number = 5
  ): Promise<void> {
    const models = context.dmmf?.models || [];
    logger.debug(`📦 Processing ${models.length} models in batches of ${batchSize} for ${type}`);
    
    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(models.length / batchSize);
      
      logger.debug(`🔄 Processing batch ${batchNumber}/${totalBatches}: ${batch.map(m => m.name).join(', ')}`);
      
      // Create context with only current batch of models
      const batchContext: GenerationContext = {
        ...context,
        dmmf: {
          ...context.dmmf,
          models: batch,
        },
      };
      
      await generator(batchContext);
      
      // Memory cleanup between batches
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Registers all built-in file types
   */
  private registerBuiltInTypes() {
    // Will be implemented in the next step
    this.registerEnumTypes();
    this.registerObjectTypes();
    this.registerModelOperationTypes();
  }

  private registerEnumTypes() {
    this.register({
      type: 'enums',
      metadata: {
        displayName: 'Enum Schemas',
        description: 'Joi validation schemas for Prisma enums',
        priority: 1,
        dependencies: [],
        category: 'enums',
        perModel: false,
      },
      generator: async (context) => {
        if (context.dmmf?.enumTypes) {
          const transformer = context.transformer;
          transformer.enumTypes = context.dmmf.enumTypes;
          await transformer.printEnumSchemas();
        }
      },
    });
  }

  private registerObjectTypes() {
    this.register({
      type: 'objects',
      metadata: {
        displayName: 'Object Schemas',
        description: 'Joi validation schemas for input object types',
        priority: 2,
        dependencies: ['enums'],
        category: 'input-objects',
        perModel: false,
      },
      generator: async (context) => {
        const { transformer, dmmf, config } = context;
        
        // Only generate if objects type is enabled
        if (!config.enabledTypes.has('objects')) {
          return;
        }

        // Generate field reference types
        if (dmmf?.fieldRefTypes) {
          for (const fieldRefType of dmmf.fieldRefTypes) {
            transformer.name = fieldRefType.name;
            transformer.fields = fieldRefType.fields || [];
            await transformer.printSchemaObjects();
          }
        }

        // Generate input object types (filtered by configuration)
        if (dmmf?.inputObjectTypes) {
          for (const inputObjectType of dmmf.inputObjectTypes) {
            // Apply filtering based on enabled types
            if (shouldGenerateInputObject(inputObjectType.name, config)) {
              transformer.name = inputObjectType.name;
              transformer.fields = inputObjectType.fields || [];
              await transformer.printSchemaObjects();
            }
          }
        }
      },
    });
  }

  private registerModelOperationTypes() {
    // All model operations - using the existing printModelSchemas function
    // This will be controlled by individual type flags in the registry
    this.register({
      type: 'find',
      metadata: {
        displayName: 'Find Operations',
        description: 'Joi schemas for find operations (findUnique, findFirst, findMany)',
        priority: 10,
        dependencies: ['objects', 'enums'],
        category: 'model-operations',
        perModel: true,
      },
      generator: async (context) => {
        const { transformer, dmmf, config } = context;
        
        if (dmmf?.modelOperations) {
          // Set the model operations on the transformer and run generation
          transformer.modelOperations = dmmf.modelOperations;
          await transformer.printModelSchemas();
        }
      },
    });

    // For now, all other operation types will delegate to the same function
    // In the future, this can be broken down into more granular generators
    const operationTypes: Array<{type: JoiFileType, displayName: string, description: string, priority: number}> = [
      { type: 'create', displayName: 'Create Operations', description: 'Joi schemas for create operations', priority: 11 },
      { type: 'update', displayName: 'Update Operations', description: 'Joi schemas for update operations', priority: 12 },
      { type: 'upsert', displayName: 'Upsert Operations', description: 'Joi schemas for upsert operations', priority: 13 },
      { type: 'delete', displayName: 'Delete Operations', description: 'Joi schemas for delete operations', priority: 14 },
      { type: 'aggregate', displayName: 'Aggregate Operations', description: 'Joi schemas for aggregate operations', priority: 15 },
      { type: 'groupBy', displayName: 'GroupBy Operations', description: 'Joi schemas for groupBy operations', priority: 16 },
    ];

    for (const opType of operationTypes) {
      this.register({
        type: opType.type,
        metadata: {
          displayName: opType.displayName,
          description: opType.description,
          priority: opType.priority,
          dependencies: ['objects', 'enums'],
          category: 'model-operations',
          perModel: true,
        },
        generator: async (context) => {
          const { transformer, dmmf, config } = context;
          
          if (dmmf?.modelOperations) {
            // Set the model operations on the transformer and run generation
            transformer.modelOperations = dmmf.modelOperations;
            await transformer.printModelSchemas();
          }
        },
      });
    }

    // Filter, OrderBy, and Unchecked types are part of the objects generation
    // but can be controlled separately for future granular filtering
    const inputObjectTypes: Array<{type: JoiFileType, displayName: string, description: string, priority: number}> = [
      { type: 'filter', displayName: 'Filter Schemas', description: 'Joi schemas for filter and where input types', priority: 3 },
      { type: 'orderBy', displayName: 'OrderBy Schemas', description: 'Joi schemas for orderBy input types', priority: 4 },
      { type: 'unchecked', displayName: 'Unchecked Input Schemas', description: 'Joi schemas for unchecked input types (without relations)', priority: 5 },
    ];

    for (const inputType of inputObjectTypes) {
      this.register({
        type: inputType.type,
        metadata: {
          displayName: inputType.displayName,
          description: inputType.description,
          priority: inputType.priority,
          dependencies: ['enums'],
          category: 'input-objects',
          perModel: false,
        },
        generator: async (context) => {
          // These are currently generated as part of the objects type
          // The filtering logic will be implemented in the Transformer class
          // to selectively generate only the requested input object types
        },
      });
    }
  }
}

/**
 * Determines if an input object should be generated based on configuration
 */
function shouldGenerateInputObject(objectName: string, config: ValidatedJoiGeneratorConfig): boolean {
  // For now, generate all input objects if 'objects' is enabled
  // In the future, this can be more granular based on filter, orderBy, unchecked settings
  return config.enabledTypes.has('objects') || 
         config.enabledTypes.has('filter') || 
         config.enabledTypes.has('orderBy') || 
         config.enabledTypes.has('unchecked');
}

/**
 * Global registry instance
 */
export const fileTypeRegistry = new FileTypeRegistry();