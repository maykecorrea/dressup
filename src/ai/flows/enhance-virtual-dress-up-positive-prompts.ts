// This is a server-side file!
'use server';

/**
 * @fileOverview Enhances the virtual dress-up process by allowing users to add positive prompts to refine the garment style and integration.
 *
 * - enhanceVirtualDressUpWithPositivePrompts - A function that enhances the virtual dress-up process with positive prompts.
 * - EnhanceVirtualDressUpWithPositivePromptsInput - The input type for the enhanceVirtualDressUpWithPositivePrompts function.
 * - EnhanceVirtualDressUpWithPositivePromptsOutput - The return type for the enhanceVirtualDressUpWithPositivePrompts function.
 */

import { openai } from '@/ai/openai';
import { dataUriToBuffer, base64ToDataUri } from '@/ai/utils';
import { z } from 'zod';

const EnhanceVirtualDressUpWithPositivePromptsInputSchema = z.object({
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
  positivePrompt: z.string().describe('Positive prompts to enhance the garment style and integration, such as high quality and realistic shading.'),
  negativePrompt: z.string().optional().describe('Negative prompts to refine results and prevent undesirable characteristics, such as ugly and deformed.'),
});
export type EnhanceVirtualDressUpWithPositivePromptsInput = z.infer<typeof EnhanceVirtualDressUpWithPositivePromptsInputSchema>;

const EnhanceVirtualDressUpWithPositivePromptsOutputSchema = z.object({
  dressedUpResult: z
    .string()
    .describe(
      'The final image of the model wearing the new outfit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type EnhanceVirtualDressUpWithPositivePromptsOutput = z.infer<typeof EnhanceVirtualDressUpWithPositivePromptsOutputSchema>;

export async function enhanceVirtualDressUpWithPositivePrompts(input: EnhanceVirtualDressUpWithPositivePromptsInput): Promise<EnhanceVirtualDressUpWithPositivePromptsOutput> {
  const { modelPhotoDataUri, garmentPhotoDataUri, positivePrompt, negativePrompt } = input;
  
  try {
    // Convert data URIs to buffers
    const modelBuffer = dataUriToBuffer(modelPhotoDataUri);
    
    const prompt = `Replace the clothing of the model in the photo with the garment shown in the reference. Consider the fit and style of the garment to realistically dress the model. Apply the following positive prompts to enhance the image: ${positivePrompt}. ${negativePrompt ? `Avoid these characteristics: ${negativePrompt}.` : ''}`;
    
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
      dressedUpResult: base64ToDataUri(result.data[0].b64_json!, 'image/png'),
    };
    
  } catch (error) {
    console.error('Error in enhanceVirtualDressUpWithPositivePrompts:', error);
    throw error;
  }
}
