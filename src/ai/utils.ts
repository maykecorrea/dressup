import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Convert a data URI to a temporary file that can be read by OpenAI
 * @param dataUri The data URI string
 * @returns An object with the file path and cleanup function
 */
export function dataUriToTempFile(dataUri: string): { filePath: string; cleanup: () => void } {
  // Extract the base64 data and mime type
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URI format');
  }

  const [, mimeType, base64Data] = matches;
  const extension = mimeType.split('/')[1] || 'png';
  
  // Create a temporary file
  const tempDir = os.tmpdir();
  const fileName = `openai_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
  const filePath = path.join(tempDir, fileName);
  
  // Write the base64 data to the file
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  
  const cleanup = () => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup temp file:', filePath, error);
    }
  };
  
  return { filePath, cleanup };
}

/**
 * Convert base64 image data to a data URI
 * @param base64Data The base64 encoded image data
 * @param mimeType The MIME type (default: image/png)
 * @returns A complete data URI string
 */
export function base64ToDataUri(base64Data: string, mimeType = 'image/png'): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Convert multiple data URIs to temporary files
 * @param dataUris Array of data URI strings
 * @returns An object with file paths and cleanup function
 */
export function dataUrisToTempFiles(dataUris: string[]): { filePaths: string[]; cleanup: () => void } {
  const tempFiles = dataUris.map(dataUri => dataUriToTempFile(dataUri));
  
  return {
    filePaths: tempFiles.map(tf => tf.filePath),
    cleanup: () => {
      tempFiles.forEach(tf => tf.cleanup());
    }
  };
}