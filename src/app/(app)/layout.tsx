'use client';

import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { DesktopFloatingNav } from '@/components/layout/DesktopFloatingNav'; // New import
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <> {/* Using React Fragment as the direct parent */}
      <div className="flex flex-col min-h-screen bg-background"> {/* Main content container */}
        {/* 
          Adjusted padding-bottom for main content:
          pb-16 for mobile (BottomNavigationBar height)
          md:pb-24 for desktop (to give space for DesktopFloatingNav which is 'bottom-6' plus its height)
        */}
        <main className="flex-grow pb-16 md:pb-24"> 
          {children}
        </main>
      </div>
      <BottomNavigationBar /> {/* For mobile, hidden on md and up */}
      <DesktopFloatingNav /> {/* For desktop, hidden on screens smaller than md */}
    </>
  );
}
