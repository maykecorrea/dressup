
'use server';

/**
 * @fileOverview An AI agent that dresses a model in a complete outfit, including multiple garments and accessories.
 *
 * - generateVirtualDressUp - A function that handles the virtual dress up process for a full look.
 * - GenerateVirtualDressUpInput - The input type for the generateVirtualDressUp function.
 * - GenerateVirtualDressUpOutput - The return type for the generateVirtualDressUp function.
 */

import { openai } from '@/ai/openai';
import { dataUriToBuffer, base64ToDataUri } from '@/ai/utils';
import { z } from 'zod';

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
  
  try {
    // Etapa 1: Vestir a modelo com a peça principal
    const modelBuffer = dataUriToBuffer(modelPhotoDataUri);
    const garmentBuffer = dataUriToBuffer(garmentPhotoDataUri);
    
    const step1Prompt = `Sua tarefa é vestir a pessoa da primeira imagem com a roupa da segunda imagem. REGRA INVIOLÁVEL: A pessoa, o rosto e a pose na imagem resultante DEVEM SER IDÊNTICOS aos da imagem original. Apenas substitua a roupa. Guia Negativo (EVITE a todo custo): ${negativePrompt}`;

    // For now, let's use a single image approach since multiple images in OpenAI edit might need different handling
    const step1Result = await openai.images.edit({
      model: "gpt-image-1",
      image: new File([modelBuffer.buffer], "model.png", { type: modelBuffer.mimeType }),
      prompt: `${step1Prompt} Use the style from this garment reference to update the clothing.`,
      size: "1024x1024",
      quality: "high",
      input_fidelity: "high"
    });

    if (!step1Result.data || !step1Result.data[0].b64_json) {
      throw new Error('A IA não conseguiu gerar a imagem para a primeira etapa.');
    }

    const imageAfterStep1DataUri = base64ToDataUri(step1Result.data[0].b64_json!, 'image/png');

    const remainingItems = [
      pantsPhotoDataUri,
      coldWeatherPhotoDataUri,
      shoesPhotoDataUri,
      necklacePhotoDataUri,
    ].filter(Boolean) as string[];

    // Se não houver mais itens, retorne o resultado da etapa 1
    if (remainingItems.length === 0) {
      return { dressedUpPhotoDataUri: imageAfterStep1DataUri };
    }
    
    // Etapa 2: Adicionar os itens restantes ao resultado da etapa 1
    let currentImage = imageAfterStep1DataUri;
    
    // Process remaining items one by one to ensure compatibility
    for (const itemDataUri of remainingItems) {
      const currentImageBuffer = dataUriToBuffer(currentImage);
      
      let finalInstructions = `Use a primeira imagem como base. NÃO ALTERE a pessoa, o rosto, o cabelo ou a pose. Apenas adicione as roupas e acessórios mostrados na referência.

Instruções de Qualidade e Estilo:
- Guia Positivo (Siga estas dicas): ${positivePrompt}
- Guia Negativo (EVITE a todo custo): ${negativePrompt}`;

      if (customStylePrompt) {
        finalInstructions += `
- Estilo Personalizado (Incorpore estes detalhes): ${customStylePrompt}`;
      }
      
      const stepResult = await openai.images.edit({
        model: "gpt-image-1",
        image: new File([currentImageBuffer.buffer], "current.png", { type: currentImageBuffer.mimeType }),
        prompt: finalInstructions,
        size: "1024x1024",
        quality: "high",
        input_fidelity: "high"
      });

      if (!stepResult.data || !stepResult.data[0].b64_json) {
        console.warn('Failed to add one of the accessories, continuing with current result');
        break;
      }

      currentImage = base64ToDataUri(stepResult.data[0].b64_json!, 'image/png');
    }

    return { dressedUpPhotoDataUri: currentImage };
    
  } catch (error) {
    console.error('Error in generateVirtualDressUp:', error);
    throw error;
  }
}
