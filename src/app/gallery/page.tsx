'use client';

import { GallerySection } from "@/components/gallery-section";

export default function GalleryPage() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <GallerySection showBackButton={true} />
        </div>
    );
}
