'use client';

import { GallerySection } from "@/components/gallery-section";
import { useState } from "react";

export default function GalleryPage() {
    const [imagesVersion, setImagesVersion] = useState(0);

    const handleImageDeleted = () => {
        setImagesVersion(prev => prev + 1);
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <GallerySection 
                key={imagesVersion}
                onImageDeleted={handleImageDeleted}
                showBackButton={true}
            />
        </div>
    );
}
