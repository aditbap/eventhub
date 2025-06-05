
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
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UpjLogo } from '@/components/icons/UpjLogo';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Simple SVG for Google Icon (copied from LoginForm)
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.84c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

// Updated Facebook Icon SVG (copied from LoginForm)
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M15.12 5.32H17.94V2.14C17.44 2.09 16.23 2 14.86 2C11.98 2 10.05 3.83 10.05 6.7V9.25H7.06V12.84H10.05V22H13.54V12.84H16.39L16.81 9.25H13.54V7.05C13.54 5.95 13.84 5.32 15.12 5.32Z"/>
  </svg>
);

export function RegisterForm() {
  const { register, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      await register(values.name, values.email, values.password);
      // Redirect is handled by AuthContext/page.tsx or AuthProvider
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    }
  }

  return (
    <div className="relative flex flex-col w-full space-y-4">
      <div className="absolute top-0 left-[-8px] sm:left-0"> {/* Adjusted for better positioning with layout padding */}
        <Button variant="ghost" size="icon" onClick={() => router.push('/login')} aria-label="Go back to login">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full flex justify-center mb-2"> {/* Reduced bottom margin */}
        <UpjLogo className="h-12 w-auto" fill="hsl(var(--primary))" />
      </div>
      
      <h1 className="text-3xl font-headline font-bold self-start">Sign up</h1> {/* Matched size with LoginForm */}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4"> {/* Kept space-y-4 for compactness */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Full name" {...field} className="pl-10 rounded-md border-input focus:border-primary" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="abc@email.com" {...field} className="pl-10 rounded-md border-input focus:border-primary" />
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
                      className="pl-10 pr-10 rounded-md border-input focus:border-primary"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="Confirm password" 
                      {...field} 
                      className="pl-10 pr-10 rounded-md border-input focus:border-primary"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
          
          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base" disabled={loading}> {/* Matched h-12 */}
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SIGN UP'}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>
      </Form>

      <div className="relative w-full flex items-center justify-center my-4"> {/* Matched my-4 */}
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-2 text-sm text-muted-foreground">OR</span>
      </div>

      <div className="w-full space-y-3"> {/* Matched space-y-3 */}
        <Button variant="outline" className="w-full h-12 text-foreground justify-start border-input hover:bg-accent"> {/* Matched h-12 */}
          <GoogleIcon />
          <span className="flex-grow text-center">Sign up with Google</span>
        </Button>
        <Button variant="outline" className="w-full h-12 text-foreground justify-start border-input hover:bg-accent"> {/* Matched h-12 */}
          <FacebookIcon />
          <span className="flex-grow text-center">Sign up with Facebook</span>
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground"> {/* Matched mt-6 */}
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
