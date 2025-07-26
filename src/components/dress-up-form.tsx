'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Loader2, Sparkles, Upload, Wand2, Shirt, Image as ImageIcon, Download, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { performDressUp } from '@/app/actions';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const formSchema = z.object({
  modelPhotoDataUri: z.string().min(1, { message: 'Por favor, envie uma imagem do modelo.' }),
  garmentPhotoDataUri: z.string().min(1, { message: 'Por favor, envie uma imagem da roupa.' }),
  positivePrompt: z.string(),
  negativePrompt: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultPositivePrompts = "alta qualidade, fotorrealista, fotografia profissional, iluminação natural, ajuste perfeito, sombreamento realista, alto detalhe, foco nítido, 8k";
const defaultNegativePrompts = "feio, deformado, borrado, má qualidade, má anatomia, membros extras, dedos extras, mãos mal desenhadas, pés mal desenhados, rosto mal desenhado, fora de quadro, azulejos, desfigurado, corpo fora de quadro, marca d'água, assinatura, cortado, baixo contraste, subexposto, superexposto, arte ruim, iniciante, amador, irrealista, caricato, artefatos";

export function DressUpForm() {
  const { toast } = useToast();
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelPhotoDataUri: '',
      garmentPhotoDataUri: '',
      positivePrompt: defaultPositivePrompts,
      negativePrompt: defaultNegativePrompts,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'model' | 'garment') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        if (field === 'model') {
          setModelPreview(dataUri);
          form.setValue('modelPhotoDataUri', dataUri);
        } else {
          setGarmentPreview(dataUri);
          form.setValue('garmentPhotoDataUri', dataUri);
        }
        form.clearErrors(field === 'model' ? 'modelPhotoDataUri' : 'garmentPhotoDataUri');
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setGeneratedImage(null);
    const result = await performDressUp(values);
    setIsLoading(false);

    if (result.success) {
      setGeneratedImage(result.url);
      toast({
        title: 'Sucesso!',
        description: 'Seu novo look foi gerado.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Algo deu errado.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'obra-prima.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const ImageUpload = ({ fieldName, preview, label, icon }: { fieldName: 'modelPhotoDataUri' | 'garmentPhotoDataUri', preview: string | null, label: string, icon: React.ReactNode }) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem className="w-full">
          <FormLabel className="flex items-center gap-2 text-lg font-semibold"><div className="text-primary">{icon}</div>{label}</FormLabel>
          <FormControl>
            <Card className="aspect-square w-full relative group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center text-center text-muted-foreground opacity-100 group-hover:opacity-0 transition-opacity z-10 p-4 rounded-lg">
                 <Upload className="h-10 w-10 mb-2" />
                 <p className="font-semibold">Clique para enviar</p>
                 <p className="text-xs">PNG, JPG ou WEBP</p>
              </div>
              {preview && <Image src={preview} alt="Pré-visualização" layout="fill" objectFit="contain" className="p-2"/>}
              <Input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={(e) => handleFileChange(e, fieldName === 'modelPhotoDataUri' ? 'model' : 'garment')}
                disabled={isLoading}
              />
            </Card>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card className="shadow-xl border-2 border-transparent hover:border-primary/50 transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-headline">
            <Wand2 className="text-primary" />
            Crie Seu Look
          </CardTitle>
          <CardDescription>
            Envie suas imagens para gerar o provador virtual.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ImageUpload fieldName="modelPhotoDataUri" preview={modelPreview} label="Imagem do(a) Modelo" icon={<ImageIcon />} />
                <ImageUpload fieldName="garmentPhotoDataUri" preview={garmentPreview} label="Imagem da Roupa" icon={<Shirt />} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full font-bold" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Look
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card className="shadow-lg sticky top-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Resultado</CardTitle>
          <CardDescription>O resultado gerado aparecerá aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-square w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/20 relative group">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="font-medium text-lg">A IA está fazendo sua mágica...</p>
              </div>
            ) : generatedImage ? (
              <>
                <Image src={generatedImage} alt="Look gerado" width={1024} height={1024} className="object-contain w-full h-full" data-ai-hint="fashion model" />
                <Dialog>
                   <DialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                       <ZoomIn className="h-6 w-6" />
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="max-w-4xl h-auto p-2">
                      <Image src={generatedImage} alt="Look gerado em zoom" width={1200} height={1200} className="rounded-md object-contain w-full h-full" />
                   </DialogContent>
                </Dialog>
              </>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                <Sparkles className="mx-auto h-16 w-16 mb-4 text-primary/50" />
                <p className="font-semibold text-lg">O resultado será mágico</p>
                <p className="text-sm">Preencha o formulário e clique em "Gerar Look"</p>
              </div>
            )}
          </div>
           {generatedImage && !isLoading && (
              <Button 
                onClick={handleDownload}
                className="w-full mt-4 font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 transition-transform" 
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Baixar Obra Prima!
              </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
