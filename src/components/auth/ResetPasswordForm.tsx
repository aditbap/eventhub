
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ArrowLeft, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    try {
      // In a real app, you would call Firebase's sendPasswordResetEmail here
      // await auth.sendPasswordResetEmail(values.email);
      console.log('Password reset email requested for:', values.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${values.email}, you will receive an email with instructions to reset your password.`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      // Optionally, redirect or clear form
      // router.push('/login');
      form.reset();
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to send password reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col w-full space-y-8 py-8">
      <div className="absolute top-4 left-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="pt-10 text-left">
        <h1 className="text-3xl font-headline font-bold">Reset Password</h1>
        <p className="text-muted-foreground mt-2">
          Please enter your email address to request a password reset.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="email"
                      placeholder="Your email address" 
                      {...field} 
                      className="pl-10 h-12 rounded-md border-input focus:border-primary" 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
          
          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base mt-4" disabled={loading}>
            {loading ? <Mail className="h-5 w-5 animate-spin" /> : 'SEND'}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>
      </Form>
    </div>
  );
}
