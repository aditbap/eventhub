
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // For user context if needed for future server-side bookmarks
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Bookmark, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { eventStore } from '@/lib/eventStore'; // Still used for client-side bookmark management
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem'; 
import Link from 'next/link';
import { db } from '@/lib/firebase'; // Import db
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'; // Firestore imports
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


export default function SavedEventsPage() {
  const { user, loading: authLoading } = useAuth(); // user might be needed if bookmarks become server-side
  const [savedEventsFromStore, setSavedEventsFromStore] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true); // For initial loading from Firestore
  const router = useRouter();

  // Fetch all events from Firestore first, then filter by local bookmark status
  useEffect(() => {
    const fetchAllEventsAndFilterSaved = async () => {
      setLoadingEvents(true);
      try {
        const eventsColRef = collection(db, 'events');
        const q = query(eventsColRef, orderBy('date', 'desc')); // Example: order by date
        const querySnapshot = await getDocs(q);
        const allFetchedEvents: Event[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: formatFirestoreDate(data.date),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined,
            // isBookmarked will be determined by eventStore
          } as Event;
        });
        
        // Update eventStore with all events (if not already up-to-date)
        // This ensures eventStore has the latest event data to check against for bookmarks
        eventStore.setEvents(allFetchedEvents); 
        
        // Now get events from store, which will include local bookmark status
        const currentEventsInStore = eventStore.getEvents();
        const userSavedEvents = currentEventsInStore.filter(event => event.isBookmarked === true);
        setSavedEventsFromStore(userSavedEvents);

      } catch (error) {
        console.error("Error fetching events for saved list:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchAllEventsAndFilterSaved();

    // Subscribe to eventStore updates to reflect bookmark changes made on other pages
    const handleStoreUpdate = () => {
       const currentEventsInStore = eventStore.getEvents();
       const userSavedEvents = currentEventsInStore.filter(event => event.isBookmarked === true);
       setSavedEventsFromStore(userSavedEvents);
    };
    const unsubscribe = eventStore.subscribe(handleStoreUpdate);
    return () => unsubscribe();
  }, []);


  if (authLoading || loadingEvents) { // Show loader if auth is loading OR initial events fetch is happening
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
        {savedEventsFromStore.length > 0 ? (
          <div className="space-y-4">
            {savedEventsFromStore.map((event) => (
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
