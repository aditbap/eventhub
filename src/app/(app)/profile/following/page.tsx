
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FollowingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Following</h1>
        <div className="w-9 h-9"></div> {/* Spacer */}
      </header>

      <main className="p-4">
        <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" strokeWidth={1.5}/>
          <p className="text-xl font-semibold text-muted-foreground">Feature Coming Soon</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            You'll be able to see who you're following here. Stay tuned!
          </p>
          <Button onClick={() => router.push('/explore')} className="mt-6">
            Explore People & Events
          </Button>
        </div>
      </main>
    </div>
  );
}
