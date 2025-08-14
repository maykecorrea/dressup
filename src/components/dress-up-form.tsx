
'use client';

import { useState, useRef, ReactNode, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Sparkles, Upload, Wand2, Shirt, Image as ImageIcon, Download, Save, Trash2, Footprints, Gem, Snowflake, Info, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { performGenerateDescription, performDressUp } from '@/app/actions';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


// Custom Pants Icon
const PantsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pants">
      <path d="M12 2v7.5"/><path d="M12 21a4.5 4.5 0 0 0-3-4H6a2 2 0 0 1-2-2V9.5"/><path d="M12 21a4.5 4.5 0 0 1 3-4h3a2 2 0 0 0 2-2V9.5"/>
    </svg>
);

const defaultPositivePrompts = "alta qualidade, fotorrealista, fotografia profissional, iluminação natural, ajuste perfeito, sombreamento realista, alto detalhe, foco nítido, 8k, look completo e coeso";
const defaultNegativePrompts = "feio, deformado, borrado, má qualidade, má anatomia, membros extras, dedos extras, mãos mal desenhadas, pés mal desenhadas, rosto mal desenhado, fora de quadro, azulejos, desfigurado, corpo fora de quadro, marca d'água, assinatura, cortado, baixo contraste, subexposto, superexposto, arte ruim, iniciante, amador, irrealista, caricato, artefatos, rosto diferente, outra pessoa, mudar o rosto, mudar o cabelo, imagem cortada, corte, zoom, enquadramento diferente, pose diferente";

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

  const [completeLookState, setCompleteLookState] = useState<Omit<GarmentState, 'description' | 'isGeneratingDescription'>>({
      preview: null, // Not used for complete look
      result: null,
      isGeneratingLook: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>('top');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: 'Deslogado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao deslogar.', variant: 'destructive' });
    }
  };

  const handleGenerateDescription = async (type: Exclude<GarmentType, 'completeLook'>, dataUri: string) => {
    if (!dataUri) {
        toast({ title: "Erro", description: "URI de dados inválido.", variant: "destructive" });
        return;
    }

    setGarments(prev => ({ ...prev, [type]: { ...prev[type], isGeneratingDescription: true, preview: dataUri } }));

    const result = await performGenerateDescription({ garmentPhotoDataUri: dataUri });
    
    if (result.success && result.description) {
        setGarments(prev => ({ ...prev, [type]: { ...prev[type], description: result.description, isGeneratingDescription: false } }));
        toast({ title: `Descrição Gerada para ${garmentConfig[type].label}!`, description: "A IA analisou a peça de roupa." });
    } else {
        setGarments(prev => ({ ...prev, [type]: { ...prev[type], isGeneratingDescription: false } }));
        toast({ title: "Erro", description: result.error || "Não foi possível gerar a descrição.", variant: "destructive" });
    }
  };

  const processFile = (file: File, type: Exclude<GarmentType, 'completeLook'>) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUri = reader.result as string;
        setGarments(prev => ({
            ...prev,
            [type]: { ...initialGarmentState, preview: dataUri }
        }));
        handleGenerateDescription(type, dataUri);
    };
    reader.readAsDataURL(file);
  };
  
  const handleMultipleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        // Distribute files according to the defined order
        Array.from(files).forEach((file, index) => {
            if (index < garmentOrder.length) {
                const garmentType = garmentOrder[index];
                processFile(file, garmentType);
            }
        });
        if (files.length > 0) {
            toast({
                title: `${files.length} imagem(ns) carregadas!`,
                description: "As descrições estão sendo geradas em segundo plano."
            });
        }
    }
    // Clear the input value to allow re-selecting the same files
    event.target.value = '';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'model') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        if (type === 'model') {
          setModelPreview(dataUri);
          setModelDataUri(dataUri);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateLook = async (type: Exclude<GarmentType, 'completeLook'>) => {
      const garment = garments[type];
      if (!modelDataUri) {
          toast({ title: "Erro", description: "Por favor, envie a imagem da modelo primeiro.", variant: "destructive" });
          return;
      }
      if (!garment.preview || !garment.description) {
          toast({ title: "Erro", description: "Aguarde a descrição da peça ser gerada antes de criar o look.", variant: "destructive" });
          return;
      }

      setGarments(prev => ({ ...prev, [type]: { ...prev[type], isGeneratingLook: true } }));
      
      const result = await performDressUp({
          modelPhotoDataUri: modelDataUri,
          garmentPhotoDataUri: garment.preview,
          garmentDescription: garment.description,
          positivePrompt: defaultPositivePrompts,
          negativePrompt: defaultNegativePrompts,
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

    const descriptions = (Object.keys(garmentConfig) as Exclude<GarmentType, 'completeLook'>[])
        .map(type => garments[type].description)
        .filter(Boolean); // Filter out null/undefined descriptions

    if (descriptions.length === 0) {
        toast({ title: "Erro", description: "Nenhuma peça de roupa foi adicionada. Adicione pelo menos uma peça para gerar o look completo.", variant: "destructive" });
        return;
    }

    const combinedDescription = descriptions.join('. ');

    setCompleteLookState(prev => ({ ...prev, isGeneratingLook: true }));

    const result = await performDressUp({
        modelPhotoDataUri: modelDataUri,
        garmentPhotoDataUri: '', // Not needed for complete look, AI will use description
        garmentDescription: combinedDescription,
        positivePrompt: defaultPositivePrompts,
        negativePrompt: defaultNegativePrompts,
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
      const gallery = JSON.parse(localStorage.getItem('virtual-dress-up-gallery') || '[]');
      gallery.unshift(imageDataUri);
      localStorage.setItem('virtual-dress-up-gallery', JSON.stringify(gallery));
      toast({ title: 'Salvo!', description: 'Seu look foi salvo na galeria.' });
      onImageSaved();
    } catch (error) {
      toast({ title: 'Erro ao Salvar', variant: 'destructive' });
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

  const GarmentSection = ({ type }: { type: Exclude<GarmentType, 'completeLook'> }) => {
    const garment = garments[type];
    const { label, icon } = garmentConfig[type];

    const handleClear = () => {
        setGarments(prev => ({...prev, [type]: { ...initialGarmentState }}));
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
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
              onChange={type === 'top' ? handleMultipleFileChange : (e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file, type);
              }}
              multiple={type === 'top'} // Allow multiple only for the first input
              disabled={garment.isGeneratingDescription || garment.isGeneratingLook}
            />
          </Card>

          {garment.preview && (
            <>
                {garment.isGeneratingDescription ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="animate-spin" />
                        Analisando a peça...
                    </div>
                ) : garment.description ? (
                     <Card className="bg-background/50">
                        <CardHeader className="p-3">
                            <CardTitle className="text-sm flex items-center gap-2"><Info className="text-secondary" /> Descrição da IA (Gemini)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-xs text-muted-foreground">{garment.description}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center text-sm text-destructive-foreground p-2 rounded-md bg-destructive">
                        Falha ao gerar descrição.
                    </div>
                )}
            </>
          )}
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
                <Button onClick={() => handleUseAsBase(garment.result)} variant="outline">Usar como Base</Button>
                <Button onClick={() => handleSaveToGallery(garment.result)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Salvar
                </Button>
                 <Button onClick={handleClear} variant="destructive" className="col-span-2">
                    <Trash2 /> Limpar
                </Button>
            </div>
          ) : (
             <Button onClick={() => handleGenerateLook(type)} disabled={!garment.description || garment.isGeneratingLook || !modelDataUri} className="w-full">
                <Sparkles /> Gerar Look (com OpenAI)
            </Button>
          )}
        </div>
      </div>
    );
  }

  const CompleteLookSection = () => {
    const hasAnyGarment = (Object.keys(garmentConfig) as Exclude<GarmentType, 'completeLook'>[]).some(type => garments[type].preview);
    const handleClear = () => {
        setCompleteLookState({ result: null, isGeneratingLook: false, preview: null });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
            <div className="space-y-4 md:col-span-2 flex flex-col items-center">
                <div className="aspect-[4/5] w-full max-w-md rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/20 relative">
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
                    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                        <Button onClick={() => handleSaveToGallery(completeLookState.result)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Salvar na Galeria
                        </Button>
                        <Button onClick={handleClear} variant="destructive">
                            <Trash2 /> Limpar Look Completo
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleGenerateCompleteLook} disabled={!hasAnyGarment || completeLookState.isGeneratingLook || !modelDataUri} className="w-full max-w-md mt-4">
                        <Sparkles /> Gerar Look Completo
                    </Button>
                )}
            </div>
        </div>
    );
};


  return (
    <>
      <div className="flex justify-end mb-8">
        <Button onClick={handleLogout} variant="outline">Sair</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna da Modelo */}
        <div className="lg:col-span-1 space-y-4 sticky top-8">
            <Card className="shadow-xl bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl"><ImageIcon className="text-secondary" />Modelo Base</CardTitle>
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
            </Card>
        </div>

        {/* Coluna das Peças */}
        <div className="lg:col-span-2 space-y-6">
             <Card className="shadow-xl">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl"><Wand2 className="text-secondary"/> Criador de Looks</CardTitle>
                    <CardDescription>Adicione as peças de roupa uma a uma. Cada peça será gerada separadamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-6 border-secondary/50 text-center">
                      <Info className="h-5 w-5"/>
                      <AlertTitle className="text-lg font-bold">Importante: Siga a Ordem!</AlertTitle>
                      <AlertDescription className="text-base">
                        Para um resultado perfeito no "Look Completo", adicione as imagens na sequência correta:
                        <br/>
                        <strong className="text-secondary">1º Roupa (Topo) → 2º Calça → 3º Casaco → 4º Sapatos → 5º Acessório</strong>
                        <br/>
                        <span className="font-semibold">Dica: Você pode selecionar múltiplos arquivos no campo "Roupa (Topo)" para preencher tudo de uma vez!</span>
                      </AlertDescription>
                    </Alert>

                    <Accordion type="single" collapsible className="w-full" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                        {(Object.keys(garmentConfig) as Exclude<GarmentType, 'completeLook'>[]).map(type => (
                            <AccordionItem value={type} key={type}>
                                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
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
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
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
    </>
  );
}

    