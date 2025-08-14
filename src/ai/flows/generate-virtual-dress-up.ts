
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Tipos de entrada/saída
 */
const GenerateVirtualDressUpInputSchema = z.object({
  modelPhotoDataUri: z.string().min(1).describe("Data URI da foto da modelo."),
  garmentPhotoDataUri: z.string().optional().describe("Data URI da peça (opcional)."),
  garmentDescription: z.string().min(3).describe("Descrição textual detalhada da peça."),
});
export type GenerateVirtualDressUpInput = z.infer<typeof GenerateVirtualDressUpInputSchema>;

const GenerateVirtualDressUpOutputSchema = z.object({
  dressedUpPhotoDataUri: z.string().describe('Data URI da imagem resultante.'),
});
export type GenerateVirtualDressUpOutput = z.infer<typeof GenerateVirtualDressUpOutputSchema>;

/**
 * Util: extrai mimeType e base64 de um data URI
 */
function parseDataUri(dataUri: string): { mime: string; base64: string } {
  // Formato esperado: data:<mime>;base64,<dados>
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUri);
  if (!match) {
    throw new Error('Data URI inválido: ' + dataUri.slice(0, 30) + '...');
  }
  return { mime: match[1], base64: match[2] };
}

/**
 * Gera instrução para o modelo de geração de imagem baseado nos insumos.
 */
function buildInstruction(garmentDescription: string, hasGarmentImage: boolean) {
  if (hasGarmentImage) {
    return `INSTRUÇÃO:
Use a primeira imagem como base (modelo) e a segunda como referência visual da peça.
Vista a modelo com a peça descrita: ${garmentDescription}.
Preserve o rosto, a pele, a pose, a iluminação, as mãos e o fundo da foto original da modelo.
O resultado deve ser fotorrealista, com costuras e texturas naturais, sem distorcer proporções.`;
  }
  return `INSTRUÇÃO:
Use a imagem da modelo como base e vista-a com: ${garmentDescription}.
Preserve o rosto, a pele, a pose, a iluminação, as mãos e o fundo da foto original da modelo.
Resultado: fotorrealista, com textura coerente, sem alterar a anatomia.`;
}

/**
 * Função principal
 */
export async function generateVirtualDressUp(
  rawInput: GenerateVirtualDressUpInput
): Promise<GenerateVirtualDressUpOutput> {
  // 1. Validação
  const input = GenerateVirtualDressUpInputSchema.parse(rawInput);
  const { modelPhotoDataUri, garmentPhotoDataUri, garmentDescription } = input;

  try {
    // 2. Parse das imagens para extrair o base64
    const modelParsed = parseDataUri(modelPhotoDataUri);
    const garmentParsed = garmentPhotoDataUri ? parseDataUri(garmentPhotoDataUri) : undefined;

    // 3. Montar partes multimodais no formato correto { inlineData: { data: ..., mimeType: ... } }
    const instruction = buildInstruction(garmentDescription, !!garmentParsed);
    console.log('[generateVirtualDressUp] Instruction:', instruction);

    const promptParts = [
      {
        inlineData: {
          data: modelParsed.base64,
          mimeType: modelParsed.mime,
        },
      },
      ...(garmentParsed
        ? [
            {
              inlineData: {
                data: garmentParsed.base64,
                mimeType: garmentParsed.mime,
              },
            },
          ]
        : []),
      {
        text: instruction,
      },
    ];

    // 4. Chamada ao gerador de imagem
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
          responseModalities: ['IMAGE'],
      },
    });

    // 5. Extrair a mídia retornada
    const dataUriOut = media?.url;

    if (!dataUriOut) {
      console.error('[generateVirtualDressUp] A API não retornou uma imagem na resposta.');
      throw new Error('A API retornou um formato de imagem inesperado.');
    }

    // 6. Validação de saída
    GenerateVirtualDressUpOutputSchema.parse({ dressedUpPhotoDataUri: dataUriOut });

    return { dressedUpPhotoDataUri: dataUriOut };

  } catch (e) {
    console.error('[generateVirtualDressUp] ERRO NA GERAÇÃO DE IMAGEM:', e);
    // Lança um erro mais genérico para o front-end, mas mantém o detalhe no log do servidor.
    if (e instanceof Error) {
        throw new Error(`Falha na API: ${e.message}`);
    }
    throw new Error('Falha técnica ao chamar o gerador de imagem (detalhes no log do servidor).');
  }
}
