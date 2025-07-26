import { DressUpForm } from '@/components/dress-up-form';
import { Shirt } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-4 bg-card p-4 rounded-xl shadow-md">
            <Shirt className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-headline font-bold text-foreground">DressUp AI</h1>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
          Virtually try on any outfit. Upload a photo of yourself or a model, select a garment, and let our AI create the perfect look.
        </p>
      </header>
      <DressUpForm />
    </main>
  );
}
