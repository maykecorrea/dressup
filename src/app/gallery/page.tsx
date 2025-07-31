'use client';

import { getGalleryImages, deleteImage } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Eye, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


export default function GalleryPage() {
    const [images, setImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, startDeleteTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchImages = async () => {
            setIsLoading(true);
            const fetchedImages = await getGalleryImages();
            setImages(fetchedImages);
            setIsLoading(false);
        };
        fetchImages();
    }, []);

    const handleDelete = async (imageUrl: string) => {
        startDeleteTransition(async () => {
            const result = await deleteImage({ imageUrl });
            if (result.success) {
                toast({
                    title: "Sucesso!",
                    description: result.message,
                });
                // Optimistically remove the image from the UI
                setImages((prevImages) => prevImages.filter(img => img !== imageUrl));
                // Or re-fetch to be sure
                // const updatedImages = await getGalleryImages();
                // setImages(updatedImages);
            } else {
                toast({
                    title: "Erro",
                    description: result.error,
                    variant: "destructive",
                });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/app">
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-4xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-pulse">
                            Galeria de Looks
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Explore, baixe ou exclua os looks incríveis que foram criados.
                        </p>
                    </div>
                </div>
            </header>

            {images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((src, index) => (
                        <Card key={index} className="overflow-hidden group relative">
                            <CardContent className="p-0">
                                <Image
                                    src={src}
                                    alt={`Look Gerado ${index + 1}`}
                                    width={400}
                                    height={500}
                                    className="aspect-[4/5] object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                   <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon" className="text-white border-white hover:bg-white/20">
                                                <Eye className="h-5 w-5" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl h-auto p-2 bg-background/80 backdrop-blur-sm">
                                             <Image src={src} alt={`Look Gerado ${index + 1}`} width={1024} height={1280} className="w-full h-auto object-contain" />
                                        </DialogContent>
                                    </Dialog>
                                    <Button asChild variant="outline" size="icon" className="text-white border-white hover:bg-white/20">
                                        <a href={src} download={`look-${index + 1}.png`}>
                                            <Download className="h-5 w-5" />
                                        </a>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="border-red-500 hover:bg-red-500/90">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Essa ação não pode ser desfeita. Isso excluirá permanentemente a imagem
                                                dos servidores.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(src)} disabled={isDeleting}>
                                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Sim, excluir imagem
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/20 rounded-lg">
                    <p className="text-xl text-muted-foreground">Nenhum look foi salvo ainda.</p>
                    <p className="text-muted-foreground mt-2">Volte para a página principal, crie um look e salve-o para vê-lo aqui!</p>
                    <Button asChild className="mt-6">
                        <Link href="/app">Criar um Look</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
