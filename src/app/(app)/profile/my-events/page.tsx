
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CalendarPlus, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { eventStore } from '@/lib/eventStore';
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem'; // Reusing this component
import Link from 'next/link';

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    if (user) {
      const fetchAndSetMyEvents = () => {
        setLoadingEvents(true);
        const allEvents = eventStore.getEvents(); // Gets events sorted by date desc
        const userCreatedEvents = allEvents.filter(event => event.creatorId === user.uid);
        // Optional: re-sort if needed, e.g., by creation date or keep as is (event date desc)
        setMyEvents(userCreatedEvents);
        setLoadingEvents(false);
      };

      const unsubscribe = eventStore.subscribe(fetchAndSetMyEvents);
      fetchAndSetMyEvents(); // Initial fetch

      return () => unsubscribe(); // Cleanup subscription
    } else if (!authLoading) {
      setLoadingEvents(false);
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && loadingEvents)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground">Please log in to view your events.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">My Created Events</h1>
        <div className="w-9 h-9"></div> {/* Spacer */}
      </header>

      <main className="p-4">
        {loadingEvents ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : myEvents.length > 0 ? (
          <div className="space-y-4">
            {myEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} passHref>
                <AllEventsEventItem event={event} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
            <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg text-muted-foreground">You haven't created any events yet.</p>
            <p className="text-sm text-muted-foreground">Ready to host something amazing?</p>
            <Button onClick={() => router.push('/create')} className="mt-6">
              <CalendarPlus className="mr-2 h-5 w-5" />
              Create New Event
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
