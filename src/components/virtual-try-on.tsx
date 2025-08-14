'use client';

import { useState, useRef, type MouseEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Garment } from '@/lib/garments';

interface VirtualTryOnProps {
  userImage: string | null;
  garment: Garment | null;
}

export default function VirtualTryOn({ userImage, garment }: VirtualTryOnProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.style.cursor = 'grab';
  };
  
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.style.cursor = 'grab';
    }
  };

  const resetTransform = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-md aspect-[3/4] relative overflow-hidden bg-muted flex items-center justify-center">
        {userImage ? (
          <Image src={userImage} alt="User" layout="fill" objectFit="cover" />
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Your photo will appear here.</p>
          </div>
        )}
        {userImage && garment && (
          <div
            className="absolute top-0 left-0"
            style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="relative w-[200px] h-[250px] transition-transform duration-200 ease-in-out cursor-grab"
              style={{ transformOrigin: 'center center' }}
            >
              <Image
                src={garment.imageSrc}
                alt={garment.name}
                data-ai-hint={garment.aiHint}
                layout="fill"
                objectFit="contain"
                className="pointer-events-none"
              />
            </div>
          </div>
        )}
      </Card>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Button variant="outline" size="sm" onClick={() => setScale(s => s * 1.1)} title="Zoom In">
          <ZoomIn className="mr-1 h-4 w-4" /> Zoom In
        </Button>
        <Button variant="outline" size="sm" onClick={() => setScale(s => s * 0.9)} title="Zoom Out">
          <ZoomOut className="mr-1 h-4 w-4" /> Zoom Out
        </Button>
        <Button variant="outline" size="sm" onClick={resetTransform} title="Reset">
          <RotateCcw className="mr-1 h-4 w-4" /> Reset
        </Button>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Move className="h-3 w-3" /> Click and drag garment to adjust position.
      </p>
    </div>
  );
}
