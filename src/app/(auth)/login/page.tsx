
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2,LogIn } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);
  const [isLoading, setIsLoading] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Bem-vindo(a) de volta!',
      });
      router.push('/app');
    } catch (error: any) {
      toast({
        title: 'Erro de login',
        description: 'Verifique seu e-mail e senha e tente novamente.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary animate-pulse">Bem-Vindo de Volta!</h1>
            <p className="text-muted-foreground mt-2">Faça login para continuar sua jornada fashion.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seuemail@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:scale-105 transition-transform" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn className="mr-2"/> Entrar</> }
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center items-center gap-1">
          <div>Não tem uma conta?</div>
          <Link href="/signup" className="font-semibold text-secondary hover:underline">
            Crie uma agora
          </Link>
        </div>
        <div className="mt-2">
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-secondary hover:underline">
            Esqueceu sua senha?
          </Link>
        </div>
      </div>
    </div>
  );
}
