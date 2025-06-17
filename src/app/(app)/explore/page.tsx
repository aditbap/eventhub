
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import type { Event } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/events/EventCard';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { SearchIcon, SlidersHorizontal, Bell, ChevronDown, MapPinIcon as LocationIcon, Loader2, ChevronRight, X } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from 'next/link';
import { UpjLogo } from '@/components/icons/UpjLogo';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { eventStore } from '@/lib/eventStore';
import { motion } from 'framer-motion';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

// Helper to convert Firestore timestamp to JS Date, then to YYYY-MM-DD string
const formatFirestoreDate = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return format(timestamp.toDate(), 'yyyy-MM-dd');
  }
  // If it's already a string (e.g. YYYY-MM-DD) or Date object, handle appropriately
  if (typeof timestamp === 'string') return timestamp; // Assume it's already YYYY-MM-DD
  if (timestamp instanceof Date) return format(timestamp, 'yyyy-MM-dd');
  return format(new Date(), 'yyyy-MM-dd'); // Fallback, should not happen
};


export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Event['category'] | 'All'>('All');
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [allEventsFromStore, setAllEventsFromStore] = useState<Event[]>([]); // For events managed by eventStore (bookmarks)
  const [eventsForDisplay, setEventsForDisplay] = useState<Event[]>([]); // For filtered events

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const router = useRouter();

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const eventsColRef = collection(db, 'events');
        // Order by date ascending to easily find upcoming ones
        const q = query(eventsColRef, orderBy('date', 'asc')); // Corrected: firestoreQuery -> query
        const querySnapshot = await getDocs(q);
        const fetchedEvents: Event[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: formatFirestoreDate(data.date), // Ensure date is YYYY-MM-DD string
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined,
            // isBookmarked will be set from eventStore later
          } as Event;
        });
        
        eventStore.setEvents(fetchedEvents); // Update eventStore with Firestore data
        // We don't setAllEventsFromStore here directly, it's managed by subscribe
        // setEventsForDisplay will be updated by the filtering useEffect
      } catch (error) {
        console.error("Error fetching events from Firestore:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Subscribe to eventStore updates for bookmark changes
   useEffect(() => {
    const handleStoreUpdate = () => {
      setAllEventsFromStore(eventStore.getEvents());
    };
    const unsubscribe = eventStore.subscribe(handleStoreUpdate);
    handleStoreUpdate(); // Initial sync
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    setLoadingLocation(true);
    setTimeout(() => { // Simulate location fetching
      setUserLocation('Bintaro'); 
      setLoadingLocation(false);
    }, 500);
  }, []);

  // Filter events for display based on category and data from eventStore (which now has Firestore data + bookmarks)
  useEffect(() => {
    let eventsToFilter = [...allEventsFromStore];

    if (currentCategory !== 'All') {
      eventsToFilter = eventsToFilter.filter(event => event.category === currentCategory);
    }
    
    // Already sorted by date from Firestore query if needed, or re-sort here
    // For "Upcoming" and "Near You", specific date filtering is done below.
    setEventsForDisplay(eventsToFilter);
  }, [allEventsFromStore, currentCategory]);


  const today = startOfDay(new Date());
  const sevenDaysFromNowTarget = endOfDay(addDays(today, 6)); // End of the 7th day from today

  const upcomingEvents = eventsForDisplay
    .filter(event => {
      const eventDate = startOfDay(new Date(event.date)); // Compare start of day
      return eventDate >= today && eventDate <= sevenDaysFromNowTarget;
    })
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort soonest first
    .slice(0, 5);

  const nearYouEvents = eventsForDisplay
    .filter(e => {
      const eventDate = startOfDay(new Date(e.date));
      const isFutureOrToday = eventDate >= today; 
      const hasFewOrNoAttendees = !e.attendanceCount || e.attendanceCount < 5; // Example criteria
      const isLocationMatch = userLocation && e.location && e.location.toLowerCase().includes(userLocation.toLowerCase());
      return isFutureOrToday && isLocationMatch && hasFewOrNoAttendees; 
    })
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort soonest first
    .slice(0, 5);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/events'); 
    }
  };

  const showSkeletons = isLoadingEvents || loadingLocation;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-14">
          <Link href="/explore" aria-label="Go to Explore page">
            <UpjLogo iconOnly={true} className="h-8 w-auto" fill="hsl(var(--primary-foreground))" />
          </Link>
          <div className="text-center">
            <p className="text-xs opacity-80">Current Location</p>
            {loadingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              <div className="flex items-center font-semibold">
                <LocationIcon className="h-4 w-4 mr-1" />
                {userLocation || 'Bintaro'} <ChevronDown className="h-4 w-4 ml-1" />
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/20 relative"
            onClick={() => router.push('/notifications')}
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            {/* This notification dot could be driven by actual unread notifications count */}
            <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-primary" />
          </Button>
        </div>
        <div className="container mx-auto -mb-10 relative z-10 mt-3">
          <form onSubmit={handleSearchSubmit} className="bg-card p-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground ml-3 flex-shrink-0" />
            <Input
              type="search"
              placeholder="Search events, food, sports..."
              className="flex-grow border-none focus:ring-0 pl-1 text-sm shadow-none bg-transparent h-9 text-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="button" 
              variant="ghost"
              className="text-primary p-2.5 rounded-md hover:bg-primary/10 h-9 w-9"
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex-grow pt-16 pb-20"
      >
        <div className="container mx-auto px-4">
          <CategoryFilter currentCategory={currentCategory} onSelectCategory={(cat) => setCurrentCategory(cat)} />

          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-headline font-semibold">Upcoming Events</h2>
              <Link href="/events" className="text-sm text-primary font-medium flex items-center">
                See All <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </div>
            {showSkeletons ? (
              <div className="flex space-x-4 pb-4"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> // Basic skeleton
            ) : upcomingEvents.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap rounded-md -mx-1 px-1">
                <div className="flex space-x-4 pb-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="w-[280px] h-full flex-shrink-0">
                        <EventCard event={event} variant="upcoming" />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming events found for this category.</p>
            )}
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-headline font-semibold">Near You</h2>
               <Link href="/events" className="text-sm text-primary font-medium flex items-center">
                See All <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </div>
            {showSkeletons ? (
                <div className="space-y-3"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> // Basic skeleton
            ) : nearYouEvents.length > 0 ? (
              <div className="space-y-3">
                {nearYouEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="nearYou" />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No new events found near you for this category.</p>
            )}
          </section>
        </div>
      </main>

      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent className="w-[320px] sm:w-[400px]">
          <SheetHeader className="mb-6">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your event search using the options below.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            {/* Filter controls will be added here */}
            <div className="space-y-2">
              <Label htmlFor="filter-date">Date Range</Label>
              <Input id="filter-date" placeholder="Select dates (e.g., DatePicker)" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-price">Price Range</Label>
              <Input id="filter-price" placeholder="e.g., Free, $0-$20 (e.g., Slider)" disabled />
            </div>
             <div className="space-y-2">
              <Label htmlFor="filter-location">Specific Location</Label>
              <Input id="filter-location" placeholder="e.g., Enter a specific venue or area" disabled />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              (More filter controls will be added here)
            </p>
          </div>
          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={() => setIsFilterSheetOpen(false)} className="w-full sm:w-auto">
              Clear Filters
            </Button>
            <Button onClick={() => setIsFilterSheetOpen(false)} className="w-full sm:w-auto">
              Apply Filters
            </Button>
          </SheetFooter>
           <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </SheetClose>
        </SheetContent>
      </Sheet>

    </div>
  );
}
