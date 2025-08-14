'use server';

import { generateVirtualDressUp } from '@/ai/flows/generate-virtual-dress-up';
import { generateGarmentDescription } from '@/ai/flows/generate-garment-description';
import { z } from 'zod';

const GenerateDescriptionSchema = z.object({
    garmentPhotoDataUri: z.string().min(1, 'A imagem da roupa é obrigatória.'),
});

export async function performGenerateDescription(values: z.infer<typeof GenerateDescriptionSchema>) {
    const validatedFields = GenerateDescriptionSchema.safeParse(values);
    if (!validatedFields.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const result = await generateGarmentDescription(validatedFields.data);
        if (!result.description) {
            throw new Error('A IA falhou em gerar uma descrição.');
        }
        return { success: true, description: result.description };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
        return { success: false, error: errorMessage };
    }
}


const ActionInputSchema = z.object({
  modelPhotoDataUri: z.string().min(1, 'A imagem do modelo é obrigatória.'),
  garmentPhotoDataUri: z.string().min(1, 'A imagem da roupa principal é obrigatória.'),
  garmentDescription: z.string().min(1, 'A descrição da roupa é obrigatória.'),
  positivePrompt: z.string(),
  negativePrompt: z.string(),
  customStylePrompt: z.string().optional(),
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
