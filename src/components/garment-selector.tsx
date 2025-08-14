'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Garment } from '@/lib/garments';

interface GarmentSelectorProps {
  garments: Garment[];
  selectedGarment: Garment | null;
  onGarmentSelect: (garment: Garment) => void;
}

export default function GarmentSelector({
  garments,
  selectedGarment,
  onGarmentSelect,
}: GarmentSelectorProps) {
  return (
    <div className="w-full px-12">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {garments.map((garment) => (
            <CarouselItem key={garment.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-lg hover:border-primary',
                    selectedGarment?.id === garment.id && 'border-primary border-2 shadow-lg'
                  )}
                  onClick={() => onGarmentSelect(garment)}
                >
                  <CardContent className="flex flex-col aspect-square items-center justify-center p-2">
                    <div className="w-full h-4/5 relative mb-2">
                       <Image
                         src={garment.imageSrc}
                         alt={garment.name}
                         data-ai-hint={garment.aiHint}
                         fill
                         sizes="(max-width: 768px) 50vw, 33vw"
                         className="object-contain rounded-t-md"
                       />
                    </div>
                    <p className="text-sm font-semibold text-center truncate w-full">{garment.name}</p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
