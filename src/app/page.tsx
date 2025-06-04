'use client';

import { Button } from '@/components/ui/button';
import { UpjLogo } from '@/components/icons/UpjLogo';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-6 text-center">
      <UpjLogo className="h-20 w-auto mb-12" fill="white" />
      <h1 className="text-4xl font-headline font-bold text-white mb-4">Welcome to UPJ EventHub!</h1>
      <p className="text-lg text-primary-foreground mb-12 max-w-md">
        Discover, join, and manage events happening around UPN "Veteran" Jakarta.
      </p>
      <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
        {user ? (
          <Button asChild size="lg" variant="secondary" className="text-primary hover:bg-white/90">
            <Link href="/explore">Go to App</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg" variant="secondary" className="text-primary hover:bg-white/90">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              <Link href="/register">Register</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
