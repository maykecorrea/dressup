'use client';

import { GallerySection } from "@/components/gallery-section";
import { useState, useTransition } from "react";
import { deleteImage } from "../actions";
import { useToast } from "@/hooks/use-toast";


export default function GalleryPage() {
    const [images, setImages] = useState<string[]>([]);
    const [isDeleting, startDeleteTransition] = useTransition();
    const { toast } = useToast();

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
        <div className="container mx-auto px-4 py-8 md:py-12">
            <GallerySection 
                images={images}
                setImages={setImages}
                onImageDeleted={handleImageDeleted}
                isDeleting={isDeleting}
                showBackButton={true}
            />
        </div>
    );
}
