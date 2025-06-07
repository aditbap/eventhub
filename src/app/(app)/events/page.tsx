
'use client';

import { useState, useEffect, Suspense } from 'react';
import type { Event } from '@/types';
import { eventStore } from '@/lib/eventStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Filter as FilterIcon, Gift, Ticket, X as XIcon } from 'lucide-react';
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

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ category: Event['category'] | 'All' }>({ category: 'All' });
  const [tempFilters, setTempFilters] = useState<{ category: Event['category'] | 'All' }>({ category: 'All' });

  useEffect(() => {
    const eventsFromStore = eventStore.getEvents(); // Already sorted by date desc
    setAllEvents(eventsFromStore);
  }, []);

  // Effect to initialize searchQuery from URL
  useEffect(() => {
    const queryFromUrl = searchParams.get('search');
    if (queryFromUrl) {
      setSearchQuery(decodeURIComponent(queryFromUrl));
      setSearchActive(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let currentEvents = [...allEvents];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      currentEvents = currentEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (activeFilters.category !== 'All') {
      currentEvents = currentEvents.filter(event => event.category === activeFilters.category);
    }

    // Events are already sorted by date descending from eventStore, so no need to re-sort unless criteria change
    setFilteredEvents(currentEvents);
  }, [searchQuery, allEvents, activeFilters]);

  const handleSearchIconClick = () => {
    setSearchActive(true);
  };

  const handleCloseSearchClick = () => {
    setSearchActive(false);
    setSearchQuery('');
    // Optionally update URL to remove search param
    router.replace('/events');
  };

  const handleFilterIconClick = () => {
    setTempFilters(activeFilters); // Initialize sheet with current active filters
    setIsFilterSheetOpen(true);
  };

  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    setIsFilterSheetOpen(false);
  };

  const handleClearFiltersInSheet = () => {
    setTempFilters({ category: 'All' });
  };

  const handleCategoryChangeInSheet = (category: string) => {
    setTempFilters(prev => ({ ...prev, category: category as Event['category'] | 'All' }));
  };
  
  const currentEventsToDisplay = filteredEvents;

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
              onClick={() => alert('Invite functionality to be implemented!')}
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
          {currentEventsToDisplay.length > 0 ? (
            currentEventsToDisplay.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} passHref>
                <AllEventsEventItem event={event} />
              </Link>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchQuery.trim() !== '' || activeFilters.category !== 'All'
                  ? 'No events match your search or filter criteria.'
                  : 'No events found.'}
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
            {/* Placeholder for more filters like date range or price */}
            {/* 
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Date Range</Label>
              <p className="text-sm text-muted-foreground">Date picker coming soon...</p>
            </div>
            */}
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
    </div>
  );
}

// It's good practice to wrap the page content in Suspense when using useSearchParams
// as it might suspend during initial render or navigation.
export default function AllEventsPage() {
  return (
    <Suspense fallback={<div>Loading search results...</div>}>
      <EventsPageContent />
    </Suspense>
  );
}

    