'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Loader2, Sparkles, Upload, Wand2, Shirt, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { performDressUp } from '@/app/actions';

const formSchema = z.object({
  modelPhotoDataUri: z.string().min(1, { message: 'Please upload a model image.' }),
  garmentPhotoDataUri: z.string().min(1, { message: 'Please upload a garment image.' }),
  positivePrompt: z.string(),
  negativePrompt: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultPositivePrompts = "high quality, photorealistic, professional photography, natural lighting, perfect fit, realistic shading, high detail, sharp focus, 8k";
const defaultNegativePrompts = "ugly, deformed, blurry, bad quality, bad anatomy, extra limbs, extra fingers, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, tiling, disfigured, body out of frame, watermark, signature, cut off, low contrast, underexposed, overexposed, bad art, beginner, amateur, unrealistic, cartoonish, artifacts";

export function DressUpForm() {
  const { toast } = useToast();
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelPhotoDataUri: '',
      garmentPhotoDataUri: '',
      positivePrompt: defaultPositivePrompts,
      negativePrompt: defaultNegativePrompts,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'model' | 'garment') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        if (field === 'model') {
          setModelPreview(dataUri);
          form.setValue('modelPhotoDataUri', dataUri);
        } else {
          setGarmentPreview(dataUri);
          form.setValue('garmentPhotoDataUri', dataUri);
        }
        form.clearErrors(field === 'model' ? 'modelPhotoDataUri' : 'garmentPhotoDataUri');
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setGeneratedImage(null);
    const result = await performDressUp(values);
    setIsLoading(false);

    if (result.success) {
      setGeneratedImage(result.url);
      toast({
        title: 'Success!',
        description: 'Your new look has been generated.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const ImageUpload = ({ fieldName, preview, setPreview, label, icon }: { fieldName: 'modelPhotoDataUri' | 'garmentPhotoDataUri', preview: string | null, setPreview: (p: string | null) => void, label: string, icon: React.ReactNode }) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem className="w-full">
          <FormLabel className="flex items-center gap-2 text-lg font-semibold"><div className="text-accent">{icon}</div>{label}</FormLabel>
          <FormControl>
            <Card className="aspect-square w-full relative group overflow-hidden">
              <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center text-center text-muted-foreground opacity-100 group-hover:opacity-0 transition-opacity z-10 p-4">
                 <Upload className="h-10 w-10 mb-2" />
                 <p className="font-semibold">Click to upload</p>
                 <p className="text-xs">PNG, JPG, or WEBP</p>
              </div>
              {preview && <Image src={preview} alt="Preview" layout="fill" objectFit="contain" className="p-2"/>}
              <Input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={(e) => handleFileChange(e, fieldName === 'modelPhotoDataUri' ? 'model' : 'garment')}
                disabled={isLoading}
              />
            </Card>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Wand2 className="text-primary" />
            Create Your Look
          </CardTitle>
          <CardDescription>
            Upload your images and adjust the prompts to generate the perfect virtual try-on.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ImageUpload fieldName="modelPhotoDataUri" preview={modelPreview} setPreview={setModelPreview} label="Model Image" icon={<ImageIcon />} />
                <ImageUpload fieldName="garmentPhotoDataUri" preview={garmentPreview} setPreview={setGarmentPreview} label="Garment Image" icon={<Shirt />} />
              </div>

              <FormField
                control={form.control}
                name="positivePrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Positive Prompts</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. high quality, realistic..."
                        rows={4}
                        className="resize-none"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>Describe the desired attributes of the final image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="negativePrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Negative Prompts</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. blurry, deformed..."
                        rows={4}
                        className="resize-none"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                     <FormDescription>Describe what you want to avoid in the final image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Outfit
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card className="shadow-lg sticky top-8">
        <CardHeader>
          <CardTitle className="text-2xl">Outfit Preview</CardTitle>
          <CardDescription>Your generated result will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-square w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/20">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="font-medium">AI is working its magic...</p>
              </div>
            ) : generatedImage ? (
              <Image src={generatedImage} alt="Generated outfit" width={1024} height={1024} className="object-contain w-full h-full" data-ai-hint="fashion model" />
            ) : (
              <div className="text-center text-muted-foreground p-4">
                <Sparkles className="mx-auto h-16 w-16 mb-4" />
                <p className="font-semibold">The result will be magical</p>
                <p className="text-sm">Complete the form and click "Generate Outfit"</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
