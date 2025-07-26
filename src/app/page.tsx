import { DressUpForm } from '@/components/dress-up-form';
import { Shirt } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-4 bg-card p-4 rounded-xl shadow-lg bg-gradient-to-r from-primary/10 to-transparent">
            <Shirt className="h-12 w-12 text-primary animate-pulse" />
            <h1 className="text-5xl font-headline font-bold text-foreground">Provador Virtual IA</h1>
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
          Experimente qualquer roupa virtualmente. Envie uma foto sua ou de um(a) modelo, selecione uma peça de roupa e deixe nossa IA criar o look perfeito.
        </p>
      </header>
      <DressUpForm />
    </main>
  );
}
