
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
import { Label } from '@/components/ui/label'; // For future filter controls

// Mock data for events - extended with attendees
const MOCK_EVENTS: Event[] = [
  { 
    id: '1', 
    title: 'UPJ Concert', 
    description: 'An amazing summer music festival.', 
    date: '2024-08-15', // Future date
    time: '18:00', 
    location: 'UPJ Bintaro', 
    category: 'Music', 
    imageUrl: 'https://placehold.co/300x200.png', 
    imageHint: 'concert stage', 
    attendanceCount: 235, 
    price: 50,
    attendees: [
      { id: 'a1', avatarUrl: 'https://placehold.co/32x32.png?text=A', name: 'User A' },
      { id: 'a2', avatarUrl: 'https://placehold.co/32x32.png?text=B', name: 'User B' },
      { id: 'a3', avatarUrl: 'https://placehold.co/32x32.png?text=C', name: 'User C' },
    ]
  },
  { 
    id: '2', 
    title: 'Forkalympics', 
    description: 'Taste the best food trucks in town.', 
    date: '2024-09-18', // Future date
    time: '12:00', 
    location: 'UPJ Bintaro', 
    category: 'Sports', 
    imageUrl: 'https://placehold.co/300x200.png', 
    imageHint: 'sports crowd', 
    attendanceCount: 217, 
    price: 0,
    attendees: [
      { id: 'b1', avatarUrl: 'https://placehold.co/32x32.png?text=D', name: 'User D' },
      { id: 'b2', avatarUrl: 'https://placehold.co/32x32.png?text=E', name: 'User E' },
      { id: 'b3', avatarUrl: 'https://placehold.co/32x32.png?text=F', name: 'User F' },
    ]
  },
  { 
    id: '3', 
    title: 'Malam Minggu Concert', 
    description: 'Run for a cause!', 
    date: '2024-08-01', // Future date
    time: '19:00', 
    location: 'Bintaro Xchange', 
    category: 'Music', 
    imageUrl: 'https://placehold.co/100x100.png', 
    imageHint: 'female singer', 
    attendanceCount: 500, 
    price: 10 
  },
  { 
    id: '4', 
    title: 'AI Showtime', 
    description: 'Latest in tech innovations.', 
    date: '2024-10-01', // Future date
    time: '10:00', 
    location: 'Online', 
    category: 'Tech', 
    imageUrl: 'https://placehold.co/100x100.png', 
    imageHint: 'tech desk', 
    attendanceCount: 300, 
    price: 100 
  },
  { id: '5', title: 'Local Indie Night', description: 'Discover local indie bands.', date: '2024-08-28', time: '20:00', location: 'Coffee Town Bintaro', category: 'Music', imageUrl: 'https://placehold.co/300x200.png', imageHint: 'indie band', attendanceCount: 150, price: 15,
    attendees: [
      { id: 'c1', avatarUrl: 'https://placehold.co/32x32.png?text=G', name: 'User G' },
      { id: 'c2', avatarUrl: 'https://placehold.co/32x32.png?text=H', name: 'User H' },
    ]
  },
  { id: '6', title: 'Startup Pitch Battle', description: 'Watch startups compete.', date: '2024-09-10', time: '09:00', location: 'UPJ Auditorium', category: 'Tech', imageUrl: 'https://placehold.co/300x200.png', imageHint: 'startup pitch', attendanceCount: 250, price: 25,
    attendees: [
      { id: 'd1', avatarUrl: 'https://placehold.co/32x32.png?text=I', name: 'User I' },
      { id: 'd2', avatarUrl: 'https://placehold.co/32x32.png?text=J', name: 'User J' },
      { id: 'd3', avatarUrl: 'https://placehold.co/32x32.png?text=K', name: 'User K' },
    ]
  },
  { 
    id: '7', 
    title: 'Weekend Food Bazaar', 
    description: 'Explore diverse culinary delights at our weekend food bazaar. Many stalls to choose from!', 
    date: '2024-09-21', 
    time: '11:00', 
    location: 'City Park Bintaro', 
    category: 'Food', 
    imageUrl: 'https://placehold.co/300x200.png', 
    imageHint: 'food bazaar', 
    attendanceCount: 180, 
    price: 5,
    attendees: [
      { id: 'e1', avatarUrl: 'https://placehold.co/32x32.png?text=L', name: 'User L' },
      { id: 'e2', avatarUrl: 'https://placehold.co/32x32.png?text=M', name: 'User M' },
    ]
  },
  { 
    id: '8', 
    title: 'Intro to Coding Workshop', 
    description: 'Learn the basics of coding in this interactive workshop. No prior experience needed.', 
    date: '2024-10-05', 
    time: '10:00', 
    location: 'Community Hub UPJ', 
    category: 'Tech', 
    imageUrl: 'https://placehold.co/100x100.png', 
    imageHint: 'coding workshop', 
    attendanceCount: 75, 
    price: 0 
  },
  {
    id: '9',
    title: 'Jazz Night Serenade',
    description: 'Relax with smooth jazz tunes under the stars.',
    date: '2024-11-12',
    time: '19:30',
    location: 'Rooftop Lounge Bintaro',
    category: 'Music',
    imageUrl: 'https://placehold.co/300x200.png',
    imageHint: 'jazz music',
    attendanceCount: 120,
    price: 75,
    attendees: [
        { id: 'f1', avatarUrl: 'https://placehold.co/32x32.png?text=N', name: 'User N' },
        { id: 'f2', avatarUrl: 'https://placehold.co/32x32.png?text=O', name: 'User O' },
    ]
  },
  {
    id: '10',
    title: 'Street Food Fiesta',
    description: 'A vibrant gathering of street food vendors.',
    date: '2024-10-25',
    time: '16:00',
    location: 'Bintaro Town Square',
    category: 'Food',
    imageUrl: 'https://placehold.co/300x200.png',
    imageHint: 'street food',
    attendanceCount: 300,
    price: 0,
    attendees: [
        { id: 'g1', avatarUrl: 'https://placehold.co/32x32.png?text=P', name: 'User P' },
        { id: 'g2', avatarUrl: 'https://placehold.co/32x32.png?text=Q', name: 'User Q' },
        { id: 'g3', avatarUrl: 'https://placehold.co/32x32.png?text=R', name: 'User R' },
    ]
  },
  {
    id: '11',
    title: 'Morning Run Club',
    description: 'Join us for a refreshing morning run.',
    date: '2024-08-20',
    time: '06:00',
    location: 'UPJ jogging track',
    category: 'Sports',
    imageUrl: 'https://placehold.co/100x100.png',
    imageHint: 'running group',
    attendanceCount: 45,
    price: 0
  },
  {
    id: '12',
    title: 'Digital Art Workshop',
    description: 'Unleash your creativity with digital tools.',
    date: '2024-11-05',
    time: '13:00',
    location: 'Creative Lab UPJ',
    category: 'Tech',
    imageUrl: 'https://placehold.co/100x100.png',
    imageHint: 'digital art',
    attendanceCount: 60,
    price: 20
  }
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Event['category'] | 'All'>('All');
  const [location, setLocation] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    setLoadingLocation(true);
    setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocation('Bintaro'); 
            setLoadingLocation(false);
          },
          () => {
            setLocation('Bintaro'); 
            setLoadingLocation(false);
          },
          { timeout: 3000 }
        );
      } else {
        setLocation('Bintaro'); 
        setLoadingLocation(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    let events = MOCK_EVENTS;
    
    if (currentCategory !== 'All') {
      events = events.filter(event => event.category === currentCategory);
    }

    if (searchQuery) {
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredEvents(events);
  }, [searchQuery, currentCategory]);

  const upcomingEvents = filteredEvents
    .filter(e => new Date(e.date) >= new Date() && e.attendees && e.attendees.length > 0)
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5); 

  const nearYouEvents = filteredEvents
    .filter(e => new Date(e.date) >= new Date() && (!e.attendees || e.attendees.length === 0))
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
                {location || 'Bintaro'} <ChevronDown className="h-4 w-4 ml-1" />
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 relative">
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
            {/* Placeholder for filter options */}
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

