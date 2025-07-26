// This is a server-side file!
'use server';

/**
 * @fileOverview Enhances the virtual dress-up process by allowing users to add positive prompts to refine the garment style and integration.
 *
 * - enhanceVirtualDressUpWithPositivePrompts - A function that enhances the virtual dress-up process with positive prompts.
 * - EnhanceVirtualDressUpWithPositivePromptsInput - The input type for the enhanceVirtualDressUpWithPositivePrompts function.
 * - EnhanceVirtualDressUpWithPositivePromptsOutput - The return type for the enhanceVirtualDressUpWithPositivePrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
      'The final image of the model wearing the new outfit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type EnhanceVirtualDressUpWithPositivePromptsOutput = z.infer<typeof EnhanceVirtualDressUpWithPositivePromptsOutputSchema>;

export async function enhanceVirtualDressUpWithPositivePrompts(input: EnhanceVirtualDressUpWithPositivePromptsInput): Promise<EnhanceVirtualDressUpWithPositivePromptsOutput> {
  return enhanceVirtualDressUpWithPositivePromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceVirtualDressUpWithPositivePromptsPrompt',
  input: {schema: EnhanceVirtualDressUpWithPositivePromptsInputSchema},
  output: {schema: EnhanceVirtualDressUpWithPositivePromptsOutputSchema},
  prompt: `You are a professional stylist creating a virtual dressing room experience.

  Instructions:
  1.  Replace the clothing of the model in the model photo with the garment in the garment photo.
  2.  Consider the fit and style of the garment to realistically dress the model.
  3.  Apply the following positive prompts to enhance the image: {{{positivePrompt}}}.
  4.  If negative prompts are provided, avoid those characteristics: {{{negativePrompt}}}.

  Model Photo: {{media url=modelPhotoDataUri}}
  Garment Photo: {{media url=garmentPhotoDataUri}}

  Output the final image of the model wearing the new outfit.
  `,
});

const enhanceVirtualDressUpWithPositivePromptsFlow = ai.defineFlow(
  {
    name: 'enhanceVirtualDressUpWithPositivePromptsFlow',
    inputSchema: EnhanceVirtualDressUpWithPositivePromptsInputSchema,
    outputSchema: EnhanceVirtualDressUpWithPositivePromptsOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [
          {media: {url: input.modelPhotoDataUri}},
          {media: {url: input.garmentPhotoDataUri}},
          {text: `Replace the model's clothing with the provided garment. Positive prompts: ${input.positivePrompt}. Negative prompts: ${input.negativePrompt || 'none'}.`}
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

    return {
      dressedUpResult: media!.url,
    };
  }
);
