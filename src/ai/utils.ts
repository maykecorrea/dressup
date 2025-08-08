/**
 * Convert a data URI to a buffer that can be used with OpenAI
 * @param dataUri The data URI string
 * @returns The buffer and mime type
 */
export function dataUriToBuffer(dataUri: string): { buffer: Buffer; mimeType: string } {
  // Extract the base64 data and mime type
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URI format');
  }

  const [, mimeType, base64Data] = matches;
  const buffer = Buffer.from(base64Data, 'base64');
  
  return { buffer, mimeType };
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
 * Convert multiple data URIs to buffers
 * @param dataUris Array of data URI strings
 * @returns Array of buffers with their mime types
 */
export function dataUrisToBuffers(dataUris: string[]): Array<{ buffer: Buffer; mimeType: string }> {
  return dataUris.map(dataUri => dataUriToBuffer(dataUri));
}