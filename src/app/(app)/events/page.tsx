
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import type { Event } from '@/types';
import { eventStore } from '@/lib/eventStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Filter as FilterIcon, Gift, Ticket, X as XIcon, Loader2 } from 'lucide-react';
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShareSheet } from '@/components/sharing/ShareSheet';
import { motion } from 'framer-motion';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, where, startAt, endAt } from 'firebase/firestore';
import { format, startOfDay } from 'date-fns';

// Helper to convert Firestore timestamp to JS Date, then to YYYY-MM-DD string
const formatFirestoreDate = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return format(timestamp.toDate(), 'yyyy-MM-dd');
  }
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp instanceof Date) return format(timestamp, 'yyyy-MM-dd');
  return format(new Date(), 'yyyy-MM-dd'); // Fallback
};


const filterCategories: Array<{ value: Event['category'] | 'All', label: string }> = [
  { value: 'All', label: 'All Categories' },
  { value: 'Music', label: 'Music' },
  { value: 'Food', label: 'Food' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Tech', label: 'Tech' },
  { value: 'Other', label: 'Other' },
];

function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [allEventsFromStore, setAllEventsFromStore] = useState<Event[]>([]); // For events from eventStore (after Firestore fetch)
  const [filteredEventsForDisplay, setFilteredEventsForDisplay] = useState<Event[]>([]);

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ category: Event['category'] | 'All' }>({ category: 'All' });
  const [tempFilters, setTempFilters] = useState<{ category: Event['category'] | 'All' }>({ category: 'All' });

  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Fetch events from Firestore and populate eventStore
  const fetchAndSetEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const eventsColRef = collection(db, 'events');
      // Query upcoming or current events by default, ordered by date
      const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
      const q = firestoreQuery(
        eventsColRef, 
        where('date', '>=', todayStr), 
        orderBy('date', 'asc'), 
        orderBy('time', 'asc') // Secondary sort by time if available
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedEvents: Event[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: formatFirestoreDate(data.date),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined,
        } as Event;
      });
      
      eventStore.setEvents(fetchedEvents); // Update eventStore
    } catch (error) {
      console.error("Error fetching events from Firestore:", error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetEvents();
  }, [fetchAndSetEvents]);

  // Subscribe to eventStore updates (e.g., for bookmarks)
  useEffect(() => {
    const handleStoreUpdate = () => {
      setAllEventsFromStore(eventStore.getEvents());
    };
    const unsubscribe = eventStore.subscribe(handleStoreUpdate);
    handleStoreUpdate(); // Initial sync
    return () => unsubscribe();
  }, []);

  // Search query from URL
  useEffect(() => {
    const queryFromUrl = searchParams.get('search');
    if (queryFromUrl) {
      setSearchQuery(decodeURIComponent(queryFromUrl));
      setSearchActive(true);
    }
  }, [searchParams]);

  // Filter events for display whenever source data or filters change
  useEffect(() => {
    let currentEvents = [...allEventsFromStore]; // Start with events from store (which are from Firestore)
    const today = startOfDay(new Date());

    // Default: Filter out past events (already handled by Firestore query for initial load)
    // If allEventsFromStore could contain past events from other sources, uncomment:
    // currentEvents = currentEvents.filter(event => new Date(event.date) >= today);

    if (searchQuery.trim() !== '') {
      currentEvents = currentEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilters.category !== 'All') {
      currentEvents = currentEvents.filter(event => event.category === activeFilters.category);
    }
    
    // Sort: events from Firestore are already sorted by date ASC, time ASC.
    // If further client-side sorting is desired after filtering, add it here.
    setFilteredEventsForDisplay(currentEvents);
  }, [searchQuery, allEventsFromStore, activeFilters]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);


  const handleSearchIconClick = () => setSearchActive(true);
  const handleCloseSearchClick = () => {
    setSearchActive(false);
    setSearchQuery('');
    router.replace('/events');
  };
  const handleFilterIconClick = () => {
    setTempFilters(activeFilters);
    setIsFilterSheetOpen(true);
  };
  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    setIsFilterSheetOpen(false);
  };
  const handleClearFiltersInSheet = () => setTempFilters({ category: 'All' });
  const handleCategoryChangeInSheet = (category: string) => {
    setTempFilters(prev => ({ ...prev, category: category as Event['category'] | 'All' }));
  };
  
  const currentEventsToDisplay = filteredEventsForDisplay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="flex flex-col min-h-screen bg-background"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full h-16">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>

        {searchActive ? (
          <Input
            type="search"
            placeholder="Search events..."
            className="flex-grow mx-2 border-primary focus-visible:ring-primary h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        ) : (
          <h1 className="text-lg font-headline font-semibold text-foreground flex-grow text-center">Events</h1>
        )}

        <div className="flex items-center space-x-1">
          {searchActive ? (
            <Button variant="ghost" size="icon" onClick={handleCloseSearchClick} className="text-foreground hover:bg-muted/20 rounded-full">
              <XIcon className="h-6 w-6" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleSearchIconClick} className="text-foreground hover:bg-muted/20 rounded-full">
              <Search className="h-6 w-6" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleFilterIconClick} className="text-foreground hover:bg-muted/20 rounded-full" aria-label="Open event filters">
            <FilterIcon className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6 pb-20">
        <div className="relative rounded-xl overflow-hidden shadow-lg bg-emerald-100 p-6">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold font-headline mb-1 text-emerald-800">Invite your friends</h2>
            <p className="text-sm mb-4 text-emerald-700 opacity-90">Get #2000 for ticket</p>
            <Button
              variant="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-2.5 h-auto"
              onClick={() => setIsShareSheetOpen(true)}
            >
              INVITE
            </Button>
          </div>
          <Gift className="absolute right-4 top-1/2 -translate-y-1/2 h-20 w-20 text-emerald-400 opacity-50 transform rotate-12" />
          <Ticket className="absolute left-4 bottom-2 h-16 w-16 text-emerald-300 opacity-40 transform -rotate-12" />
          <Image
            src="https://placehold.co/300x150.png"
            alt="Invite friends illustration"
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 opacity-10 pointer-events-none z-0"
            data-ai-hint="gift party hands"
          />
        </div>

        <div className="space-y-4">
          {isLoadingEvents ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : currentEventsToDisplay.length > 0 ? (
            currentEventsToDisplay.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} passHref>
                <AllEventsEventItem event={event} />
              </Link>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchQuery.trim() !== '' || activeFilters.category !== 'All'
                  ? 'No upcoming events match your search or filter criteria.'
                  : 'No upcoming events found.'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim() !== '' || activeFilters.category !== 'All'
                  ? 'Try different keywords or adjust your filters.'
                  : 'Check back later or create a new event!'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent className="w-[320px] sm:w-[400px] flex flex-col">
          <SheetHeader className="mb-2">
            <SheetTitle>Filter Events</SheetTitle>
            <SheetDescription>
              Select criteria to refine your event list.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-grow overflow-y-auto py-4 space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">Category</Label>
              <RadioGroup
                value={tempFilters.category}
                onValueChange={handleCategoryChangeInSheet}
                className="space-y-2"
              >
                {filterCategories.map((category) => (
                  <div key={category.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={category.value} id={`filter-category-${category.value}`} />
                    <Label htmlFor={`filter-category-${category.value}`} className="font-normal">{category.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <SheetFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={handleClearFiltersInSheet} className="w-full sm:w-auto">
              Clear Filters
            </Button>
            <Button onClick={handleApplyFilters} className="w-full sm:w-auto">
              Apply Filters
            </Button>
          </SheetFooter>
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetContent>
      </Sheet>

      {shareUrl && (
        <ShareSheet
          isOpen={isShareSheetOpen}
          onClose={() => setIsShareSheetOpen(false)}
          eventTitle="Check out these cool events on UPJ Event Hub!"
          eventUrl={shareUrl}
        />
      )}
    </motion.div>
  );
}

export default function AllEventsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <EventsPageContent />
    </Suspense>
  );
}
