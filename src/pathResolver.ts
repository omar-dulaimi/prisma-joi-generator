// Directory Organization and Path Resolution System
import path from 'path';
import { ValidatedJoiGeneratorConfig, JoiFileType } from './types';

/**
 * File type information for path resolution
 */
export interface FileInfo {
  /** The file type */
  type: JoiFileType;
  /** The operation name (e.g., 'findUniqueUser', 'UserCreateInput') */
  fileName: string;
  /** The model name (e.g., 'User', 'Post') */
  modelName?: string;
  /** Category of the file */
  category: 'schema' | 'object' | 'enum';
}

/**
 * Path resolution result
 */
export interface ResolvedPath {
  /** Full file path relative to output directory */
  filePath: string;
  /** Directory path relative to output directory */
  directory: string;
  /** Final filename with extension */
  filename: string;
  /** Import path for index files */
  importPath: string;
}

/**
 * Utility class for resolving file paths based on directory strategy
 */
export class PathResolver {
  constructor(private config: ValidatedJoiGeneratorConfig, private outputPath: string) {}

  /**
   * Resolves the file path for a given file info
   */
  resolvePath(fileInfo: FileInfo): ResolvedPath {
    
    switch (this.config.directoryStrategy) {
      case 'flat':
        return this.resolveFlatPath(fileInfo);
      
      case 'grouped':
        return this.resolveGroupedPath(fileInfo);
      
      case 'by-model':
        return this.resolveByModelPath(fileInfo);
      
      default:
        return this.resolveGroupedPath(fileInfo); // Default fallback
    }
  }

  /**
   * Resolves path for flat directory structure (all files in base directory)
   */
  private resolveFlatPath(fileInfo: FileInfo): ResolvedPath {
    const { fileName } = fileInfo;
    const baseDir = this.config.directories.base;
    const filename = this.getFilename(fileInfo);
    
    return {
      filePath: path.join(baseDir, filename),
      directory: baseDir,
      filename,
      importPath: `./${fileName}.schema`,
    };
  }

  /**
   * Resolves path for grouped directory structure (current behavior)
   */
  private resolveGroupedPath(fileInfo: FileInfo): ResolvedPath {
    const { fileName, category } = fileInfo;
    const baseDir = this.config.directories.base;
    const filename = this.getFilename(fileInfo);
    
    let subDirectory: string;
    let importPath: string;
    
    switch (category) {
      case 'enum':
        subDirectory = path.join(baseDir, this.config.directories.enums);
        importPath = `../enums/${fileName}.schema`;
        break;
        
      case 'object':
        subDirectory = path.join(baseDir, this.config.directories.objects);
        importPath = `./${fileName}.schema`;
        break;
        
      case 'schema':
      default:
        subDirectory = baseDir;
        importPath = `./${fileName}.schema`;
        break;
    }
    
    return {
      filePath: path.join(subDirectory, filename),
      directory: subDirectory,
      filename,
      importPath,
    };
  }

  /**
   * Resolves path for by-model directory structure
   */
  private resolveByModelPath(fileInfo: FileInfo): ResolvedPath {
    const { fileName, modelName, category } = fileInfo;
    const baseDir = this.config.directories.base;
    const filename = this.getFilename(fileInfo);
    
    if (!modelName) {
      // For non-model files (enums, generic objects), use grouped structure
      return this.resolveGroupedPath(fileInfo);
    }
    
    const modelDir = this.sanitizeDirectoryName(modelName);
    let subDirectory: string;
    let importPath: string;
    
    switch (category) {
      case 'schema':
        subDirectory = path.join(baseDir, this.config.directories.models, modelDir);
        importPath = `./${fileName}.schema`;
        break;
        
      case 'object':
        subDirectory = path.join(baseDir, this.config.directories.models, modelDir, this.config.directories.objects);
        importPath = `./objects/${fileName}.schema`;
        break;
        
      case 'enum':
        // Enums are shared, keep them in global enums directory
        subDirectory = path.join(baseDir, this.config.directories.enums);
        importPath = `../../enums/${fileName}.schema`;
        break;
        
      default:
        subDirectory = path.join(baseDir, this.config.directories.models, modelDir);
        importPath = `./${fileName}.schema`;
        break;
    }
    
    return {
      filePath: path.join(subDirectory, filename),
      directory: subDirectory,
      filename,
      importPath,
    };
  }

  /**
   * Generates the final filename based on naming patterns
   */
  private getFilename(fileInfo: FileInfo): string {
    const { type, fileName, category } = fileInfo;
    
    let pattern: string;
    switch (category) {
      case 'schema':
        pattern = this.config.naming.schemaFiles;
        break;
      case 'object':
        pattern = this.config.naming.objectFiles;
        break;
      case 'enum':
        pattern = this.config.naming.enumFiles;
        break;
      default:
        pattern = this.config.naming.schemaFiles;
        break;
    }
    
    // Replace placeholders in the pattern
    const finalName = pattern
      .replace('{operation}', fileName)
      .replace('{name}', fileName)
      .replace('{type}', type);
    
    return `${finalName}.ts`;
  }

  /**
   * Resolves the index file path for a given category
   */
  resolveIndexPath(category: 'schema' | 'object' | 'enum' | 'model', modelName?: string): ResolvedPath {
    const baseDir = this.config.directories.base;
    
    switch (this.config.directoryStrategy) {
      case 'flat':
        return {
          filePath: path.join(baseDir, 'index.ts'),
          directory: baseDir,
          filename: 'index.ts',
          importPath: './index',
        };
        
      case 'grouped':
        switch (category) {
          case 'schema':
            return {
              filePath: path.join(baseDir, 'index.ts'),
              directory: baseDir,
              filename: 'index.ts',
              importPath: './index',
            };
          case 'object':
            return {
              filePath: path.join(baseDir, this.config.directories.objects, 'index.ts'),
              directory: path.join(baseDir, this.config.directories.objects),
              filename: 'index.ts',
              importPath: './objects/index',
            };
          case 'enum':
            return {
              filePath: path.join(baseDir, this.config.directories.enums, 'index.ts'),
              directory: path.join(baseDir, this.config.directories.enums),
              filename: 'index.ts',
              importPath: './enums/index',
            };
          default:
            return this.resolveIndexPath('schema');
        }
        
      case 'by-model':
        if (modelName && category === 'model') {
          const modelDir = this.sanitizeDirectoryName(modelName);
          return {
            filePath: path.join(baseDir, this.config.directories.models, modelDir, 'index.ts'),
            directory: path.join(baseDir, this.config.directories.models, modelDir),
            filename: 'index.ts',
            importPath: `./models/${modelDir}/index`,
          };
        }
        // Fall back to grouped behavior for non-model indexes
        {
          const groupedConfig = { ...this.config, directoryStrategy: 'grouped' as const };
          const groupedResolver = new PathResolver(groupedConfig, this.outputPath);
          return groupedResolver.resolveIndexPath(category);
        }
        
      default: {
        // Use grouped behavior as default
        const defaultConfig = { ...this.config, directoryStrategy: 'grouped' as const };
        const defaultResolver = new PathResolver(defaultConfig, this.outputPath);
        return defaultResolver.resolveIndexPath(category);
      }
    }
  }

  /**
   * Gets the absolute file path
   */
  getAbsolutePath(relativePath: string): string {
    return path.join(this.outputPath, relativePath);
  }

  /**
   * Extracts model name from operation name
   */
  extractModelName(operationName: string): string | undefined {
    // Pattern: operationName like 'findUniqueUser', 'createOnePost', 'UserCreateInput'
    const patterns = [
      // Operations: findUniqueUser -> User
      /^(findUnique|findFirst|findMany|createOne|updateOne|deleteOne|upsertOne|deleteMany|updateMany|aggregate|groupBy)(.+)$/,
      // Input types: UserCreateInput -> User  
      /^(.+?)(CreateInput|UpdateInput|WhereInput|OrderByInput|UncheckedCreateInput|UncheckedUpdateInput|AvgOrderByAggregateInput|CountOrderByAggregateInput|MaxOrderByAggregateInput|MinOrderByAggregateInput|SumOrderByAggregateInput|ScalarWhereWithAggregatesInput|CreateManyInput|UpdateManyMutationInput|UncheckedUpdateManyInput|OrderByWithAggregationInput|OrderByWithRelationInput|WhereUniqueInput|ListRelationFilter|ScalarRelationFilter|NullableScalarRelationFilter|CreateNestedManyWithoutInput|CreateNestedOneWithoutInput|UpdateNestedManyWithoutInput|UpdateNestedOneWithoutInput|UncheckedCreateNestedManyWithoutInput|UncheckedUpdateNestedManyWithoutInput|CreateOrConnectWithoutInput|UpdateWithWhereUniqueWithoutInput|UpdateWithoutInput|UpsertWithWhereUniqueWithoutInput|UpsertWithoutInput|CreateWithoutInput|UncheckedCreateWithoutInput|UncheckedUpdateWithoutInput|UpdateManyWithWhereWithoutInput|UpdateManyWithoutNestedInput|CreateManyInputEnvelope|ScalarWhereInput).*$/,
      // Schema suffix: UserSchema -> User
      /^(.+)(Schema)$/,
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const match = operationName.match(patterns[i]);
      if (match) {
        // For the first pattern (operations), return the second group
        // For other patterns (input types), return the first group
        return i === 0 ? match[2] : match[1];
      }
    }
    
    return undefined;
  }

  /**
   * Sanitizes directory names to be filesystem-safe
   */
  private sanitizeDirectoryName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Gets all directories that need to be created for the current configuration
   */
  getRequiredDirectories(modelNames: string[]): string[] {
    const directories = new Set<string>();
    const baseDir = this.config.directories.base;
    
    // Always need the base directory
    directories.add(baseDir);
    
    switch (this.config.directoryStrategy) {
      case 'flat':
        // Only need base directory
        break;
        
      case 'grouped':
        if (this.config.enabledTypes.has('enums')) {
          directories.add(path.join(baseDir, this.config.directories.enums));
        }
        if (this.hasObjectTypes()) {
          directories.add(path.join(baseDir, this.config.directories.objects));
        }
        break;
        
      case 'by-model':
        // Add global directories
        if (this.config.enabledTypes.has('enums')) {
          directories.add(path.join(baseDir, this.config.directories.enums));
        }
        
        // Add model-specific directories
        for (const modelName of modelNames) {
          const modelDir = this.sanitizeDirectoryName(modelName);
          const modelPath = path.join(baseDir, this.config.directories.models, modelDir);
          directories.add(modelPath);
          
          if (this.hasObjectTypes()) {
            directories.add(path.join(modelPath, this.config.directories.objects));
          }
        }
        break;
    }
    
    return Array.from(directories);
  }

  /**
   * Checks if any object-related types are enabled
   */
  private hasObjectTypes(): boolean {
    const objectTypes: JoiFileType[] = ['objects', 'filter', 'orderBy', 'unchecked'];
    return objectTypes.some(type => this.config.enabledTypes.has(type));
  }
}

/**
 * Creates a PathResolver instance
 */
export function createPathResolver(config: ValidatedJoiGeneratorConfig, outputPath: string): PathResolver {
  return new PathResolver(config, outputPath);
}