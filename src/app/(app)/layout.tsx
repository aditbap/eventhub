
'use client';

import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'; // New import
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // New imports for context and layout
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background"> {/* Outer container */}
        <DesktopSidebar />
        {/* SidebarInset is a <main> tag by default.
            pb-16 for mobile to avoid overlap with BottomNavigationBar.
            md:pb-0 since BottomNavigationBar is hidden on desktop.
        */}
        <SidebarInset className="flex-grow pb-16 md:pb-0">
          {children}
        </SidebarInset>
      </div>
      <BottomNavigationBar /> {/* Remains for mobile */}
    </SidebarProvider>
  );
}
