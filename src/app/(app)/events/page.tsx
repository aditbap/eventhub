
'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { eventStore } from '@/lib/eventStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, MoreVertical, Gift, Ticket, X as XIcon } from 'lucide-react';
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AllEventsPage() {
  const router = useRouter();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const eventsFromStore = eventStore.getEvents();
    // Default sort: newest first. This is already handled by eventStore.getEvents()
    setAllEvents(eventsFromStore);
  }, []);

  useEffect(() => {
    let currentEvents = [...allEvents];
    if (searchQuery.trim() !== '') {
      currentEvents = allEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Ensure events are sorted by date, newest first, after filtering
    currentEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredEvents(currentEvents);
  }, [searchQuery, allEvents]);

  const handleSearchIconClick = () => {
    setSearchActive(true);
  };

  const handleCloseSearchClick = () => {
    setSearchActive(false);
    setSearchQuery('');
  };

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
          <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/20 rounded-full">
            <MoreVertical className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6 pb-20">
        {/* Invite Banner Section */}
        <div className="relative rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-green-400 to-emerald-500 p-6 text-white">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold font-headline mb-1">Invite your friends</h2>
            <p className="text-sm mb-4 opacity-90">Get #2000 for ticket</p>
            <Button
              variant="default"
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-6 py-2.5 h-auto"
              onClick={() => alert('Invite functionality to be implemented!')}
            >
              INVITE
            </Button>
          </div>
          <Gift className="absolute right-4 top-1/2 -translate-y-1/2 h-20 w-20 text-white/30 opacity-50 transform rotate-12" />
          <Ticket className="absolute left-4 bottom-2 h-16 w-16 text-white/20 opacity-40 transform -rotate-12" />
          <Image
            src="https://placehold.co/300x150.png"
            alt="Invite friends illustration"
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 opacity-10 pointer-events-none z-0"
            data-ai-hint="gift party hands"
          />
        </div>

        {/* Events List Section */}
        <div className="space-y-4">
          {(searchQuery.trim() !== '' ? filteredEvents : allEvents).length > 0 ? (
            (searchQuery.trim() !== '' ? filteredEvents : allEvents).map(event => (
              <Link key={event.id} href={`/events/${event.id}`} passHref>
                <AllEventsEventItem event={event} />
              </Link>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">{searchQuery.trim() !== '' ? 'No events match your search.' : 'No events found.'}</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim() !== '' ? 'Try a different search term.' : 'Check back later or create a new event!'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
