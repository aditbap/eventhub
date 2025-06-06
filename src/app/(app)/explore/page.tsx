
'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/events/EventCard';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { SearchIcon, SlidersHorizontal, Menu, Bell, ChevronDown, MapPinIcon as LocationIcon, Loader2, ChevronRight, X } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from 'next/link';
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

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Event['category'] | 'All'>('All');
  const [userLocation, setUserLocation] = useState<string | null>(null); // Renamed for clarity
  const [loadingLocation, setLoadingLocation] = useState(true);

  const [allEvents, setAllEvents] = useState<Event[]>(() => eventStore.getEvents());
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleStoreUpdate = () => {
      setAllEvents(eventStore.getEvents());
    };
    const unsubscribe = eventStore.subscribe(handleStoreUpdate);
    handleStoreUpdate();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoadingLocation(true);
    setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setUserLocation('Bintaro'); // Hardcoded for now, replace with actual location data if available
            setLoadingLocation(false);
          },
          () => {
            setUserLocation('Bintaro'); // Fallback
            setLoadingLocation(false);
          },
          { timeout: 3000 }
        );
      } else {
        setUserLocation('Bintaro'); // Fallback
        setLoadingLocation(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    let eventsToFilter = [...allEvents];

    if (currentCategory !== 'All') {
      eventsToFilter = eventsToFilter.filter(event => event.category === currentCategory);
    }

    if (searchQuery) {
      eventsToFilter = eventsToFilter.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    eventsToFilter.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setFilteredEvents(eventsToFilter);
  }, [allEvents, searchQuery, currentCategory]);

  const upcomingEvents = filteredEvents
    .filter(e => new Date(e.date) >= new Date() && e.attendees && e.attendees.length > 0)
    .slice(0, 5);

  const nearYouEvents = filteredEvents
    .filter(e => {
      const isUpcoming = new Date(e.date) >= new Date();
      const hasFewOrNoAttendees = !e.attendees || e.attendees.length === 0;
      const isLocationMatch = userLocation && e.location && e.location.toLowerCase().includes(userLocation.toLowerCase());
      return isUpcoming && isLocationMatch && hasFewOrNoAttendees; // Prioritize location match for new/less crowded events
    })
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-14">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20">
            <Menu className="h-6 w-6" />
          </Button>
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
            <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-primary" />
          </Button>
        </div>
        <div className="container mx-auto -mb-10 relative z-10 mt-3">
          <div className="bg-card p-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground ml-3 flex-shrink-0" />
            <Input
              type="search"
              placeholder="Search events, food, sports..."
              className="flex-grow border-none focus:ring-0 pl-1 text-sm shadow-none bg-transparent h-9 text-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="ghost"
              className="text-primary p-2.5 rounded-md hover:bg-primary/10 h-9 w-9"
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-16 pb-20">
        <div className="container mx-auto px-4">
          <CategoryFilter currentCategory={currentCategory} onSelectCategory={(cat) => setCurrentCategory(cat)} />

          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-headline font-semibold">Upcoming Events</h2>
              <Link href="/events" className="text-sm text-primary font-medium flex items-center">
                See All <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </div>
            {upcomingEvents.length > 0 ? (
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
              <p className="text-muted-foreground text-center py-4">No upcoming events found for this category or search.</p>
            )}
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-headline font-semibold">Near You</h2>
              <Link href="/events" className="text-sm text-primary font-medium flex items-center">
                See All <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </div>
            {nearYouEvents.length > 0 ? (
              <div className="space-y-3">
                {nearYouEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="nearYou" />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No events found near you for this category or search.</p>
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
