
'use client';

import React, { useEffect, useState } from 'react'; // Added React for React.use
import type { Event, Ticket } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Ticket as TicketIconLucide, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { eventStore } from '@/lib/eventStore';
import { useRouter } from 'next/navigation';

// Category colors matching Explore page and globals.css
const categoryColors: { [key in Event['category']]: string } = {
  Music: 'bg-category-music text-white',
  Food: 'bg-category-food text-white',
  Sports: 'bg-category-sports text-white',
  Tech: 'bg-category-tech text-white',
  Other: 'bg-gray-500 text-white',
};

// Updated props to expect params as a Promise
export default function EventDetailsPage({ params: paramsPromise }: { params: Promise<{ eventId: string }> }) {
  const params = React.use(paramsPromise); // Unwrap the promise
  const { eventId } = params; // Destructure eventId from the resolved params

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isGettingTicket, setIsGettingTicket] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setLoadingEvent(true);
    const allEvents = eventStore.getEvents();
    // Use the resolved eventId from React.use(paramsPromise)
    const foundEvent = allEvents.find(e => e.id === eventId);
    setEvent(foundEvent || null);
    setLoadingEvent(false);
  }, [eventId]); // Use resolved eventId in dependency array

  const handleGetTicket = async () => {
    if (!user || !event) return;
    setIsGettingTicket(true);
    try {
      const ticketData: Omit<Ticket, 'id' | 'qrCodeUrl' | 'purchaseDate'> = { 
        userId: user.uid,
        eventId: event.id, // event.id comes from the fetched event state
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.time || undefined,
        eventLocation: event.location,
        eventImageUrl: event.imageUrl || undefined,
        eventImageHint: event.imageHint || undefined,
      };
      
      await addDoc(collection(db, "userTickets"), {
        ...ticketData,
        purchaseDate: serverTimestamp() 
      });

      toast({
        title: '🎉 Ticket Acquired!',
        description: `You've successfully got a ticket for ${event.title}. Find it in your Profile.`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Error getting ticket:', error);
      toast({
        title: 'Error',
        description: 'Could not get your ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGettingTicket(false);
    }
  };

  if (loadingEvent) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!event) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p className="text-muted-foreground">Sorry, we couldn't find the event you're looking for.</p>
            <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
    );
  }
  
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = event.time ? new Date(`1970-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true}) : 'N/A';

  return (
    <div className="bg-background min-h-screen">
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full">
        <Image 
            src={event.imageUrl} 
            alt={event.title} 
            layout="fill" 
            objectFit="cover" 
            className="opacity-80"
            data-ai-hint={event.imageHint || "event hero"} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full z-10"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="absolute bottom-0 left-0 p-4 sm:p-6 w-full z-0">
          <Badge className={cn(categoryColors[event.category] || categoryColors['Other'], 'mb-2 text-xs sm:text-sm px-2.5 py-1')}>
            {event.category}
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-white shadow-text">{event.title}</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl p-4 sm:p-6 space-y-6 md:space-y-8 pb-24">
        
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-headline font-semibold text-foreground mb-2">About this event</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {/* Placeholder for Organizer - can be expanded */}
            {/* <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" alt="Organizer" data-ai-hint="organizer avatar"/>
                <AvatarFallback>ORG</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">Event Organizer</p>
                <p className="text-xs text-muted-foreground">Official Organizer</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">Follow</Button>
            </div> */}
          </div>
          
          <div className="space-y-4 rounded-xl border bg-card p-4 shadow-lg md:sticky md:top-20"> {/* Sticky for larger screens */}
            <h3 className="text-lg font-headline font-semibold border-b pb-2 text-foreground">Event Details</h3>
            <div className="flex items-start space-x-3">
              <CalendarDays className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">{formattedDate}</p>
                <p className="text-sm text-muted-foreground">{formattedTime}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">{event.location}</p>
                {event.venue && <p className="text-sm text-muted-foreground">{event.venue}</p>}
              </div>
            </div>
            {event.attendanceCount !== undefined && event.attendees && event.attendees.length > 0 && (
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                <div>
                   <p className="font-medium text-foreground">{event.attendanceCount} attending</p>
                   {/* Avatar stack can be added here if desired */}
                </div>
              </div>
            )}
            <Button 
              size="lg" 
              className="w-full mt-4" 
              onClick={handleGetTicket}
              disabled={isGettingTicket || !user}
            >
              {isGettingTicket ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketIconLucide className="mr-2 h-5 w-5" />}
              {event.price && event.price > 0 ? `Get Ticket - $${event.price.toFixed(2)}` : 'Get Free Ticket'}
            </Button>
            {!user && <p className="text-xs text-center text-muted-foreground mt-1">Please log in to get a ticket.</p>}
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-xl sm:text-2xl font-headline font-semibold text-foreground mb-3">Location on Map</h2>
          <div className="bg-muted h-64 rounded-lg flex items-center justify-center text-muted-foreground shadow-inner">
            <MapPin className="h-8 w-8 mr-2"/>
            Map placeholder - Integration coming soon!
          </div>
        </div>
      </div>
    </div>
  );
}
