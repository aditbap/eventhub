'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/events/EventCard';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { SearchIcon, SlidersHorizontal, Menu, Bell, ChevronDown, MapPinIcon as LocationIcon, Loader2, ChevronRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from 'next/link';

// Mock data for events - extended with attendees
const MOCK_EVENTS: Event[] = [
  { 
    id: '1', 
    title: 'UPJ Concert', 
    description: 'An amazing summer music festival.', 
    date: '2024-07-15', 
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
    date: '2024-08-18', 
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
    date: '2024-06-01', 
    time: '14:00', 
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
    date: '2024-05-01', 
    time: '10:00', 
    location: 'Online', 
    category: 'Tech', 
    imageUrl: 'https://placehold.co/100x100.png', 
    imageHint: 'tech desk', 
    attendanceCount: 300, 
    price: 100 
  },
  { id: '5', title: 'Local Indie Night', description: 'Discover local indie bands.', date: '2024-07-28', time: '20:00', location: 'Coffee Town Bintaro', category: 'Music', imageUrl: 'https://placehold.co/300x200.png', imageHint: 'indie band', attendanceCount: 150, price: 15,
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
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Event['category']>('Music'); // Default to Music
  const [location, setLocation] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(MOCK_EVENTS);

  useEffect(() => {
    setLoadingLocation(true);
    // Simulate location detection with a slight delay
    setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocation('Bintaro'); 
            setLoadingLocation(false);
          },
          () => {
            setLocation('Bintaro'); // Fallback for demo
            setLoadingLocation(false);
          },
          { timeout: 3000 }
        );
      } else {
        setLocation('Bintaro'); // Fallback for demo
        setLoadingLocation(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    let events = MOCK_EVENTS;
    if (currentCategory !== 'All') { // 'All' is not in the new design, but keeping logic flexible
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

  const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= new Date() && e.attendees).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  const nearYouEvents = filteredEvents.filter(e => !e.attendees).slice(0, 5); // Mocking "Near You" with events that don't have detailed attendee list for card variant

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
                {location || 'Bintaro'} <ChevronDown className="h-4 w-4 ml-1" />
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 relative">
            <Bell className="h-6 w-6" />
            {/* Example notification dot */}
            <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-primary" />
          </Button>
        </div>
        <div className="container mx-auto -mb-10 relative z-10 mt-3">
          <div className="bg-card p-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground ml-3 flex-shrink-0" />
            <Input
              type="search"
              placeholder="Search events"
              className="flex-grow border-none focus:ring-0 pl-1 text-sm shadow-none bg-transparent h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="ghost" className="text-primary p-2.5 rounded-md hover:bg-primary/10 h-9 w-9">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-14 pb-4"> {/* pt-14 to account for search bar overlap */}
        <div className="container mx-auto">
          <CategoryFilter currentCategory={currentCategory} onSelectCategory={(cat) => setCurrentCategory(cat as Event['category'])} />
          
          <section className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-headline font-semibold">Upcoming Events</h2>
              <Link href="/events" className="text-sm text-primary font-medium flex items-center">
                See All <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </div>
            {upcomingEvents.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap rounded-md -mx-1 px-1"> {/* Negative margin for edge cards */}
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
              <p className="text-muted-foreground text-center py-4">No upcoming events found.</p>
            )}
          </section>

          <section>
            <div className="flex justify-between items-center mb-3">
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
              <p className="text-muted-foreground text-center py-4">No events found near you.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
