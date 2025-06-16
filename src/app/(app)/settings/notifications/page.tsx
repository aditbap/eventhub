
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationSettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Notification Settings</h1>
        <div className="w-9 h-9"></div> {/* Spacer */}
      </header>

      <main className="p-4">
        <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
          <SlidersHorizontal className="h-16 w-16 mx-auto text-muted-foreground mb-4" strokeWidth={1.5}/>
          <p className="text-xl font-semibold text-muted-foreground">Detailed Settings Coming Soon</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            We're working on bringing you more granular control over your notifications.
          </p>
           <Button onClick={() => router.push('/notifications')} className="mt-6">
            Back to Notifications
          </Button>
        </div>
      </main>
    </div>
  );
}
