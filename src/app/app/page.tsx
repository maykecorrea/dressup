
'use client';

import { DressUpForm } from '@/components/dress-up-form';
import { Info, Lightbulb, Shirt, ThumbsUp, GalleryVertical } from 'lucide-react';
import withAuth from '@/components/with-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GallerySection } from '@/components/gallery-section';
import { Separator } from '@/components/ui/separator';
import { useState, useTransition } from 'react';
import { deleteImage } from '../actions';
import { useToast } from '@/hooks/use-toast';

function AppPage() {
  const [images, setImages] = useState<string[]>([]);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  const handleImageSaved = (newImageUrl: string) => {
    setImages(prevImages => [newImageUrl, ...prevImages]);
  };

  const handleImageDeleted = (imageUrl: string) => {
    startDeleteTransition(async () => {
      const result = await deleteImage({ imageUrl });
      if (result.success) {
        toast({
            title: "Sucesso!",
            description: result.message,
        });
        setImages((prevImages) => prevImages.filter(img => img !== imageUrl));
      } else {
          toast({
              title: "Erro",
              description: result.error,
              variant: "destructive",
          });
      }
    });
  };


  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-4 bg-card p-4 rounded-xl shadow-lg bg-gradient-to-r from-primary/10 to-transparent">
            <Shirt className="h-12 w-12 text-secondary animate-pulse" />
            <h1 className="text-5xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-pulse">Provador Virtual IA</h1>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
          Experimente qualquer roupa virtualmente. Envie uma foto sua ou de um(a) modelo, selecione uma peça de roupa e deixe nossa IA criar o look perfeito.
        </p>
         <div className="mt-6">
            <Button asChild className="bg-gradient-to-r from-secondary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 transition-transform">
              <Link href="/gallery">
                <GalleryVertical className="mr-2" />
                Ver Galeria de Looks Completa
              </Link>
            </Button>
          </div>
      </header>

      <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card shadow-lg border border-primary/20">
        <h2 className="text-3xl font-headline font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-pink-500 animate-pulse">
          <Lightbulb className="inline-block h-8 w-8 mr-2 text-secondary" />
          Dicas para um Resultado Perfeito
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-lg bg-card/50">
            <ThumbsUp className="h-10 w-10 mx-auto text-secondary mb-3"/>
            <h3 className="font-semibold text-lg text-foreground mb-1">Melhores Fotos</h3>
            <p className="text-muted-foreground text-sm">Para resultados incríveis, use fotos com <span className="font-bold text-secondary/90">fundo branco</span> tanto para a modelo quanto para a roupa. Isso ajuda a IA a focar no que importa!</p>
          </div>
          <div className="p-4 rounded-lg bg-card/50">
            <Info className="h-10 w-10 mx-auto text-secondary mb-3"/>
            <h3 className="font-semibold text-lg text-foreground mb-1">Sobre a IA</h3>
            <p className="text-muted-foreground text-sm">Nossa IA é super criativa, mas como toda tecnologia nova, pode ter <span className="font-bold text-secondary/90">variações inesperadas</span>. A geração de imagens é um processo complexo e volátil.</p>
          </div>
          <div className="p-4 rounded-lg bg-card/50">
            <Shirt className="h-10 w-10 mx-auto text-secondary mb-3"/>
            <h3 className="font-semibold text-lg text-foreground mb-1">Não Gostou? Tente de Novo!</h3>
            <p className="text-muted-foreground text-sm">Se o resultado não for o esperado, <span className="font-bold text-secondary/90">não hesite em tentar novamente</span>. Às vezes, uma nova tentativa pode trazer o look que você imaginou.</p>
          </div>
        </div>
      </div>
      
      <DressUpForm onImageSaved={handleImageSaved} />

      <Separator className="my-12" />

      <GallerySection 
        images={images}
        setImages={setImages}
        onImageDeleted={handleImageDeleted}
        isDeleting={isDeleting}
        showBackButton={false} 
      />

    </main>
  );
}

export default withAuth(AppPage);
