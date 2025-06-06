
'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { eventStore } from '@/lib/eventStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, MoreVertical, Gift, Ticket } from 'lucide-react';
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem';
import Link from 'next/link';

export default function AllEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const allEvents = eventStore.getEvents();
    // Sort events by date, newest first by default, or oldest first if preferred
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(allEvents);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Events</h1>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/20 rounded-full">
            <Search className="h-6 w-6" />
          </Button>
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
          {/* Decorative elements - simple version */}
          <Gift className="absolute right-4 top-1/2 -translate-y-1/2 h-20 w-20 text-white/30 opacity-50 transform rotate-12" />
          <Ticket className="absolute left-4 bottom-2 h-16 w-16 text-white/20 opacity-40 transform -rotate-12" />
          {/* Placeholder for complex illustration from image */}
           <Image
            src="https://placehold.co/300x150.png" // Replace with a more fitting placeholder or actual illustration if available
            alt="Invite friends illustration"
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 opacity-10 pointer-events-none z-0"
            data-ai-hint="gift party hands"
          />
        </div>

        {/* Events List Section */}
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} passHref>
                <AllEventsEventItem event={event} />
              </Link>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No events found.</p>
              <p className="text-sm text-muted-foreground">Check back later or create a new event!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
