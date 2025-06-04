'use client';

import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter }_from 'next/navigation'; // Corrected import
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
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pb-16 md:pb-0"> {/* Add padding-bottom for mobile nav */}
        {children}
      </main>
      <BottomNavigationBar />
    </div>
  );
}
