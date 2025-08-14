
'use server';

/**
 * @fileOverview An AI agent that generates a textual description of a garment from a photo.
 * This description is intended to be used as input for another AI model to perform a virtual dress-up.
 *
 * - generateGarmentDescription - A function that generates the description.
 * - GenerateGarmentDescriptionInput - The input type.
 * - GenerateGarmentDescriptionOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { gemini15Flash } from '@genkit-ai/googleai';

const GenerateGarmentDescriptionInputSchema = z.object({
  garmentPhotoDataUri: z
    .string()
    .describe(
      "A photo of a garment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateGarmentDescriptionInput = z.infer<typeof GenerateGarmentDescriptionInputSchema>;

const GenerateGarmentDescriptionOutputSchema = z.object({
  description: z.string().describe('A detailed description of the garment in Portuguese.'),
});
export type GenerateGarmentDescriptionOutput = z.infer<typeof GenerateGarmentDescriptionOutputSchema>;


const prompt = ai.definePrompt({
    name: 'garmentDescriptionPrompt',
    input: { schema: GenerateGarmentDescriptionInputSchema },
    output: { schema: GenerateGarmentDescriptionOutputSchema },
    model: gemini15Flash,
    prompt: `Você é um especialista em moda e personal stylist. Sua tarefa é analisar a imagem de uma peça de roupa e descrevê-la em detalhes, em português. Seja específico sobre o tipo de peça (ex: camiseta de manga curta, calça jeans skinny, vestido de verão), cor, estampa, tecido, corte e quaisquer outros detalhes relevantes.

    Imagem da peça: {{media url=garmentPhotoDataUri}}`,
});


export async function generateGarmentDescription(input: GenerateGarmentDescriptionInput): Promise<GenerateGarmentDescriptionOutput> {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('A IA não conseguiu gerar uma descrição para a peça.');
    }
    return output;
}
