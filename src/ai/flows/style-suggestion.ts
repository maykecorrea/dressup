'use server';
/**
 * @fileOverview Style suggestion flow to recommend complementary items based on selected garment and user preferences.
 *
 * - getStyleSuggestions - A function that takes garment and user preferences as input and returns style suggestions.
 * - StyleSuggestionInput - The input type for the getStyleSuggestions function.
 * - StyleSuggestionOutput - The return type for the getStyleSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StyleSuggestionInputSchema = z.object({
  garment: z.string().describe('The selected garment for which to provide style suggestions.'),
  userPreferences: z.string().describe('The user preferences for style, e.g., colors, occasions, styles.'),
});
export type StyleSuggestionInput = z.infer<typeof StyleSuggestionInputSchema>;

const StyleSuggestionOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      item: z.string().describe('A suggested complementary item.'),
      reason: z.string().describe('The reason why this item is suggested.'),
      purchaseLink: z.string().url().describe('Link to purchase the suggested item.'),
    })
  ).describe('An array of style suggestions.'),
});
export type StyleSuggestionOutput = z.infer<typeof StyleSuggestionOutputSchema>;

export async function getStyleSuggestions(input: StyleSuggestionInput): Promise<StyleSuggestionOutput> {
  return styleSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'styleSuggestionPrompt',
  input: {schema: StyleSuggestionInputSchema},
  output: {schema: StyleSuggestionOutputSchema},
  prompt: `You are a personal stylist. Based on the selected garment and the user's preferences, suggest complementary items. Provide a reason for each suggestion and a purchase link.

Selected Garment: {{{garment}}}
User Preferences: {{{userPreferences}}}

Suggestions (item, reason, purchaseLink):
`,
});

const styleSuggestionFlow = ai.defineFlow(
  {
    name: 'styleSuggestionFlow',
    inputSchema: StyleSuggestionInputSchema,
    outputSchema: StyleSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
