'use server';

import { generateVirtualDressUp } from '@/ai/flows/generate-virtual-dress-up';
import { z } from 'zod';

const ActionInputSchema = z.object({
  modelPhotoDataUri: z.string().min(1, 'Model image is required.'),
  garmentPhotoDataUri: z.string().min(1, 'Garment image is required.'),
  positivePrompt: z.string(),
  negativePrompt: z.string(),
});

export async function performDressUp(values: z.infer<typeof ActionInputSchema>) {
  const validatedFields = ActionInputSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, error: 'Invalid input.' };
  }

  try {
    const result = await generateVirtualDressUp(validatedFields.data);
    if (!result.dressedUpPhotoDataUri) {
      throw new Error('AI failed to generate an image.');
    }
    return { success: true, url: result.dressedUpPhotoDataUri };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
}
