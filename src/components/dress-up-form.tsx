
'use client';

import { useState, useRef, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import { Loader2, Sparkles, Upload, Wand2, Shirt, Image as ImageIcon, Download, Save, Trash2, Footprints, Gem, Snowflake, Info, FileText, RefreshCw, Eye, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { performDressUp, performGenerateDescription } from '@/app/actions';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import imageCompression from 'browser-image-compression';


// Custom Pants Icon
const PantsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pants">
      <path d="M12 2v7.5"/><path d="M12 21a4.5 4.5 0 0 0-3-4H6a2 2 0 0 1-2-2V9.5"/><path d="M12 21a4.5 4.5 0 0 1 3-4h3a2 2 0 0 0 2-2V9.5"/>
    </svg>
);

interface DressUpFormProps {
  onImageSaved: () => void;
}

type GarmentType = 'top' | 'pants' | 'coat' | 'shoes' | 'accessory' | 'completeLook';

interface GarmentState {
    preview: string | null;
    description: string | null;
    result: string | null;
    isGeneratingDescription: boolean;
    isGeneratingLook: boolean;
}

const initialGarmentState: GarmentState = {
    preview: null,
    description: null,
    result: null,
    isGeneratingDescription: false,
    isGeneratingLook: false,
};

const garmentOrder: Exclude<GarmentType, 'completeLook'>[] = ['top', 'pants', 'coat', 'shoes', 'accessory'];

const garmentConfig: Record<Exclude<GarmentType, 'completeLook'>, { label: string, icon: ReactNode }> = {
    top: { label: 'Roupa (Topo)', icon: <Shirt /> },
    pants: { label: 'Calça', icon: <PantsIcon /> },
    coat: { label: 'Casaco', icon: <Snowflake /> },
    shoes: { label: 'Sapatos', icon: <Footprints /> },
    accessory: { label: 'Acessório', icon: <Gem /> },
};

interface ZoomableImageDialogProps {
    src: string;
    alt: string;
    zoom: number;
    setZoom: (value: number) => void;
}

export function DressUpForm({ onImageSaved }: DressUpFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [modelDataUri, setModelDataUri] = useState<string>('');

  const [garments, setGarments] = useState<Record<Exclude<GarmentType, 'completeLook'>, GarmentState>>({
      top: { ...initialGarmentState },
      pants: { ...initialGarmentState },
      coat: { ...initialGarmentState },
      shoes: { ...initialGarmentState },
      accessory: { ...initialGarmentState },
  });

  const [completeLookState, setCompleteLookState] = useState<GarmentState>({ ...initialGarmentState });


  const [isSaving, setIsSaving] = useState(false);
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>(['top']);

  // Low resolution warning state
  const [lowResWarning, setLowResWarning] = useState<{ open: boolean; onAccept: (() => void) | null }>({ open: false, onAccept: null });


  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: 'Deslogado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao deslogar.', variant: 'destructive' });
    }
  };

  const handleGenerateDescription = async (garmentPreview: string, type: GarmentType) => {
    if (type === 'completeLook') {
        setCompleteLookState(prev => ({...prev, isGeneratingDescription: true }));
    } else {
        setGarments(prev => ({...prev, [type]: { ...prev[type], isGeneratingDescription: true }}));
    }

    const result = await performGenerateDescription({ garmentPhotoDataUri: garmentPreview });

    if (result.success && result.description) {
        if (type === 'completeLook') {
            setCompleteLookState(prev => ({ ...prev, description: result.description, isGeneratingDescription: false }));
        } else {
            setGarments(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    description: result.description,
                    isGeneratingDescription: false,
                }
            }));
        }
        toast({ title: "Descrição Gerada!", description: "A IA analisou a peça de roupa." });
    } else {
        if (type === 'completeLook') {
            setCompleteLookState(prev => ({...prev, isGeneratingDescription: false }));
        } else {
            setGarments(prev => ({...prev, [type]: { ...prev[type], isGeneratingDescription: false }}));
        }
        toast({ title: "Erro na Descrição", description: result.error || "Algo deu errado.", variant: "destructive" });
    }
  };

  const validateImageResolution = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const minDimension = Math.min(img.naturalWidth, img.naturalHeight);
            URL.revokeObjectURL(img.src);
            resolve(minDimension >= 1080);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            resolve(false); // Consider it invalid if it fails to load
        };
    });
  };

  const processFile = (file: File, type: 'model' | GarmentType) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUri = reader.result as string;

        if (type === 'model') {
            setModelPreview(dataUri);
            setModelDataUri(dataUri);
        } else if (type === 'completeLook') {
            setCompleteLookState(prev => ({
                ...initialGarmentState,
                preview: dataUri
            }));
            handleGenerateDescription(dataUri, 'completeLook');
        } else {
            setGarments(prev => ({
                ...prev,
                [type]: {
                    ...initialGarmentState,
                    preview: dataUri,
                }
            }));
            // Automatically generate description for individual garments
            handleGenerateDescription(dataUri, type);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'model' | GarmentType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isHighRes = await validateImageResolution(file);

    const proceedWithUpload = () => processFile(file, type);

    if (!isHighRes) {
        setLowResWarning({ open: true, onAccept: proceedWithUpload });
    } else {
        proceedWithUpload();
    }

    // Clear the input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleMultipleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (i < garmentOrder.length) {
            const garmentType = garmentOrder[i];
            const isHighRes = await validateImageResolution(file);

            const proceedWithUpload = () => processFile(file, garmentType);

            if (!isHighRes) {
                 toast({ title: `Imagem ${i+1} (${file.name}) em baixa resolução!`, description: "A qualidade do resultado pode ser afetada.", variant: "destructive" });
            }
            // In multi-upload, we'll just warn and proceed. A modal for each would be too intrusive.
            proceedWithUpload();
        }
    }

    if (files.length > 0) {
        toast({
            title: `${files.length} imagem(ns) carregadas!`,
            description: "As peças foram adicionadas e as descrições estão sendo geradas."
        });
    }

    event.target.value = '';
  };


  const handleGenerateLook = async (type: Exclude<GarmentType, 'completeLook'>) => {
      const garment = garments[type];
      if (!modelDataUri) {
          toast({ title: "Erro", description: "Por favor, envie a imagem da modelo primeiro.", variant: "destructive" });
          return;
      }
      if (!garment.preview || !garment.description) {
          toast({ title: "Erro", description: "A descrição da peça ainda não foi gerada ou a imagem não foi enviada.", variant: "destructive" });
          return;
      }

      setGarments(prev => ({ ...prev, [type]: { ...prev[type], isGeneratingLook: true } }));

      const result = await performDressUp({
          modelPhotoDataUri: modelDataUri,
          garmentDescription: garment.description,
      });

      if (result.success && result.url) {
          setGarments(prev => ({ ...prev, [type]: { ...prev[type], result: result.url, isGeneratingLook: false } }));
          toast({ title: "Look Gerado!", description: "A peça foi aplicada à modelo." });
      } else {
          setGarments(prev => ({ ...prev, [type]: { ...prev[type], isGeneratingLook: false } }));
          toast({ title: "Erro ao Gerar Look", description: result.error || "Algo deu errado.", variant: "destructive" });
      }
  };

  const handleGenerateCompleteLook = async () => {
    if (!modelDataUri) {
        toast({ title: "Erro", description: "Por favor, envie a imagem da modelo primeiro.", variant: "destructive" });
        return;
    }

    const individualDescriptions = (Object.keys(garmentConfig) as Exclude<GarmentType, 'completeLook'>[])
        .map(type => garments[type].description)
        .filter(Boolean);

    const completeLookDescription = completeLookState.description;

    const allDescriptions = [...individualDescriptions, completeLookDescription].filter(Boolean);

    if (allDescriptions.length === 0) {
        toast({ title: "Erro", description: "Nenhuma descrição de peça foi gerada. Adicione pelo menos uma peça ou um look de referência.", variant: "destructive" });
        return;
    }

    const combinedDescription = allDescriptions.join(' e ');

    setCompleteLookState(prev => ({ ...prev, isGeneratingLook: true }));

    const result = await performDressUp({
        modelPhotoDataUri: modelDataUri,
        garmentDescription: `um look completo consistindo de ${combinedDescription}`,
        completeLookPhotoDataUri: completeLookState.preview ?? undefined,
    });

    if (result.success && result.url) {
        setCompleteLookState(prev => ({ ...prev, result: result.url, isGeneratingLook: false }));
        toast({ title: "Look Completo Gerado!", description: "Todas as peças foram combinadas." });
    } else {
        setCompleteLookState(prev => ({ ...prev, isGeneratingLook: false }));
        toast({ title: "Erro ao Gerar Look Completo", description: result.error || "Algo deu errado.", variant: "destructive" });
    }
  };


  const handleSaveToGallery = async (imageDataUri: string | null) => {
    if (!imageDataUri) return;
    setIsSaving(true);
    try {
        const imageFile = await imageCompression.dataURLtoFile(imageDataUri, 'compressed-image.jpg');

        const options = {
            maxSizeMB: 0.2, // (max 200KB)
            maxWidthOrHeight: 1024,
            useWebWorker: true
        };

        const compressedFile = await imageCompression(imageFile, options);
        const compressedDataUri = await imageCompression.getDataUrlFromFile(compressedFile);

        const gallery = JSON.parse(localStorage.getItem('virtual-dress-up-gallery') || '[]');
        gallery.unshift(compressedDataUri);
        localStorage.setItem('virtual-dress-up-gallery', JSON.stringify(gallery));
        toast({ title: 'Salvo!', description: 'Seu look foi salvo na galeria.' });
        onImageSaved();
    } catch (error) {
        console.error("Failed to save to gallery:", error);
        let errorMessage = 'Não foi possível salvar na galeria.';
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            errorMessage = 'Armazenamento cheio. Exclua alguns itens da galeria.';
        }
        toast({ title: 'Erro ao Salvar', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleUseAsBase = (imageDataUri: string | null) => {
    if (imageDataUri) {
      setModelDataUri(imageDataUri);
      setModelPreview(imageDataUri);
      toast({ title: 'Imagem Definida!', description: 'O resultado anterior é a nova imagem base.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

    // Zoom handlers
    const resetZoomAndPosition = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
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

    const ZoomableImageDialog = ({ src, alt, zoom, setZoom }: ZoomableImageDialogProps) => (
        <Dialog onOpenChange={(open) => !open && resetZoomAndPosition()}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Eye className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Visualizar com Zoom</p>
                </TooltipContent>
            </Tooltip>
            <DialogContent
                className="max-w-4xl h-auto p-4 bg-background/80 backdrop-blur-sm flex flex-col gap-4"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">{alt}</DialogTitle>
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
                        <Image src={src} alt={alt} layout="fill" objectFit="contain" />
                    </div>
                </div>
                {zoom > 1 && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white rounded-full px-4 py-2 text-sm pointer-events-none animate-pulse">
                        <Move className="h-5 w-5 text-secondary" style={{filter: 'drop-shadow(0 0 5px hsl(var(--secondary)))'}} />
                        <span className="font-semibold tracking-wider" style={{textShadow: '0 0 5px hsl(var(--secondary))'}}>Clique e arraste para mover</span>
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <ZoomOut className="h-6 w-6 text-muted-foreground cursor-pointer" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} />
                    <Slider
                        value={[zoom]}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => setZoom(value[0])}
                    />
                    <ZoomIn className="h-6 w-6 text-muted-foreground cursor-pointer" onClick={() => setZoom(Math.min(3, zoom + 0.1))} />
                </div>
            </DialogContent>
        </Dialog>
    );

  const GarmentSection = ({ type }: { type: Exclude<GarmentType, 'completeLook'> }) => {
    const garment = garments[type];
    const { label, icon } = garmentConfig[type];

    const handleClear = () => {
        setGarments(prev => ({...prev, [type]: { ...initialGarmentState }}));
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 border rounded-lg">
        {/* Coluna da Esquerda: Upload e Descrição */}
        <div className="space-y-4">
          <Card className="w-full relative group overflow-hidden transition-all duration-300 hover:shadow-xl bg-muted/20 aspect-[4/5]">
            <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center text-center text-muted-foreground opacity-100 group-hover:opacity-0 transition-opacity z-10 p-2 rounded-lg">
               <Upload className="h-8 w-8 mb-1" />
               <p className="font-semibold text-sm">Clique para enviar {label}</p>
               <p className="text-xs">
                  {type === 'top' ? 'Pode selecionar múltiplos' : 'PNG, JPG ou WEBP'}
               </p>
            </div>
            {garment.preview && <Image src={garment.preview} alt={`${label} preview`} fill style={{objectFit:"contain"}} className="p-2"/>}
            <Input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={type === 'top' ? handleMultipleFileChange : (e) => handleFileChange(e, type)}
              multiple={type === 'top'}
              disabled={garment.isGeneratingLook || garment.isGeneratingDescription}
            />
          </Card>
          <Card className="flex flex-col min-h-[10rem]">
              <CardHeader className="p-3">
                  <CardTitle className="text-base flex items-center gap-2"><FileText /> Descrição (via Gemini)</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-sm flex-grow">
                  {garment.isGeneratingDescription ? (
                      <div className="flex items-center gap-2 h-full"><Loader2 className="animate-spin" /> Gerando...</div>
                  ) : (
                      <p className="text-muted-foreground break-words">{garment.description || "Aguardando imagem para gerar descrição..."}</p>
                  )}
              </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita: Resultado e Ações */}
        <div className="space-y-4">
          <div className="aspect-[4/5] w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/20 relative">
             {garment.isGeneratingLook ? (
                <div className="text-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-sm mt-2">Gerando look...</p></div>
             ) : garment.result ? (
                <Image src={garment.result} alt={`${label} result`} fill style={{objectFit:"contain"}} className="p-2"/>
             ) : (
                <div className="text-center text-muted-foreground p-4">
                    <Sparkles className="mx-auto h-12 w-12 mb-2 text-secondary/50" />
                    <p className="font-semibold">Resultado aparecerá aqui</p>
                </div>
             )}
          </div>
          {garment.result ? (
             <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleUseAsBase(garment.result)} variant="outline" className="w-full">Usar como Base</Button>
                <Button onClick={() => handleSaveToGallery(garment.result)} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Salvar
                </Button>
                <div className="col-span-2 grid grid-cols-3 gap-2">
                    <ZoomableImageDialog src={garment.result} alt={`${label} result`} zoom={zoom} setZoom={setZoom} />
                    <Button onClick={() => handleGenerateLook(type)} variant="secondary" disabled={garment.isGeneratingLook}>
                        <RefreshCw/> Refazer
                    </Button>
                    <Button onClick={handleClear} variant="destructive">
                        <Trash2 /> Limpar
                    </Button>
                </div>
            </div>
          ) : (
             <Button onClick={() => handleGenerateLook(type)} disabled={!garment.description || garment.isGeneratingLook || !modelDataUri} className="w-full">
                <Sparkles /> Gerar Look
            </Button>
          )}
        </div>
      </div>
    );
  }

  const CompleteLookSection = () => {
    const hasAnyGarment = (Object.keys(garmentConfig) as Exclude<GarmentType, 'completeLook'>[]).some(type => garments[type].preview) || completeLookState.preview;
    const handleClear = () => {
        setCompleteLookState({ ...initialGarmentState });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 border rounded-lg">
            {/* Coluna Esquerda: Upload de Referência e Descrição */}
             <div className="space-y-4">
                <Card className="w-full relative group overflow-hidden transition-all duration-300 hover:shadow-xl bg-muted/20 aspect-[4/5]">
                    <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center text-center text-muted-foreground opacity-100 group-hover:opacity-0 transition-opacity z-10 p-2 rounded-lg">
                       <Upload className="h-8 w-8 mb-1" />
                       <p className="font-semibold text-sm">Enviar Imagem de Referência</p>
                       <p className="text-xs">(Opcional)</p>
                    </div>
                    {completeLookState.preview && <Image src={completeLookState.preview} alt="Referência do look completo" fill style={{objectFit:"contain"}} className="p-2"/>}
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      onChange={(e) => handleFileChange(e, 'completeLook')}
                      disabled={completeLookState.isGeneratingLook || completeLookState.isGeneratingDescription}
                    />
                </Card>
                 <Card className="flex flex-col min-h-[10rem]">
                    <CardHeader className="p-3">
                        <CardTitle className="text-base flex items-center gap-2"><FileText /> Descrição (via Gemini)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-sm flex-grow">
                        {completeLookState.isGeneratingDescription ? (
                            <div className="flex items-center gap-2 h-full"><Loader2 className="animate-spin" /> Gerando...</div>
                        ) : (
                            <p className="text-muted-foreground break-words">{completeLookState.description || "Aguardando imagem para gerar descrição..."}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Coluna Direita: Resultado e Ações */}
            <div className="space-y-4">
                <div className="aspect-[4/5] w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/20 relative">
                    {completeLookState.isGeneratingLook ? (
                        <div className="text-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-sm mt-2">Combinando todas as peças...</p></div>
                    ) : completeLookState.result ? (
                        <Image src={completeLookState.result} alt="Look Completo Result" fill style={{ objectFit: "contain" }} className="p-2" />
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <Sparkles className="mx-auto h-12 w-12 mb-2 text-secondary/50" />
                            <p className="font-semibold">O resultado do look completo aparecerá aqui</p>
                        </div>
                    )}
                </div>

                {completeLookState.result ? (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => handleUseAsBase(completeLookState.result)} variant="outline">Usar como Base</Button>
                            <Button onClick={() => handleSaveToGallery(completeLookState.result)} disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Salvar
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                             <ZoomableImageDialog src={completeLookState.result} alt="Look Completo Result" zoom={zoom} setZoom={setZoom} />
                            <Button onClick={handleGenerateCompleteLook} variant="secondary" disabled={completeLookState.isGeneratingLook}>
                                <RefreshCw/> Refazer
                            </Button>
                            <Button onClick={handleClear} variant="destructive">
                                <Trash2 /> Limpar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button onClick={handleGenerateCompleteLook} disabled={!hasAnyGarment || completeLookState.isGeneratingLook || !modelDataUri} className="w-full">
                        <Sparkles /> Gerar Look Completo
                    </Button>
                )}
            </div>
        </div>
    );
};


  return (
    <TooltipProvider>
       <AlertDialog open={lowResWarning.open} onOpenChange={(open) => !open && setLowResWarning({ open: false, onAccept: null })}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Imagem em Baixa Resolução</AlertDialogTitle>
                    <AlertDialogDescription>
                        Coloque uma imagem em alta definição (mínimo 1080px) para que tenha um resultado melhor. Deseja continuar mesmo assim?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setLowResWarning({ open: false, onAccept: null })}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        lowResWarning.onAccept?.();
                        setLowResWarning({ open: false, onAccept: null });
                    }}>
                        Aceito
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      <div className="flex justify-end mb-4 md:mb-8">
        <Button onClick={handleLogout} variant="outline">Sair</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Coluna da Modelo */}
        <div className="lg:col-span-1 space-y-4 md:sticky top-8">
            <Card className="shadow-xl bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl md:text-2xl"><ImageIcon className="text-secondary" />Modelo Base</CardTitle>
                    <CardDescription>Envie a foto do(a) modelo. Esta será a base para todas as gerações.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-[4/5] w-full relative group overflow-hidden transition-all duration-300 hover:shadow-xl bg-muted/20 rounded-lg">
                        <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center text-center text-muted-foreground opacity-100 group-hover:opacity-0 transition-opacity z-10 p-4">
                            <Upload className="h-10 w-10 mb-2" />
                            <p className="font-semibold">Clique para enviar</p>
                        </div>
                        {modelPreview && <Image src={modelPreview} alt="Modelo" fill style={{objectFit:"contain"}} className="p-2"/>}
                        <Input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            onChange={(e) => handleFileChange(e, 'model')}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground text-center w-full">Toda vez que reutilizar o modelo como base, existe uma leve perca de qualidade.</p>
                </CardFooter>
            </Card>
        </div>

        {/* Coluna das Peças */}
        <div className="lg:col-span-2 space-y-6">
             <Card className="shadow-xl">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl md:text-2xl"><Wand2 className="text-secondary"/> Criador de Looks</CardTitle>
                    <CardDescription>Adicione as peças de roupa e deixe a IA trabalhar. Cada peça é analisada e aplicada separadamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-6 border-secondary/50 text-center">
                      <Info className="h-5 w-5"/>
                      <AlertTitle className="text-lg font-bold">Importante: Siga a Ordem para Upload Múltiplo!</AlertTitle>
                      <AlertDescription className="text-sm md:text-base">
                        Ao adicionar mais de uma imagem, selecione-as na ordem correta para que sejam preenchidas nos lugares certos:
                        <br/>
                        <strong className="text-secondary">1º Roupa (Topo) → 2º Calça → 3º Casaco → 4º Sapatos → 5º Acessório</strong>
                        <br/>
                        <span className="font-semibold">Dica: Você pode selecionar múltiplos arquivos no campo "Roupa (Topo)" para preencher tudo de uma vez!</span>
                      </AlertDescription>
                    </Alert>

                    <Accordion type="multiple" className="w-full" value={activeAccordionItems} onValueChange={setActiveAccordionItems}>
                        {(Object.keys(garmentConfig) as Exclude<GarmentType, 'completeLook'>[]).map(type => (
                            <AccordionItem value={type} key={type}>
                                <AccordionTrigger className="text-base md:text-lg font-semibold hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <div className="text-secondary">{garmentConfig[type].icon}</div>
                                        {garmentConfig[type].label}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <GarmentSection type={type} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                         <AccordionItem value="completeLook">
                            <AccordionTrigger className="text-base md:text-lg font-semibold hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="text-secondary" />
                                    Look Completo
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CompleteLookSection />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
             </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
