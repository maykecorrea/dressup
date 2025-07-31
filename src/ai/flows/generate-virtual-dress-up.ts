'use server';

/**
 * @fileOverview An AI agent that dresses a model in a complete outfit, including multiple garments and accessories.
 *
 * - generateVirtualDressUp - A function that handles the virtual dress up process for a full look.
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
      "A photo of the main garment, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  pantsPhotoDataUri: z
    .string()
    .optional()
    .describe(
        "Optional: A photo of pants, as a data URI."
    ),
  shoesPhotoDataUri: z
    .string()
    .optional()
    .describe(
      "Optional: A photo of shoes, as a data URI."
    ),
  necklacePhotoDataUri: z
    .string()
    .optional()
    .describe(
      "Optional: A photo of a necklace or accessory, as a data URI."
    ),
  coldWeatherPhotoDataUri: z
    .string()
    .optional()
    .describe(
      "Optional: A photo of a cold-weather item like a jacket or coat, as a data URI."
    ),
  positivePrompt: z.string().describe('Positive prompts to refine the garment style and integration.'),
  negativePrompt: z.string().describe('Negative prompts to prevent undesirable characteristics.'),
});
export type GenerateVirtualDressUpInput = z.infer<typeof GenerateVirtualDressUpInputSchema>;

const GenerateVirtualDressUpOutputSchema = z.object({
  dressedUpPhotoDataUri: z
    .string()
    .describe('The photo of the model dressed in the new complete outfit, as a data URI.'),
});
export type GenerateVirtualDressUpOutput = z.infer<typeof GenerateVirtualDressUpOutputSchema>;

export async function generateVirtualDressUp(input: GenerateVirtualDressUpInput): Promise<GenerateVirtualDressUpOutput> {
  return generateVirtualDressUpFlow(input);
}

const generateVirtualDressUpFlow = ai.defineFlow(
  {
    name: 'generateVirtualDressUpFlow',
    inputSchema: GenerateVirtualDressUpInputSchema,
    outputSchema: GenerateVirtualDressUpOutputSchema,
  },
  async (input) => {
    const {
      modelPhotoDataUri,
      garmentPhotoDataUri,
      pantsPhotoDataUri,
      shoesPhotoDataUri,
      necklacePhotoDataUri,
      coldWeatherPhotoDataUri,
      positivePrompt,
      negativePrompt,
    } = input;

    const promptParts: any[] = [
      { media: { url: modelPhotoDataUri } },
      { text: "Você é um estilista de moda especialista. Sua tarefa é vestir a modelo da primeira imagem com as peças de roupa e acessórios fornecidos nas imagens seguintes para criar um look completo, coeso e estiloso." },
      { text: "\nPeça Principal (Topo):" },
      { media: { url: garmentPhotoDataUri } },
    ];

    if (pantsPhotoDataUri) {
        promptParts.push({ text: "\nCalça:" });
        promptParts.push({ media: { url: pantsPhotoDataUri } });
    }
    if (coldWeatherPhotoDataUri) {
        promptParts.push({ text: "\nCasaco/Jaqueta:" });
        promptParts.push({ media: { url: coldWeatherPhotoDataUri } });
    }
    if (shoesPhotoDataUri) {
        promptParts.push({ text: "\nSapatos:" });
        promptParts.push({ media: { url: shoesPhotoDataUri } });
    }
    if (necklacePhotoDataUri) {
        promptParts.push({ text: "\nAcessório (Colar/etc):" });
        promptParts.push({ media: { url: necklacePhotoDataUri } });
    }
    
    promptParts.push({ text: `\nInstruções Adicionais: Vista a modelo com todas as peças fornecidas, garantindo que o resultado final seja uma imagem única, fotorealista e de alta qualidade. O look deve parecer natural e bem ajustado ao corpo da modelo. Considere o estilo de todas as peças para criar uma composição harmoniosa.`});
    promptParts.push({ text: `\nPrompts Positivos (use como guia): ${positivePrompt}` });
    promptParts.push({ text: `\nPrompts Negativos (evite estritamente): ${negativePrompt}` });
    promptParts.push({ text: `\nRetorne apenas a imagem final da modelo com o look completo.` });


    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('A IA não conseguiu gerar uma imagem para o look completo.');
    }

    return { dressedUpPhotoDataUri: media.url };
  }
);
