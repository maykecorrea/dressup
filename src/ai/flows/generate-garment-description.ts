'use server';
/**
 * @fileOverview An AI flow that analyzes a garment image and generates a textual description.
 *
 * - generateGarmentDescription - A function that handles the garment description process.
 * - GenerateGarmentDescriptionInput - The input type for the function.
 * - GenerateGarmentDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateGarmentDescriptionInputSchema = z.object({
  garmentPhotoDataUri: z
    .string()
    .describe(
      "A photo of a single garment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateGarmentDescriptionInput = z.infer<typeof GenerateGarmentDescriptionInputSchema>;

const GenerateGarmentDescriptionOutputSchema = z.object({
  description: z.string().describe('A detailed textual description of the garment in the image.'),
});
export type GenerateGarmentDescriptionOutput = z.infer<typeof GenerateGarmentDescriptionOutputSchema>;

const descriptionPrompt = ai.definePrompt({
    name: 'garmentDescriptionPrompt',
    input: { schema: GenerateGarmentDescriptionInputSchema },
    output: { schema: GenerateGarmentDescriptionOutputSchema },
    prompt: `Analise a imagem da peça de roupa fornecida e gere uma descrição detalhada e objetiva. Fale sobre o tipo de peça, cor, estampa, tecido, corte e qualquer outro detalhe relevante.

Image: {{media url=garmentPhotoDataUri}}`,
});

const generateGarmentDescriptionFlow = ai.defineFlow(
  {
    name: 'generateGarmentDescriptionFlow',
    inputSchema: GenerateGarmentDescriptionInputSchema,
    outputSchema: GenerateGarmentDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await descriptionPrompt(input);

    if (!output) {
      throw new Error('Failed to get a description from the AI model.');
    }

    return { description: output.description };
  }
);

export async function generateGarmentDescription(
  input: GenerateGarmentDescriptionInput
): Promise<GenerateGarmentDescriptionOutput> {
  return generateGarmentDescriptionFlow(input);
}
