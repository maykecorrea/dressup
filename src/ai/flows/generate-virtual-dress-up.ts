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
    
    // Base prompt text
    let promptText = `Tarefa: Você é um assistente de IA especialista em moda. Sua tarefa é vestir a modelo da "Imagem da Modelo" com um look completo usando as peças fornecidas. É crucial que você SUBSTITUA TODAS as roupas que a modelo está vestindo pelas novas peças.

REGRA MAIS IMPORTANTE: MANTENHA O ROSTO E O CORPO DA MODELO ORIGINAL. O rosto, cabelo e características físicas da modelo na "Imagem da Modelo" NÃO DEVEM SER ALTERADOS. Apenas as roupas devem ser trocadas.

Instruções passo a passo:
1.  Comece com a "Imagem da Modelo".
2.  Vista a modelo com a "Roupa (Topo)".
`;

    const promptParts: any[] = [
      { media: { url: modelPhotoDataUri } },
      { media: { url: garmentPhotoDataUri } },
    ];

    if (pantsPhotoDataUri) {
      promptText += '3. Adicione a "Calça".\n';
      promptParts.push({ media: { url: pantsPhotoDataUri } });
    }
    if (coldWeatherPhotoDataUri) {
      promptText += '4. Se for um casaco ou jaqueta, coloque-o sobre a "Roupa (Topo)".\n';
      promptParts.push({ media: { url: coldWeatherPhotoDataUri } });
    }
    if (shoesPhotoDataUri) {
      promptText += '5. Calce os "Sapatos" na modelo.\n';
      promptParts.push({ media: { url: shoesPhotoDataUri } });
    }
    if (necklacePhotoDataUri) {
      promptText += '6. Adicione o "Acessório" (colar, etc.) de forma visível.\n';
      promptParts.push({ media: { url: necklacePhotoDataUri } });
    }

    promptText += `
Requisitos Finais:
- O resultado deve ser uma ÚNICA imagem da modelo com o look completo, mantendo o rosto e corpo originais.
- O look deve ser harmonioso, realista e bem ajustado. Mantenha as proporções corretas.
- A imagem final deve ser fotorrealista e de alta qualidade.
- Use estes guias para refinar o resultado:
  - Guia Positivo (Siga estas dicas): ${positivePrompt}
  - Guia Negativo (Evite estritamente isso): ${negativePrompt}
`;

    if (customStylePrompt) {
        promptText += `  - Estilo Personalizado (Incorpore estes detalhes): ${customStylePrompt}\n`;
    }

    promptText += `
Imagens de Referência:
- Imagem da Modelo: (primeira imagem)
- Roupa (Topo): (segunda imagem)
`;

    let imageCounter = 2;
    if (pantsPhotoDataUri) promptText += `- Calça: (imagem ${++imageCounter})\n`;
    if (coldWeatherPhotoDataUri) promptText += `- Casaco/Jaqueta: (imagem ${++imageCounter})\n`;
    if (shoesPhotoDataUri) promptText += `- Sapatos: (imagem ${++imageCounter})\n`;
    if (necklacePhotoDataUri) promptText += `- Acessório: (imagem ${++imageCounter})\n`;

    promptParts.unshift({ text: promptText });


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
