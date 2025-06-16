
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { UpjLogo } from '@/components/icons/UpjLogo';

export default function SetUsernamePage() {
  const { user, loading: authLoading, updateUserUsername } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.username) {
      // If user already has a username, redirect them away from this page
      router.replace('/explore');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Username cannot be empty.');
      setIsLoading(false);
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
      setError('Username must be 3-20 characters, lowercase letters, numbers, or underscores only.');
      setIsLoading(false);
      return;
    }

    const result = await updateUserUsername(trimmedUsername);

    if (result.success) {
      toast({
        title: 'Username Set Successfully!',
        description: `Welcome, @${trimmedUsername}!`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      router.push('/explore'); // Redirect to explore or profile page
    } else {
      setError(result.error?.message || 'Failed to set username. Please try again.');
    }
    setIsLoading(false);
  };
  
  // If auth is still loading, or if user somehow lands here but already has a username (should be redirected by useEffect)
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in (e.g. direct navigation or logout), redirect to login
  if (!user) {
    router.replace('/login');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
            <UpjLogo className="h-20 w-auto" fill="hsl(var(--primary))" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold">Choose Your Username</h1>
          <p className="mt-2 text-muted-foreground">
            This will be your unique identifier across UPJ Event Hub.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username" className="sr-only">
              Username
            </Label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="pl-10 h-12 text-base"
                    placeholder="e.g., eventlover_upj"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())} // Force lowercase
                    disabled={isLoading}
                    autoFocus
                />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              3-20 characters. Lowercase letters, numbers, and underscores only.
            </p>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || !username.trim()}>
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Saving...' : 'Save Username'}
          </Button>
        </form>
         <p className="mt-4 text-center text-xs text-muted-foreground">
            You can change your display name later in your profile settings.
        </p>
      </div>
    </div>
  );
}
