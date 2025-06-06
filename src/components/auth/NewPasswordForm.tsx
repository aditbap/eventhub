
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
import { useState, useEffect } from 'react';
import { Loader2, Lock, Eye, EyeOff, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

export function NewPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { changePassword, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login'); // Redirect if not logged in
    }
  }, [authLoading, user, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      setError("You must be logged in to change your password.");
      return;
    }
    setLoading(true);
    setError(null);
    
    const result = await changePassword(values.currentPassword, values.newPassword);

    if (result.success) {
      toast({
        title: 'Password Changed Successfully!',
        description: 'Your password has been updated.',
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      form.reset();
      setTimeout(() => {
        router.push('/settings'); 
      }, 1500);
    } else {
      setError(result.error?.message || 'Failed to change password. Please try again.');
      toast({
        title: 'Error Changing Password',
        description: result.error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }
  
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full space-y-8 py-8">
       <div className="absolute top-4 left-0">
        <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} aria-label="Go back to settings">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="pt-10 text-left">
        <h1 className="text-3xl font-headline font-bold">Change Your Password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your current password and a new password below.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type={showCurrentPassword ? 'text' : 'password'} 
                      placeholder="Current password" 
                      {...field} 
                      className="pl-10 pr-10 h-12 rounded-md border-input focus:border-primary"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type={showNewPassword ? 'text' : 'password'} 
                      placeholder="New password" 
                      {...field} 
                      className="pl-10 pr-10 h-12 rounded-md border-input focus:border-primary"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                      placeholder="Confirm new password" 
                      {...field} 
                      className="pl-10 pr-10 h-12 rounded-md border-input focus:border-primary"
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
          
          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base mt-4" disabled={loading || authLoading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'CHANGE PASSWORD'}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>
      </Form>
    </div>
  );
}
