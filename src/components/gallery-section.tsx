
'use client';

import { getGalleryImages } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Eye, Trash2, Loader2, GalleryVertical, ZoomIn, ZoomOut, Rocket, Move } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogTitle,
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
import { useEffect, useState, useRef, MouseEvent as ReactMouseEvent } from "react";
import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


type GallerySectionProps = {
    showBackButton?: boolean;
    images: string[];
    setImages: React.Dispatch<React.SetStateAction<string[]>>;
    onImageDeleted: (imageUrl: string) => void;
    isDeleting: boolean;
}

export function GallerySection({ showBackButton = true, images, setImages, onImageDeleted, isDeleting }: GallerySectionProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Zoom state
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const fetchImages = async () => {
            setIsLoading(true);
            const fetchedImages = await getGalleryImages();
            setImages(fetchedImages);
            setIsLoading(false);
        };
        fetchImages();
    }, [setImages]);


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


    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <TooltipProvider>
            <section>
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        {showBackButton && (
                            <Button asChild variant="outline" size="icon">
                                <Link href="/app">
                                    <ArrowLeft />
                                </Link>
                            </Button>
                        )}
                        <div className="flex items-center gap-3">
                            <GalleryVertical className="h-10 w-10 text-secondary" />
                            <div>
                                <h2 className="text-4xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-pulse">
                                    Galeria de Looks
                                </h2>
                                <p className="text-muted-foreground mt-1 text-lg">
                                    Explore, baixe ou exclua os looks incríveis que foram criados.
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {images.map((src, index) => (
                            <Card key={`${src}-${index}`} className="overflow-hidden group relative">
                                <CardContent className="p-0">
                                    <div className="aspect-[4/5] w-full bg-muted/20 flex items-center justify-center">
                                        <Image
                                            src={src}
                                            alt={`Look Gerado ${index + 1}`}
                                            width={400}
                                            height={500}
                                            className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105 p-2"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Dialog onOpenChange={(open) => !open && resetZoomAndPosition()}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="icon" className="text-white border-white hover:bg-white/20">
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
                                                <DialogTitle className="sr-only">Zoom na Imagem da Galeria</DialogTitle>
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
                                                            src={src}
                                                            alt={`Look Gerado ${index + 1}`}
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
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button asChild variant="outline" size="icon" className="text-white border-white hover:bg-white/20">
                                                    <a href={src} download={`look-${index + 1}.png`}>
                                                        <Download className="h-5 w-5" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Baixar Imagem</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <AlertDialog>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" className="border-red-500 hover:bg-red-500/90">
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Excluir Imagem</p>
                                                </TooltipContent>
                                            </Tooltip>
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
                                                <AlertDialogAction onClick={() => onImageDeleted(src)} disabled={isDeleting}>
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
                        <p className="text-muted-foreground mt-2">Crie um look e salve-o para vê-lo aqui!</p>
                    </div>
                )}
            </section>
        </TooltipProvider>
    );
}

    