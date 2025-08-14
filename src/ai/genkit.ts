
'use server';

/**
 * @fileOverview Initializes and configures the Genkit AI instance for the application.
 * This file sets up the necessary plugins, such as Google AI, allowing other parts of the
 * application to use a shared Genkit instance for AI-powered features.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {Dotprompt} from '@genkit-ai/dotprompt';
import {googleCloud} from '@genkit-ai/google-cloud';

// Initialize Genkit with the Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    Dotprompt(),
    googleCloud(),
  ],
  logSinks: [],
  enableTracing: true,
});
