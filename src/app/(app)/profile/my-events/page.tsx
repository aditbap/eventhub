
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CalendarPlus, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Removed eventStore import for fetching events
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem';
import Link from 'next/link';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

// Helper to convert Firestore timestamp to JS Date, then to YYYY-MM-DD string
const formatFirestoreDate = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return format(timestamp.toDate(), 'yyyy-MM-dd');
  }
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp instanceof Date) return format(timestamp, 'yyyy-MM-dd');
  return format(new Date(), 'yyyy-MM-dd'); // Fallback
};

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
      const fetchMyEvents = async () => {
        setLoadingEvents(true);
        try {
          const eventsRef = collection(db, 'events');
          // Query events created by the current user, order by creation date or event date
          const q = query(eventsRef, where('creatorId', '==', user.uid), orderBy('createdAt', 'desc')); 
          // Alternative: orderBy('date', 'desc')
          
          const querySnapshot = await getDocs(q);
          const userCreatedEvents: Event[] = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              date: formatFirestoreDate(data.date),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined,
            } as Event;
          });
          setMyEvents(userCreatedEvents);
        } catch (error) {
            console.error("Error fetching user's events from Firestore:", error);
        } finally {
            setLoadingEvents(false);
        }
      };
      fetchMyEvents();
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
