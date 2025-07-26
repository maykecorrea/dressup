// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview An AI agent that dresses a model in a new outfit.
 *
 * - generateVirtualDressUp - A function that handles the virtual dress up process.
 * - GenerateVirtualDressUpInput - The input type for the generateVirtualDressUp function.
 * - GenerateVirtualDressUpOutput - The return type for the generateVirtualDressUp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVirtualDressUpInputSchema = z.object({
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
    positivePrompt: z.string().describe('Positive prompts to refine the garment style and integration.'),
    negativePrompt: z.string().describe('Negative prompts to prevent undesirable characteristics.'),
});
export type GenerateVirtualDressUpInput = z.infer<typeof GenerateVirtualDressUpInputSchema>;

const GenerateVirtualDressUpOutputSchema = z.object({
  dressedUpPhotoDataUri: z
    .string()
    .describe('The photo of the model dressed in the new outfit as a data URI.'),
});
export type GenerateVirtualDressUpOutput = z.infer<typeof GenerateVirtualDressUpOutputSchema>;

export async function generateVirtualDressUp(input: GenerateVirtualDressUpInput): Promise<GenerateVirtualDressUpOutput> {
  return generateVirtualDressUpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVirtualDressUpPrompt',
  input: {schema: GenerateVirtualDressUpInputSchema},
  output: {schema: GenerateVirtualDressUpOutputSchema},
  prompt: `You are a professional fashion stylist. You will dress the model in the provided garment, taking into account the style and fit of the garment.

Ensure the final image is high quality and realistic.

Model Photo: {{media url=modelPhotoDataUri}}
Garment Photo: {{media url=garmentPhotoDataUri}}

Positive Prompts: {{{positivePrompt}}}
Negative Prompts: {{{negativePrompt}}}

Dress the model in the garment, and return the final image as a data URI. The final image should seamlessly integrate the garment onto the model, so it looks photorealistic.`, 
});

const generateVirtualDressUpFlow = ai.defineFlow(
  {
    name: 'generateVirtualDressUpFlow',
    inputSchema: GenerateVirtualDressUpInputSchema,
    outputSchema: GenerateVirtualDressUpOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [
          {media: {url: input.modelPhotoDataUri}},
          {media: {url: input.garmentPhotoDataUri}},
          {text: `Dress the model in the garment, ensuring a seamless and photorealistic integration. ${input.positivePrompt} ${input.negativePrompt}`},
        ],

        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
        },
      });

    return {dressedUpPhotoDataUri: media.url!};
  }
);
