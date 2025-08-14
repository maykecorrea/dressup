import { config } from 'dotenv';
config();

// Import OpenAI flows for development
import '@/ai/flows/enhance-virtual-dress-up-positive-prompts.ts';
import '@/ai/flows/enhance-virtual-dress-up-negative-prompts.ts';
import '@/ai/flows/generate-virtual-dress-up.ts';
