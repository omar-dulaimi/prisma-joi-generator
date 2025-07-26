import fs from 'fs';
import path from 'path';
import { formatFile } from './formatFile';
import { logger } from './logger';

export const writeFileSafely = async (writeLocation: string, content: any) => {
  try {
    // Ensure directory exists
    const directory = path.dirname(writeLocation);
    fs.mkdirSync(directory, {
      recursive: true,
    });

    // Format and write file
    const formattedContent = await formatFile(content);
    fs.writeFileSync(writeLocation, formattedContent);
    
    logger.debug(`✅ Written file: ${path.relative(process.cwd(), writeLocation)}`);
  } catch (error) {
    const relativePath = path.relative(process.cwd(), writeLocation);
    logger.error(`Failed to write file: ${relativePath}`, error);
    
    // Provide helpful error context
    if (error instanceof Error) {
      if (error.message.includes('EACCES')) {
        throw new Error(`Permission denied writing to ${relativePath}. Check file permissions and try again.`);
      } else if (error.message.includes('ENOSPC')) {
        throw new Error(`No space left on device when writing ${relativePath}. Free up disk space and try again.`);
      } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
        throw new Error(`Too many open files when writing ${relativePath}. This may indicate a system limit issue.`);
      }
    }
    
    // Re-throw with context
    throw new Error(`Failed to write file ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
};
