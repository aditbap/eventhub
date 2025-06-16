
'use client';

import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { DesktopFloatingNav } from '@/components/layout/DesktopFloatingNav';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If not loading and no user, redirect to login, unless already on an auth page
        // This primarily handles cases where a user tries to access an app page directly without being logged in.
        // The more comprehensive redirect logic (including for username) is in AuthContext.
        if (pathname !== '/login' && pathname !== '/register' && pathname !== '/reset-password' && pathname !== '/set-username') {
            router.replace('/login');
        }
      } else if (user && !user.username && pathname !== '/set-username') {
        // If user is logged in but has no username, and not already on set-username page, redirect.
        router.replace('/set-username');
      }
    }
  }, [user, loading, router, pathname]);

  // Show loader if auth is loading OR if user exists but username is missing (and not on set-username page)
  // This prevents content flash before redirect to /set-username
  if (loading || (user && !user.username && pathname !== '/set-username')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If after loading, there's no user, and we're not on an auth page (which AppLayout doesn't cover),
  // it means the user tried to access an app page directly. The useEffect above should have redirected.
  // However, to prevent rendering children if redirection is in flight or hasn't happened yet for some reason:
  if (!user) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <> 
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow pb-16 md:pb-24"> 
          {children}
        </main>
      </div>
      <BottomNavigationBar /> 
      <DesktopFloatingNav /> 
    </>
  );
}
