
'use client';

import React, { useEffect, useState } from 'react';
import type { Event, Ticket } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Ticket as TicketIconLucide, Loader2, ArrowLeft, AlertTriangle, UserCircle, Wrench, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { eventStore } from '@/lib/eventStore';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const categoryColors: { [key in Event['category']]: string } = {
  Music: 'bg-category-music text-white',
  Food: 'bg-category-food text-white',
  Sports: 'bg-category-sports text-white',
  Tech: 'bg-category-tech text-white',
  Other: 'bg-gray-500 text-white',
};

export default function EventDetailsPage({ params: paramsPromise }: { params: Promise<{ eventId: string }> }) {
  const params = React.use(paramsPromise);
  const { eventId } = params;

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [creator, setCreator] = useState<{ displayName: string; photoURL?: string | null } | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [isGettingTicket, setIsGettingTicket] = useState(false);
  const [isCheckingExistingTicket, setIsCheckingExistingTicket] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setLoadingEvent(true);
    const allEvents = eventStore.getEvents();
    const foundEvent = allEvents.find(e => e.id === eventId);
    setEvent(foundEvent || null);
    setLoadingEvent(false);
  }, [eventId]);

  useEffect(() => {
    if (event?.creatorId) {
      setLoadingCreator(true);
      const fetchCreator = async () => {
        try {
          const userDocRef = doc(db, 'users', event.creatorId!);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setCreator({
              displayName: userData.displayName || 'Unknown Creator',
              photoURL: userData.photoURL || undefined,
            });
          } else {
            setCreator({ displayName: 'Unknown Creator' });
          }
        } catch (err) {
          console.error("Error fetching creator details:", err);
          setCreator({ displayName: 'Error loading organizer' });
        } finally {
          setLoadingCreator(false);
        }
      };
      fetchCreator();
    } else if (event && !event.creatorId) {
        setCreator({ displayName: 'Organizer N/A' });
        setLoadingCreator(false);
    }
  }, [event]);

  // Determine if creator info is valid for follow/profile actions
  const isRealCreator = creator && event?.creatorId &&
                       !['Unknown Creator', 'Error loading organizer', 'Organizer N/A'].includes(creator.displayName);


  const proceedToGetTicket = async () => {
    if (!user || !event) return;
    setIsGettingTicket(true);
    try {
      const ticketData: Omit<Ticket, 'id' | 'qrCodeUrl' | 'purchaseDate'> = { 
        userId: user.uid,
        eventId: event.id,
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
        description: `You've successfully got a ticket for ${event.title}.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/profile/my-tickets')}>
            View Ticket
          </Button>
        ),
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

  const handleGetTicket = async () => {
    if (!user || !event) return;

    setIsCheckingExistingTicket(true);
    try {
      const ticketsRef = collection(db, 'userTickets');
      const q = query(ticketsRef, where('userId', '==', user.uid), where('eventId', '==', event.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setShowConfirmationDialog(true);
      } else {
        await proceedToGetTicket();
      }
    } catch (error) {
      console.error('Error checking existing tickets:', error);
      toast({
        title: 'Error',
        description: 'Could not verify existing tickets. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingExistingTicket(false);
    }
  };

  const handleViewOrganizerProfile = () => {
    if (event?.creatorId) { // Gated by creatorId existing on event
        toast({
            title: "Feature Coming Soon!",
            description: "Viewing organizer profiles will be available in a future update.",
        });
        // Future: router.push(`/profile/${event.creatorId}`);
    }
  };

  const handleFollowOrganizer = () => {
    if (isRealCreator && creator) {
        toast({
            title: "Feature Coming Soon!",
            description: `The ability to follow ${creator.displayName} will be available soon.`,
        });
    } else if (event?.creatorId) { // If there's a creatorId but not "real" info (e.g. error or unknown)
         toast({
            title: "Feature Coming Soon!",
            description: "Following organizers will be available in a future update.",
        });
    }
    // If no event.creatorId, follow button wouldn't render anyway.
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

  const buttonLoading = isCheckingExistingTicket || isGettingTicket;
  const buttonText = () => {
    if (isCheckingExistingTicket) return "Checking...";
    if (isGettingTicket) return "Getting Ticket...";
    return event.price && event.price > 0 ? `Get Ticket - $${event.price.toFixed(2)}` : 'Get Free Ticket';
  };
  
  return (
    <div className="bg-background min-h-screen">
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full">
        <Image 
            src={event.imageUrl} 
            alt={event.title} 
            fill
            objectFit="cover" 
            className="opacity-80"
            data-ai-hint={event.imageHint || "event hero"}
            priority 
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
          </div>
          
          <div className="space-y-4 rounded-xl border bg-card p-4 shadow-lg md:sticky md:top-20">
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
                </div>
              </div>
            )}

            {loadingCreator ? (
              <div className="flex items-center space-x-2 pt-3 mt-3 border-t">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading organizer...</span>
              </div>
            ) : creator && (
              <div className="pt-3 mt-3 border-t">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleViewOrganizerProfile}
                    className="flex items-center space-x-3 group hover:opacity-80 transition-opacity"
                    disabled={!event?.creatorId}
                    aria-label={isRealCreator && creator?.displayName ? `View profile of ${creator.displayName}` : 'View organizer profile'}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={creator.photoURL || undefined} alt={creator.displayName || 'Organizer'} data-ai-hint="organizer avatar"/>
                      <AvatarFallback>{(creator?.displayName && creator.displayName.trim() !== '') ? creator.displayName.charAt(0).toUpperCase() : 'O'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Organized by</p>
                      <p className="font-medium text-foreground group-hover:underline">{creator.displayName || 'Organizer'}</p>
                    </div>
                  </button>
                  {user && event?.creatorId && user.uid !== event.creatorId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFollowOrganizer}
                      className="ml-auto"
                      disabled={!isRealCreator}
                      aria-label={isRealCreator && creator?.displayName ? `Follow ${creator.displayName}` : 'Follow organizer'}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full mt-4" 
              onClick={handleGetTicket}
              disabled={buttonLoading || !user}
            >
              {buttonLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketIconLucide className="mr-2 h-5 w-5" />}
              {buttonText()}
            </Button>
            {!user && <p className="text-xs text-center text-muted-foreground mt-1">Please log in to get a ticket.</p>}
          </div>
        </div>
        
        <div className="border-t pt-6 md:pt-8">
          <h2 className="text-xl sm:text-2xl font-headline font-semibold text-foreground mb-3">Location on Map</h2>
          <div className="bg-muted h-64 sm:h-80 md:h-96 rounded-lg shadow-inner overflow-hidden flex flex-col items-center justify-center text-center p-4">
            <Wrench className="h-16 w-16 text-primary/40 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-muted-foreground">Map Feature Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Interactive map will be available in a future update.</p>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mr-3" />
            </div>
            <AlertDialogTitle className="text-center">Already Have a Ticket?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You already have a ticket for "{event?.title}". Would you like to get another one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel onClick={() => setShowConfirmationDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowConfirmationDialog(false);
                await proceedToGetTicket();
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Yes, Get Another Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    