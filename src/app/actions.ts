'use server';

import { generateVirtualDressUp } from '@/ai/flows/generate-virtual-dress-up';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

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

const SaveImageInputSchema = z.object({
  imageDataUri: z.string().min(1, 'A imagem é obrigatória.'),
});

export async function saveImageToGallery(values: z.infer<typeof SaveImageInputSchema>) {
    const validatedFields = SaveImageInputSchema.safeParse(values);
    if (!validatedFields.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const { imageDataUri } = validatedFields.data;
        
        const base64Data = imageDataUri.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const uploadsDir = path.join(process.cwd(), 'public/uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filename = `${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(filepath, imageBuffer);
        
        revalidatePath('/gallery');
        return { success: true, message: 'Imagem salva na galeria!' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado ao salvar a imagem.';
        return { success: false, error: errorMessage };
    }
}

export async function getGalleryImages() {
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      return [];
    }
    const files = await fs.promises.readdir(uploadsDir);
    // Sort files by creation time, newest first
    return files
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(uploadsDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time)
      .map(file => `/uploads/${file.name}`);
  } catch (error) {
    console.error("Error reading gallery images:", error);
    return [];
  }
}

const DeleteImageInputSchema = z.object({
    imageUrl: z.string().min(1, 'O caminho da imagem é obrigatório.'),
});

export async function deleteImage(values: z.infer<typeof DeleteImageInputSchema>) {
    const validatedFields = DeleteImageInputSchema.safeParse(values);
    if (!validatedFields.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const { imageUrl } = validatedFields.data;
        const filename = path.basename(imageUrl);
        const uploadsDir = path.join(process.cwd(), 'public/uploads');
        const filepath = path.join(uploadsDir, filename);

        // Security check: ensure the file is within the uploads directory
        if (path.dirname(filepath) !== uploadsDir) {
            return { success: false, error: 'Caminho de arquivo inválido.' };
        }

        if (fs.existsSync(filepath)) {
            await fs.promises.unlink(filepath);
            revalidatePath('/gallery');
            return { success: true, message: 'Imagem excluída com sucesso!' };
        } else {
            return { success: false, error: 'Imagem não encontrada.' };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado ao excluir a imagem.';
        return { success: false, error: errorMessage };
    }
}
