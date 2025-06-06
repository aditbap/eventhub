'use client';

import { useEffect, useState } from 'react';
import type { Event, Ticket } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, UsersIcon, TicketIcon, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase'; // REAL db
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock data - in a real app, this would come from a fetch
const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Summer Music Fest', description: 'Join us for an unforgettable summer music festival featuring top artists and bands. Enjoy a variety of genres, food stalls, and interactive experiences. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', date: '2024-08-15', time: '18:00', location: 'Bintaro Plaza Main Stage', venue: 'Bintaro Plaza', category: 'Music', imageUrl: 'https://placehold.co/1200x600.png', imageHint: 'music concert', attendanceCount: 1200, price: 50 },
  { id: '2', title: 'Food Truck Rally', description: 'A culinary adventure awaits! Sample delicious treats from the best food trucks in the city. From savory to sweet, there is something for everyone. Family-friendly with live music.', date: '2024-07-20', time: '12:00', location: 'Central Park Bintaro Food Arena', venue: 'Central Park Bintaro', category: 'Food', imageUrl: 'https://placehold.co/1200x600.png', imageHint: 'food festival', attendanceCount: 800, price: 0 },
  { id: '3', title: 'Charity Run 5K', description: 'Lace up your running shoes for a good cause. This 5K run aims to raise funds for local charities. All fitness levels welcome. Medals for all finishers!', date: '2024-09-01', time: '07:00', location: 'UPJ Campus Track', venue: 'UPJ Campus', category: 'Sports', imageUrl: 'https://placehold.co/1200x600.png', imageHint: 'marathon sport', attendanceCount: 500, price: 10 },
];

const categoryColors: { [key: string]: string } = {
  Music: 'bg-category-music text-white',
  Food: 'bg-category-food text-white',
  Sports: 'bg-category-sports text-white',
  Other: 'bg-gray-500 text-white',
};

export default function EventDetailsPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGettingTicket, setIsGettingTicket] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching event data
    const foundEvent = MOCK_EVENTS.find(e => e.id === params.eventId);
    setEvent(foundEvent || null);
    setLoading(false);
  }, [params.eventId]);

  const handleGetTicket = async () => {
    if (!user || !event) return;
    setIsGettingTicket(true);
    try {
      const ticketData: Omit<Ticket, 'id' | 'qrCodeUrl' | 'purchaseDate'> = { 
        userId: user.uid,
        eventId: event.id,
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.time || null,
        eventLocation: event.location,
        eventImageUrl: event.imageUrl || null,
        eventImageHint: event.imageHint || null,
      };
      
      await addDoc(collection(db, "userTickets"), {
        ...ticketData,
        purchaseDate: serverTimestamp() 
      });

      toast({
        title: 'Ticket Acquired!',
        description: `You've successfully got a ticket for ${event.title}.`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Error getting ticket:', error);
      toast({
        title: 'Error',
        description: 'Could not get ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGettingTicket(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return <div className="container mx-auto px-4 py-8 text-center">Event not found.</div>;
  }
  
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="relative h-64 md:h-96 w-full rounded-b-lg overflow-hidden shadow-lg">
        <Image src={event.imageUrl} alt={event.title} layout="fill" objectFit="cover" data-ai-hint={event.imageHint || "event detail"} />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
          <Badge className={cn(categoryColors[event.category] || categoryColors['Other'], 'mb-2 w-fit text-sm px-3 py-1')}>
            {event.category}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-headline font-semibold">About this event</h2>
            <p className="text-foreground/80 leading-relaxed">{event.description}</p>
          </div>
          <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="text-lg font-headline font-semibold">Event Details</h3>
            <div className="flex items-start">
              <CalendarIcon className="h-5 w-5 mr-3 mt-1 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{formattedDate}</p>
                {event.time && <p className="text-sm text-muted-foreground">{event.time}</p>}
              </div>
            </div>
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 mr-3 mt-1 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{event.location}</p>
                {event.venue && <p className="text-sm text-muted-foreground">{event.venue}</p>}
              </div>
            </div>
            {event.attendanceCount !== undefined && (
              <div className="flex items-start">
                <UsersIcon className="h-5 w-5 mr-3 mt-1 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{event.attendanceCount} people attending</p>
                </div>
              </div>
            )}
            <Button 
              size="lg" 
              className="w-full mt-4" 
              onClick={handleGetTicket}
              disabled={isGettingTicket || !user}
            >
              {isGettingTicket ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketIcon className="mr-2 h-5 w-5" />}
              {event.price && event.price > 0 ? `Get Ticket - $${event.price}` : 'Get Free Ticket'}
            </Button>
            {!user && <p className="text-xs text-center text-muted-foreground mt-2">Please log in to get a ticket.</p>}
          </div>
        </div>
        
        {/* Placeholder for schedule and map */}
        <div className="space-y-4">
          <h2 className="text-2xl font-headline font-semibold">Schedule</h2>
          <p className="text-muted-foreground">Detailed schedule coming soon.</p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-headline font-semibold">Location Map</h2>
          <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Map placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
