
'use client';

import { UpjLogo } from '@/components/icons/UpjLogo';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Timer for splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  // Redirection logic based on auth state and splash visibility
  useEffect(() => {
    // If splash is visible or auth is still loading its initial state, wait.
    if (isSplashVisible || authLoading) {
      return;
    }

    // Auth has completed its initial load and splash duration is over
    if (user) {
      router.replace('/explore'); // User is logged in, go to home/explore
    } else {
      router.replace('/login'); // User is not logged in, go to login
    }
  }, [user, authLoading, isSplashVisible, router]);

  // If splash is visible OR auth is still in its initial loading phase, show the splash screen.
  if (isSplashVisible || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-6">
        <UpjLogo className="h-24 w-auto animate-pulse" fill="white" />
      </div>
    );
  }

  // After splash duration and initial auth loading, redirection should be happening.
  // Show a loader as a fallback during the brief redirection period.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
    </div>
  );
}
