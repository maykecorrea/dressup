'use server';

import { getStyleSuggestions, type StyleSuggestionOutput } from '@/ai/flows/style-suggestion';
import { z } from 'zod';

const actionSchema = z.object({
  garment: z.string().min(1, { message: 'Garment selection is required.' }),
  userPreferences: z.string().min(1, { message: 'Please describe your style preferences.' }),
});

export async function getSuggestionsAction(
  prevState: any,
  formData: FormData
): Promise<{ suggestions?: StyleSuggestionOutput; error?: string; inputErrors?: any }> {
  const validatedFields = actionSchema.safeParse({
    garment: formData.get('garment'),
    userPreferences: formData.get('userPreferences'),
  });

  if (!validatedFields.success) {
    return { 
      error: 'Invalid input.',
      inputErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const suggestions = await getStyleSuggestions(validatedFields.data);
    return { suggestions };
  } catch (error) {
    console.error('Error getting style suggestions:', error);
    return { error: 'Failed to get style suggestions from our AI. Please try again later.' };
  }
}
