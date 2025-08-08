
'use server';

/**
 * @fileOverview An AI agent that dresses a model in a complete outfit, including multiple garments and accessories.
 *
 * - generateVirtualDressUp - A function that handles the virtual dress up process for a full look.
 * - GenerateVirtualDressUpInput - The input type for the generateVirtualDressUp function.
 * - GenerateVirtualDressUpOutput - The return type for the generateVirtualDressUp function.
 */

import { openai } from '@/ai/openai';
import { dataUriToTempFile, base64ToDataUri } from '@/ai/utils';
import { z } from 'zod';
import * as fs from 'fs';

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
    const step1TempFiles: Array<{ filePath: string; cleanup: () => void }> = [];
    
    // Convert model and main garment to temp files
    const modelFile = dataUriToTempFile(modelPhotoDataUri);
    const garmentFile = dataUriToTempFile(garmentPhotoDataUri);
    step1TempFiles.push(modelFile, garmentFile);
    
    const step1Prompt = `Sua tarefa é vestir a pessoa da primeira imagem com a roupa da segunda imagem. REGRA INVIOLÁVEL: A pessoa, o rosto e a pose na imagem resultante DEVEM SER IDÊNTICOS aos da imagem original. Apenas substitua a roupa. Guia Negativo (EVITE a todo custo): ${negativePrompt}`;

    const step1Result = await openai.images.edit({
      model: "gpt-image-1",
      image: [
        fs.createReadStream(modelFile.filePath),
        fs.createReadStream(garmentFile.filePath)
      ],
      prompt: step1Prompt,
      size: "1024x1024",
      quality: "high",
      input_fidelity: "high"
    });

    // Cleanup step 1 temp files
    step1TempFiles.forEach(file => file.cleanup());

    if (!step1Result.data[0].b64_json) {
      throw new Error('A IA não conseguiu gerar a imagem para a primeira etapa.');
    }

    const imageAfterStep1DataUri = base64ToDataUri(step1Result.data[0].b64_json, 'image/png');

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
    const step2TempFiles: Array<{ filePath: string; cleanup: () => void }> = [];
    
    // Convert step 1 result and remaining items to temp files
    const step1ResultFile = dataUriToTempFile(imageAfterStep1DataUri);
    step2TempFiles.push(step1ResultFile);
    
    const remainingItemFiles = remainingItems.map(item => {
      const file = dataUriToTempFile(item);
      step2TempFiles.push(file);
      return file;
    });

    let finalInstructions = `Use a primeira imagem como base. NÃO ALTERE a pessoa, o rosto, o cabelo ou a pose. Apenas adicione as roupas e acessórios das imagens seguintes a ela.

Instruções de Qualidade e Estilo:
- Guia Positivo (Siga estas dicas): ${positivePrompt}
- Guia Negativo (EVITE a todo custo): ${negativePrompt}`;

    if (customStylePrompt) {
      finalInstructions += `
- Estilo Personalizado (Incorpore estes detalhes): ${customStylePrompt}`;
    }

    const step2Images = [
      fs.createReadStream(step1ResultFile.filePath),
      ...remainingItemFiles.map(file => fs.createReadStream(file.filePath))
    ];
    
    const step2Result = await openai.images.edit({
      model: "gpt-image-1",
      image: step2Images,
      prompt: finalInstructions,
      size: "1024x1024",
      quality: "high",
      input_fidelity: "high"
    });

    // Cleanup step 2 temp files
    step2TempFiles.forEach(file => file.cleanup());

    if (!step2Result.data[0].b64_json) {
      throw new Error('A IA não conseguiu gerar uma imagem para o look completo na segunda etapa.');
    }

    return { dressedUpPhotoDataUri: base64ToDataUri(step2Result.data[0].b64_json, 'image/png') };
    
  } catch (error) {
    console.error('Error in generateVirtualDressUp:', error);
    throw error;
  }
}
