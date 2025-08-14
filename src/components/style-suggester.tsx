'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { getSuggestionsAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Garment } from '@/lib/garments';
import { Loader2, ShoppingCart } from 'lucide-react';

interface StyleSuggesterProps {
  selectedGarment: Garment;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Getting Suggestions...
        </>
      ) : (
        'Suggest Styles'
      )}
    </Button>
  );
}

export default function StyleSuggester({ selectedGarment }: StyleSuggesterProps) {
  const initialState = { error: undefined, suggestions: undefined, inputErrors: undefined };
  const [state, formAction] = useFormState(getSuggestionsAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.suggestions) {
      formRef.current?.reset();
    }
  }, [state.suggestions]);


  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tell us your style preferences (e.g., "casual for a weekend trip," "formal for an office party," "bright and summery colors") and our AI will suggest complementary items for your selected{' '}
        <span className="font-bold text-primary">{selectedGarment.name}</span>.
      </p>
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="garment" value={selectedGarment.name} />
        <div>
          <Textarea
            name="userPreferences"
            placeholder="e.g., casual, modern, minimalist..."
            className="min-h-[80px]"
            aria-invalid={!!state.inputErrors?.userPreferences}
            aria-describedby="userPreferences-error"
          />
          {state.inputErrors?.userPreferences && (
            <p id="userPreferences-error" className="text-sm text-destructive mt-1">
              {state.inputErrors.userPreferences[0]}
            </p>
          )}
        </div>
        <SubmitButton />
      </form>
      
      {state.error && !state.inputErrors && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.suggestions && (
        <div className="space-y-4 pt-4">
          <h3 className="text-2xl font-bold text-center">AI Recommendations</h3>
          <div className="grid gap-4 sm:grid-cols-1">
            {state.suggestions.suggestions.map((suggestion, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{suggestion.item}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{suggestion.reason}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <a href={suggestion.purchaseLink} target="_blank" rel="noopener noreferrer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy Now
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
