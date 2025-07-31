'use server';

import { generateVirtualDressUp } from '@/ai/flows/generate-virtual-dress-up';
import { z } from 'zod';

const ActionInputSchema = z.object({
  modelPhotoDataUri: z.string().min(1, 'A imagem do modelo é obrigatória.'),
  garmentPhotoDataUri: z.string().min(1, 'A imagem da roupa principal é obrigatória.'),
  pantsPhotoDataUri: z.string().optional(),
  shoesPhotoDataUri: z.string().optional(),
  necklacePhotoDataUri: z.string().optional(),
  coldWeatherPhotoDataUri: z.string().optional(),
  positivePrompt: z.string(),
  negativePrompt: z.string(),
});

export async function performDressUp(values: z.infer<typeof ActionInputSchema>) {
  const validatedFields = ActionInputSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, error: 'Dados inválidos.' };
  }

  try {
    const result = await generateVirtualDressUp(validatedFields.data);
    if (!result.dressedUpPhotoDataUri) {
      throw new Error('A IA falhou em gerar uma imagem.');
    }
    return { success: true, url: result.dressedUpPhotoDataUri };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    return { success: false, error: errorMessage };
  }
}
