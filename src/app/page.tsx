'use client';

import { UpjLogo } from '@/components/icons/UpjLogo';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/explore');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
      </div>
    );
  }

  // If a user is found after loading, they will be redirected by the useEffect.
  // This explicit check can provide a loader during the brief moment before redirection.
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
      </div>
    );
  }

  // Display the splash screen for non-authenticated users
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-6">
      <UpjLogo className="h-24 w-auto" fill="white" /> {/* Logo is larger and centered */}
    </div>
  );
}
