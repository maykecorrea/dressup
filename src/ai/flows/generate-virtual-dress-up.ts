
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
  customStylePrompt: z.string().optional().describe('Custom user-defined prompts for additional styling, like hair, makeup, or background.'),
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
      customStylePrompt,
    } = input;
    
    const promptParts: any[] = [
        { text: "Vista a modelo da primeira imagem com as roupas das imagens seguintes. REGRA MAIS IMPORTANTE: MANTENHA O ROSTO, CORPO E CABELO DA MODELO ORIGINAL INTACTOS. Apenas troque as roupas." },
        { media: { url: modelPhotoDataUri } },
        { text: "Esta é a blusa para vestir na modelo." },
        { media: { url: garmentPhotoDataUri } },
      ];
  
      if (pantsPhotoDataUri) {
        promptParts.push({ text: "Use estas calças." });
        promptParts.push({ media: { url: pantsPhotoDataUri } });
      }
      if (coldWeatherPhotoDataUri) {
        promptParts.push({ text: "Adicione este casaco por cima da blusa." });
        promptParts.push({ media: { url: coldWeatherPhotoDataUri } });
      }
      if (shoesPhotoDataUri) {
        promptParts.push({ text: "Use estes sapatos." });
        promptParts.push({ media: { url: shoesPhotoDataUri } });
      }
      if (necklacePhotoDataUri) {
        promptParts.push({ text: "Adicione este acessório." });
        promptParts.push({ media: { url: necklacePhotoDataUri } });
      }
  
      let finalInstructions = `
  Requisitos Finais:
  - O resultado deve ser uma ÚNICA imagem fotorrealista e de alta qualidade da modelo original com o look completo.
  - O look deve ser harmonioso e bem ajustado.
  - Use estes guias para refinar o resultado:
    - Guia Positivo (Siga estas dicas): ${positivePrompt}
    - Guia Negativo (Evite estritamente isso): ${negativePrompt}
  `;
  
      if (customStylePrompt) {
          finalInstructions += `  - Estilo Personalizado (Incorpore estes detalhes): ${customStylePrompt}\n`;
      }
  
      promptParts.push({ text: finalInstructions });


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
