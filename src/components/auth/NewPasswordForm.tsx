
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
import { Loader2, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' })
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function NewPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    try {
      // In a real app, you would call Firebase's confirmPasswordReset here
      // For example: await auth.confirmPasswordReset(oobCode, values.newPassword);
      // oobCode would typically come from URL query parameters.
      console.log('New password set (simulated):', values.newPassword);
      
      toast({
        title: 'Password Updated Successfully!',
        description: 'Your password has been changed. You can now log in with your new password.',
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Set new password error:', err);
      setError(err.message || 'Failed to set new password. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to set new password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full space-y-8 py-8">
      <div className="text-left">
        <h1 className="text-3xl font-headline font-bold">Set New Password</h1>
        <p className="text-muted-foreground mt-2">
          Create a new, strong password for your account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
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
          
          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base mt-4" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SET NEW PASSWORD'}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </form>
      </Form>
    </div>
  );
}
