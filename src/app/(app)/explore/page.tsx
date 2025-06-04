'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/events/EventCard';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { SearchIcon, MapPinIcon, Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Mock data for events
const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Summer Music Fest', description: 'An amazing summer music festival.', date: '2024-08-15', time: '18:00', location: 'Bintaro Plaza', category: 'Music', imageUrl: 'https://placehold.co/600x400.png', imageHint: 'music festival', attendanceCount: 1200, price: 50 },
  { id: '2', title: 'Food Truck Rally', description: 'Taste the best food trucks in town.', date: '2024-07-20', time: '12:00', location: 'Central Park Bintaro', category: 'Food', imageUrl: 'https://placehold.co/600x300.png', imageHint: 'food truck', attendanceCount: 800, price: 0 },
  { id: '3', title: 'Charity Run 5K', description: 'Run for a cause!', date: '2024-09-01', time: '07:00', location: 'UPJ Campus', category: 'Sports', imageUrl: 'https://placehold.co/400x300.png', imageHint: 'charity run', attendanceCount: 500, price: 10 },
  { id: '4', title: 'Tech Conference 2024', description: 'Latest in tech innovations.', date: '2024-10-05', time: '09:00', location: 'Bintaro Jaya Xchange Mall', category: 'Other', imageUrl: 'https://placehold.co/600x350.png', imageHint: 'tech conference', attendanceCount: 300, price: 100 },
  { id: '5', title: 'Local Indie Night', description: 'Discover local indie bands.', date: '2024-07-28', time: '20:00', location: 'Coffee Town Bintaro', category: 'Music', imageUrl: 'https://placehold.co/500x300.png', imageHint: 'indie music', attendanceCount: 150 },
  { id: '6', title: 'Weekend Bake Sale', description: 'Delicious homemade baked goods.', date: '2024-08-03', time: '10:00', location: 'Community Hall', category: 'Food', imageUrl: 'https://placehold.co/600x400.png', imageHint: 'bake sale', attendanceCount: 200 },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('All');
  const [location, setLocation] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(MOCK_EVENTS);

  useEffect(() => {
    // Simulate location detection
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { // Success
          // In a real app, use position.coords.latitude and position.coords.longitude
          // to fetch city/area or filter events by proximity.
          // For this mock, we'll just set a static location.
          setLocation('Bintaro, Indonesia'); 
          setLoadingLocation(false);
        },
        () => { // Error
          setLocation('Location not available');
          setLoadingLocation(false);
        },
        { timeout: 5000 } // Add a timeout
      );
    } else {
      setLocation('Geolocation not supported');
      setLoadingLocation(false);
    }
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
    // Add location based filtering here in a real app
    setFilteredEvents(events);
  }, [searchQuery, currentCategory]);

  const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  const nearYouEvents = filteredEvents.slice(0, 5); // Mocking "Near You" with first 5 filtered events

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-headline font-bold text-primary">Explore Events</h1>
          {loadingLocation ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            location && (
              <div className="flex items-center text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                <MapPinIcon className="h-4 w-4 mr-1.5 text-primary" />
                {location}
              </div>
            )
          )}
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events by keyword..."
            className="w-full pl-10 pr-4 py-2 rounded-full shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <CategoryFilter currentCategory={currentCategory} onSelectCategory={setCurrentCategory} />
      
      <section className="mb-8">
        <h2 className="text-2xl font-headline font-semibold mb-4">Upcoming Events</h2>
        {upcomingEvents.length > 0 ? (
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex space-x-4 pb-4">
              {upcomingEvents.map((event) => (
                 <div key={event.id} className="w-[300px] h-full flex-shrink-0">
                    <EventCard event={event} />
                 </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground">No upcoming events found matching your criteria.</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Near You</h2>
        {nearYouEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {nearYouEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="compact" />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No events found near you matching your criteria.</p>
        )}
      </section>
    </div>
  );
}
