
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
    
    // Etapa 1: Vestir a modelo com a peça principal. Isso melhora a preservação da identidade.
    const step1Prompt = [
        { text: "Sua tarefa é vestir a pessoa da primeira imagem com a roupa da segunda imagem. REGRA INVIOLÁVEL: A pessoa, o rosto e a pose na imagem resultante DEVEM SER IDÊNTICOS aos da imagem original. Apenas substitua a roupa." },
        { media: { url: modelPhotoDataUri } },
        { media: { url: garmentPhotoDataUri } },
        { text: `Guia Negativo (EVITE a todo custo): ${negativePrompt}` }
    ];

    const step1Result = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: step1Prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
  
    if (!step1Result.media?.url) {
        throw new Error('A IA não conseguiu gerar a imagem para a primeira etapa.');
    }

    const imageAfterStep1 = step1Result.media.url;

    const remainingItems = [
        pantsPhotoDataUri,
        coldWeatherPhotoDataUri,
        shoesPhotoDataUri,
        necklacePhotoDataUri,
    ].filter(Boolean) as string[];

    // Se não houver mais itens, retorne o resultado da etapa 1
    if (remainingItems.length === 0) {
        return { dressedUpPhotoDataUri: imageAfterStep1 };
    }
    
    // Etapa 2: Adicionar os itens restantes ao resultado da etapa 1.
    const step2Prompt: any[] = [
        { text: "Use a primeira imagem como base. NÃO ALTERE a pessoa, o rosto, o cabelo ou a pose. Apenas adicione as roupas e acessórios das imagens seguintes a ela." },
        { media: { url: imageAfterStep1 } }, // Use o resultado da etapa 1 como a nova base
    ];

    remainingItems.forEach(item => {
        step2Prompt.push({ media: { url: item } });
    });

    let finalInstructions = `
Instruções de Qualidade e Estilo:
- Guia Positivo (Siga estas dicas): ${positivePrompt}
- Guia Negativo (EVITE a todo custo): ${negativePrompt}
`;

    if (customStylePrompt) {
        finalInstructions += `  - Estilo Personalizado (Incorpore estes detalhes): ${customStylePrompt}\n`;
    }

    step2Prompt.push({ text: finalInstructions });
    
    const step2Result = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: step2Prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!step2Result.media?.url) {
      throw new Error('A IA não conseguiu gerar uma imagem para o look completo na segunda etapa.');
    }

    return { dressedUpPhotoDataUri: step2Result.media.url };
  }
);
