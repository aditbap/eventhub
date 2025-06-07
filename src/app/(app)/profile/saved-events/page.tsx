
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Bookmark, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { eventStore } from '@/lib/eventStore';
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem'; 
import Link from 'next/link';

export default function SavedEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // No specific user check for saved events as bookmarks are client-side for now
    // but authLoading check is good practice if this page were to become protected.
    if (authLoading) return; 

    const fetchAndSetSavedEvents = () => {
      setLoadingEvents(true);
      const allEvents = eventStore.getEvents(); // Gets events sorted by date desc
      const userSavedEvents = allEvents.filter(event => event.isBookmarked === true);
      // Optional: re-sort if needed, e.g., by bookmark date or keep as is (event date desc)
      setSavedEvents(userSavedEvents);
      setLoadingEvents(false);
    };

    const unsubscribe = eventStore.subscribe(fetchAndSetSavedEvents);
    fetchAndSetSavedEvents(); // Initial fetch

    return () => unsubscribe(); // Cleanup subscription
  }, [authLoading]);

  if (authLoading || loadingEvents) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Saved Events</h1>
        <div className="w-9 h-9"></div> {/* Spacer */}
      </header>

      <main className="p-4">
        {savedEvents.length > 0 ? (
          <div className="space-y-4">
            {savedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} passHref>
                <AllEventsEventItem event={event} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg text-muted-foreground">You haven't saved any events yet.</p>
            <p className="text-sm text-muted-foreground">Explore events and tap the bookmark icon to save them!</p>
            <Button onClick={() => router.push('/explore')} className="mt-6">
              <Search className="mr-2 h-5 w-5" />
              Explore Events
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
