'use client';

import { useState } from 'react';
import type { Garment } from '@/lib/garments';
import { garments } from '@/lib/garments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageHandler from '@/components/image-handler';
import VirtualTryOn from '@/components/virtual-try-on';
import GarmentSelector from '@/components/garment-selector';
import StyleSuggester from '@/components/style-suggester';
import { Dices, Shirt, User } from 'lucide-react';

export default function Home() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(garments[0]);

  return (
    <main className="container mx-auto p-4 md:p-8 font-headline">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-primary">Virtuoso</h1>
        <p className="text-muted-foreground text-lg mt-2">Your Personal AI Stylist</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                <span>Step 1: Provide Your Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageHandler onImageSelect={setUserImage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="w-6 h-6 text-primary" />
                <span>Step 2: Try It On</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VirtualTryOn userImage={userImage} garment={selectedGarment} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dices className="w-6 h-6 text-primary" />
                <span>Step 3: Choose a Garment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GarmentSelector
                garments={garments}
                selectedGarment={selectedGarment}
                onGarmentSelect={setSelectedGarment}
              />
            </CardContent>
          </Card>

          {selectedGarment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="m12 3-1.9 4.2-4.3.6 3.1 3- .7 4.2 3.8-2 3.8 2-.7-4.2 3.1-3-4.3-.6Z"/></svg>
                  <span>Step 4: Get AI Style Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StyleSuggester selectedGarment={selectedGarment} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
