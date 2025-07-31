
'use client';

import { useState, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Loader2, Sparkles, Upload, Wand2, Shirt, Image as ImageIcon, Download, ZoomIn, ZoomOut, Footprints, Gem, Snowflake, Save, PencilLine, Move, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { performDressUp, saveImageToGallery } from '@/app/actions';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

// Custom Pants Icon
const PantsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pants">
      <path d="M12 2v7.5"/>
      <path d="M12 21a4.5 4.5 0 0 0-3-4H6a2 2 0 0 1-2-2V9.5"/>
      <path d="M12 21a4.5 4.5 0 0 1 3-4h3a2 2 0 0 0 2-2V9.5"/>
    </svg>
  );

const formSchema = z.object({
  modelPhotoDataUri: z.string().min(1, { message: 'Por favor, envie uma imagem do modelo.' }),
  garmentPhotoDataUri: z.string().min(1, { message: 'A imagem da roupa principal é obrigatória.' }),
  pantsPhotoDataUri: z.string().optional(),
  shoesPhotoDataUri: z.string().optional(),
  necklacePhotoDataUri: z.string().optional(),
  coldWeatherPhotoDataUri: z.string().optional(),
  positivePrompt: z.string(),
  negativePrompt: z.string(),
  customStylePrompt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DressUpFormProps {
  onImageSaved: (imageUrl: string) => void;
}

const defaultPositivePrompts = "alta qualidade, fotorrealista, fotografia profissional, iluminação natural, ajuste perfeito, sombreamento realista, alto detalhe, foco nítido, 8k, look completo e coeso";
const defaultNegativePrompts = "feio, deformado, borrado, má qualidade, má anatomia, membros extras, dedos extras, mãos mal desenhadas, pés mal desenhadas, rosto mal desenhado, fora de quadro, azulejos, desfigurado, corpo fora de quadro, marca d'água, assinatura, cortado, baixo contraste, subexposto, superexposto, arte ruim, iniciante, amador, irrealista, caricato, artefatos";

export function DressUpForm({ onImageSaved }: DressUpFormProps) {
  const { toast } = useToast();
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [pantsPreview, setPantsPreview] = useState<string | null>(null);
  const [shoesPreview, setShoesPreview] = useState<string | null>(null);
  const [necklacePreview, setNecklacePreview] = useState<string | null>(null);
  const [coldWeatherPreview, setColdWeatherPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelPhotoDataUri: '',
      garmentPhotoDataUri: '',
      pantsPhotoDataUri: '',
      shoesPhotoDataUri: '',
      necklacePhotoDataUri: '',
      coldWeatherPhotoDataUri: '',
      positivePrompt: defaultPositivePrompts,
      negativePrompt: defaultNegativePrompts,
      customStylePrompt: '',
    },
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({
        title: 'Deslogado com sucesso!',
        description: 'Você foi desconectado.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao deslogar.',
        variant: 'destructive',
      });
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof FormValues) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue(field, dataUri);
        
        switch (field) {
            case 'modelPhotoDataUri':
                setModelPreview(dataUri);
                break;
            case 'garmentPhotoDataUri':
                setGarmentPreview(dataUri);
                break;
            case 'pantsPhotoDataUri':
                setPantsPreview(dataUri);
                break;
            case 'shoesPhotoDataUri':
                setShoesPreview(dataUri);
                break;
            case 'necklacePhotoDataUri':
                setNecklacePreview(dataUri);
                break;
            case 'coldWeatherPhotoDataUri':
                setColdWeatherPreview(dataUri);
                break;
        }
        form.clearErrors(field);
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
      link.download = 'look-completo.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveToGallery = async () => {
    if (!generatedImage) return;

    setIsSaving(true);
    const result = await saveImageToGallery({ imageDataUri: generatedImage });
    setIsSaving(false);

    if (result.success && result.imageUrl) {
      toast({
        title: 'Salvo!',
        description: 'Seu look foi salvo na galeria.',
        variant: 'default',
      });
      onImageSaved(result.imageUrl);
    } else {
      toast({
        title: 'Erro ao Salvar',
        description: result.error || 'Não foi possível salvar a imagem.',
        variant: 'destructive',
      });
    }
  };

  const handleUseAsBase = () => {
    if (generatedImage) {
      form.setValue('modelPhotoDataUri', generatedImage);
      setModelPreview(generatedImage);
      toast({
        title: 'Imagem Definida!',
        description: 'O resultado anterior agora é a imagem base para um novo look.',
      });
    }
  };

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        if (zoom > 1) {
            setIsDragging(true);
            setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        if (isDragging && imageRef.current) {
            const newX = e.clientX - startDrag.x;
            const newY = e.clientY - startDrag.y;
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        setIsDragging(false);
    };
    
    const handleMouseLeave = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const resetZoomAndPosition = () => {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }

  const ImageUpload = ({ fieldName, preview, label, icon }: { fieldName: keyof FormValues, preview: string | null, label: string, icon: React.ReactNode }) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem className="w-full">
          <FormLabel className="flex items-center gap-2 text-lg font-semibold"><div className="text-secondary">{icon}</div>{label}</FormLabel>
          <FormControl>
            <Card className="aspect-[4/5] w-full relative group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-muted/20">
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
                onChange={(e) => handleFileChange(e, fieldName)}
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
    <>
      <div className="flex justify-end mb-8">
        <Button onClick={handleLogout} variant="outline">
          Sair
        </Button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <Card className="shadow-xl bg-gradient-to-br from-card to-muted/20 border-2 border-transparent hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">
              <Wand2/>
              Crie Seu Look Completo
            </CardTitle>
            <CardDescription>
              Envie a foto do(a) modelo e as peças para gerar um look completo. A roupa principal é obrigatória.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <ImageUpload fieldName="modelPhotoDataUri" preview={modelPreview} label="Imagem do(a) Modelo" icon={<ImageIcon />} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <ImageUpload fieldName="garmentPhotoDataUri" preview={garmentPreview} label="Roupa (Topo)" icon={<Shirt />} />
                  <ImageUpload fieldName="pantsPhotoDataUri" preview={pantsPreview} label="Calça (Opcional)" icon={<PantsIcon />} />
                  <ImageUpload fieldName="coldWeatherPhotoDataUri" preview={coldWeatherPreview} label="Casaco (Opcional)" icon={<Snowflake />} />
                  <ImageUpload fieldName="shoesPhotoDataUri" preview={shoesPreview} label="Sapatos (Opcional)" icon={<Footprints />} />
                
                  <div className="col-span-2 md:col-span-2">
                    <ImageUpload fieldName="necklacePhotoDataUri" preview={necklacePreview} label="Acessório (Opcional)" icon={<Gem />} />
                  </div>

                  <div className="col-span-2 md:col-span-2">
                     <FormField
                        control={form.control}
                        name="customStylePrompt"
                        render={({ field }) => (
                          <FormItem className="h-full flex flex-col">
                            <FormLabel className="flex items-center gap-2 text-lg font-semibold"><div className="text-secondary"><PencilLine /></div>Estilo Personalizado</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ex: cabelo loiro, maquiagem leve, fundo de estúdio"
                                    className="resize-none flex-grow"
                                    {...field}
                                    />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:scale-105 transition-transform" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando Look Completo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Look Completo
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <Card className="shadow-lg sticky top-8 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Resultado do Look</CardTitle>
            <CardDescription>O resultado gerado com o look completo aparecerá aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/5] w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/20 relative group">
              {isLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <p className="font-medium text-lg">A IA está montando o look...</p>
                </div>
              ) : generatedImage ? (
                <>
                  <Image src={generatedImage} alt="Look gerado" layout="fill" objectFit="contain" className="p-2" data-ai-hint="fashion model full body" />
                  <Dialog onOpenChange={(open) => !open && resetZoomAndPosition()}>
                     <DialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                         <ZoomIn className="h-6 w-6" />
                       </Button>
                     </DialogTrigger>
                     <DialogContent 
                        className="max-w-4xl h-auto p-4 bg-background/80 backdrop-blur-sm flex flex-col gap-4"
                        onInteractOutside={(e) => e.preventDefault()}
                      >
                        <DialogTitle className="sr-only">Zoom na Imagem do Look Gerado</DialogTitle>
                        <div 
                          className="w-full h-[75vh] overflow-hidden flex items-center justify-center"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            ref={imageRef}
                            className={cn(
                              "relative transition-transform duration-200",
                              isDragging ? 'cursor-grabbing' : (zoom > 1 ? 'cursor-grab' : 'cursor-default')
                            )}
                            style={{
                                width: '100%',
                                height: '100%',
                                transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                            }}
                          >
                            <Image 
                              src={generatedImage} 
                              alt="Look gerado em zoom" 
                              layout="fill"
                              objectFit="contain" 
                            />
                          </div>
                        </div>
                        {zoom > 1 && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white rounded-full px-4 py-2 text-sm pointer-events-none animate-pulse">
                                <Move className="h-5 w-5 text-secondary" style={{filter: 'drop-shadow(0 0 5px hsl(var(--secondary)))'}} />
                                <span className="font-semibold tracking-wider" style={{textShadow: '0 0 5px hsl(var(--secondary))'}}>Clique e arraste para mover</span>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <ZoomOut className="h-6 w-6 text-muted-foreground cursor-pointer" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} />
                            <Slider
                                value={[zoom]}
                                min={0.5}
                                max={3}
                                step={0.1}
                                onValueChange={(value) => setZoom(value[0])}
                            />
                            <ZoomIn className="h-6 w-6 text-muted-foreground cursor-pointer" onClick={() => setZoom(prev => Math.min(3, prev + 0.1))} />
                        </div>
                     </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  <Sparkles className="mx-auto h-16 w-16 mb-4 text-secondary/50" />
                  <p className="font-semibold text-lg">O look completo será mágico</p>
                  <p className="text-sm">Envie as peças e clique em "Gerar Look Completo"</p>
                </div>
              )}
            </div>
             {generatedImage && !isLoading && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <Button 
                      onClick={handleDownload}
                      className="w-full font-bold bg-gradient-to-r from-primary via-secondary to-primary/80 text-secondary-foreground hover:shadow-lg hover:scale-105 transition-transform" 
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Baixar
                    </Button>
                    <Button 
                      onClick={handleSaveToGallery}
                      disabled={isSaving}
                      className="w-full font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105 transition-transform" 
                      size="lg"
                    >
                      {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                     <Button 
                      onClick={handleUseAsBase}
                      className="w-full font-bold bg-gradient-to-r from-yellow-500 via-red-500 to-pink-600 text-secondary-foreground hover:shadow-lg hover:scale-105 transition-transform lg:col-span-1 sm:col-span-2" 
                      size="lg"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Usar como Base
                    </Button>
                 </div>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    