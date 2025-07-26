'use server';

/**
 * @fileOverview This flow enhances the virtual dress-up process by allowing users to add negative prompts
 * to refine the results and prevent undesirable characteristics.
 *
 * - enhanceVirtualDressUpWithNegativePrompts - A function that applies a garment image to a model image, using negative prompts for refinement.
 * - EnhanceVirtualDressUpWithNegativePromptsInput - The input type for the enhanceVirtualDressUpWithNegativePrompts function.
 * - EnhanceVirtualDressUpWithNegativePromptsOutput - The return type for the enhanceVirtualDressUpWithNegativePrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return enhanceVirtualDressUpWithNegativePromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceVirtualDressUpWithNegativePromptsPrompt',
  input: {schema: EnhanceVirtualDressUpWithNegativePromptsInputSchema},
  output: {schema: EnhanceVirtualDressUpWithNegativePromptsOutputSchema},
  prompt: `You are a virtual stylist. You will dress up a model in a provided garment, adhering to positive and negative prompts to refine the output.

Model Photo:
{{media url=modelPhotoDataUri}}

Garment Photo:
{{media url=garmentPhotoDataUri}}

Instructions: Replace the clothing on the model in the first image with the garment in the second image. Consider the style and fit of the garment.

{{#if positivePrompt}}
Positive Prompt: {{{positivePrompt}}}
{{/if}}

{{#if negativePrompt}}
Negative Prompt: {{{negativePrompt}}}
{{/if}}

Output: A single image of the model wearing the new garment, incorporating the instructions and prompts. Focus on creating a seamless and realistic result, avoiding the negative prompts. Return the final result as a data URI.
`,
});

const enhanceVirtualDressUpWithNegativePromptsFlow = ai.defineFlow(
  {
    name: 'enhanceVirtualDressUpWithNegativePromptsFlow',
    inputSchema: EnhanceVirtualDressUpWithNegativePromptsInputSchema,
    outputSchema: EnhanceVirtualDressUpWithNegativePromptsOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: [
        {media: {url: input.modelPhotoDataUri}},
        {media: {url: input.garmentPhotoDataUri}},
        {text: `Instructions: Replace the clothing on the model in the first image with the garment in the second image. Consider the style and fit of the garment.

${input.positivePrompt ? `Positive Prompt: ${input.positivePrompt}` : ''}
${input.negativePrompt ? `Negative Prompt: ${input.negativePrompt}` : ''}`}
      ],
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {dressedUpPhotoDataUri: media.url!};
  }
);
