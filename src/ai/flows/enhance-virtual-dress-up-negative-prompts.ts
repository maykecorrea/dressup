'use server';

/**
 * @fileOverview This flow enhances the virtual dress-up process by allowing users to add negative prompts
 * to refine the results and prevent undesirable characteristics.
 *
 * - enhanceVirtualDressUpWithNegativePrompts - A function that applies a garment image to a model image, using negative prompts for refinement.
 * - EnhanceVirtualDressUpWithNegativePromptsInput - The input type for the enhanceVirtualDressUpWithNegativePrompts function.
 * - EnhanceVirtualDressUpWithNegativePromptsOutput - The return type for the enhanceVirtualDressUpWithNegativePrompts function.
 */

import { openai } from '@/ai/openai';
import { dataUriToBuffer, base64ToDataUri } from '@/ai/utils';
import { z } from 'zod';

const EnhanceVirtualDressUpWithNegativePromptsInputSchema = z.object({
  modelPhotoDataUri: z
    .string()
    .describe(
      "A photo of a model, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  garmentPhotoDataUri: z
    .string()
    .describe(
      "A photo of a garment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  positivePrompt: z.string().optional().describe('Positive prompts to enhance the garment style and integration, e.g., \'high quality, realistic shading\'.'),
  negativePrompt: z.string().optional().describe('Negative prompts to prevent undesirable characteristics, e.g., \'ugly, deformed\'.'),
});
export type EnhanceVirtualDressUpWithNegativePromptsInput = z.infer<typeof EnhanceVirtualDressUpWithNegativePromptsInputSchema>;

const EnhanceVirtualDressUpWithNegativePromptsOutputSchema = z.object({
  dressedUpPhotoDataUri: z.string().describe('The final image of the model wearing the new outfit, as a data URI.'),
});
export type EnhanceVirtualDressUpWithNegativePromptsOutput = z.infer<typeof EnhanceVirtualDressUpWithNegativePromptsOutputSchema>;

export async function enhanceVirtualDressUpWithNegativePrompts(input: EnhanceVirtualDressUpWithNegativePromptsInput): Promise<EnhanceVirtualDressUpWithNegativePromptsOutput> {
  const { modelPhotoDataUri, garmentPhotoDataUri, positivePrompt, negativePrompt } = input;
  
  try {
    // Convert data URIs to buffers
    const modelBuffer = dataUriToBuffer(modelPhotoDataUri);
    
    let prompt = 'Replace the clothing on the model in the photo with the garment shown in the reference. Consider the style and fit of the garment.';
    
    if (positivePrompt) {
      prompt += ` Positive guidance: ${positivePrompt}`;
    }
    
    if (negativePrompt) {
      prompt += ` Avoid these characteristics: ${negativePrompt}`;
    }
    
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: new File([modelBuffer.buffer], "model.png", { type: modelBuffer.mimeType }),
      prompt: prompt,
      size: "1024x1024",
      quality: "high",
      input_fidelity: "high"
    });

    if (!result.data || !result.data[0].b64_json) {
      throw new Error('Failed to generate image');
    }

    return {
      dressedUpPhotoDataUri: base64ToDataUri(result.data[0].b64_json!, 'image/png'),
    };
    
  } catch (error) {
    console.error('Error in enhanceVirtualDressUpWithNegativePrompts:', error);
    throw error;
  }
}
