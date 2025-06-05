
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
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import Link from 'next/link';
import { UpjLogo } from '@/components/icons/UpjLogo';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  rememberMe: z.boolean().default(false),
});

// Simple SVG for Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.84c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

// Updated Facebook Icon SVG
const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
    </svg>
  );


export function LoginForm() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      await login(values.email, values.password);
      // Redirect is handled by AuthContext/page.tsx
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid password or email');
      } else {
        setError(err.message || 'Failed to login. Please check your credentials.');
      }
      console.error("Login attempt failed:", err);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      <div className="w-full flex justify-center mb-4">
        <UpjLogo className="h-16 w-auto" fill="hsl(var(--primary))" />
      </div>
      
      <h1 className="text-3xl font-headline font-bold self-start">Sign in</h1>

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
                    <Input placeholder="Your email address" {...field} className="pl-10" />
                  </div>
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
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Your password" 
                      {...field} 
                      className="pl-10 pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Switch
                      id="rememberMe"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Remember me"
                    />
                  </FormControl>
                  <Label htmlFor="rememberMe" className="font-normal text-sm">Remember Me</Label>
                </FormItem>
              )}
            />
            <Link href="/reset-password" className="text-sm font-medium text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          
          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
          
          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SIGN IN'}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>
      </Form>

      <div className="relative w-full flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <span className="relative bg-background px-2 text-sm text-muted-foreground">OR</span>
      </div>

      <div className="w-full space-y-3">
        <Button variant="outline" className="w-full h-12 text-foreground justify-start">
          <GoogleIcon />
          <span className="flex-grow text-center">Login with Google</span>
        </Button>
        <Button variant="outline" className="w-full h-12 text-foreground justify-start">
          <FacebookIcon />
          <span className="flex-grow text-center">Login with Facebook</span>
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
