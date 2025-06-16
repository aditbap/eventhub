
'use client';

import React, { useEffect, useState } from 'react';
import type { Event, Ticket, Notification } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Ticket as TicketIconLucide, Loader2, ArrowLeft, AlertTriangle, UserCircle, Wrench, UserPlus, Share2, ChevronRight, Banknote } from 'lucide-react';
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
import { ShareSheet } from '@/components/sharing/ShareSheet';

// Midtrans Snap.js TypeScript declaration
declare global {
  interface Window {
    snap?: {
      pay: (
        snapToken: string,
        options?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
          embedId?: string;
          redirectUrl?: string; // For scenarios where redirect is preferred
        }
      ) => void;
      // You can add other Snap methods here if you use them, e.g., snap.embed()
    };
  }
}


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
  
  const [actionInProgress, setActionInProgress] = useState(false); // Combined loading state
  const [isCheckingExistingTicket, setIsCheckingExistingTicket] = useState(false); // Specific for pre-check
  
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Load Midtrans Snap.js script
  useEffect(() => {
    // These should be set in your .env.local or environment variables
    const midtransSnapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_SCRIPT_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'; // Default to sandbox
    const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (!midtransClientKey) {
      console.warn('Midtrans Client Key (NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) is not configured. Payment functionality will be affected.');
      // Optionally, disable payment buttons or show a message to the user
      return;
    }

    const scriptId = 'midtrans-snap-sdk';
    if (document.getElementById(scriptId)) {
      // console.log('Midtrans Snap.js already loaded.');
      return; // Script already loaded
    }
    
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = midtransSnapScriptUrl;
    script.setAttribute('data-client-key', midtransClientKey);
    script.async = true;

    script.onload = () => {
      // console.log('Midtrans Snap.js loaded successfully.');
    };
    script.onerror = () => {
        console.error('Failed to load Midtrans Snap.js script.');
    };

    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);


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

  const isRealCreator = creator && event?.creatorId &&
                       !['Unknown Creator', 'Error loading organizer', 'Organizer N/A'].includes(creator.displayName);

  // This function now only creates the ticket and notification in Firestore.
  // It's called after successful payment for paid events, or directly for free events.
  const finalizeTicketAcquisition = async () => {
    if (!user || !event) return;
    setActionInProgress(true); // Use general loading state
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

      const ticketDocRef = await addDoc(collection(db, "userTickets"), {
        ...ticketData,
        purchaseDate: serverTimestamp()
      });

      const notificationData: Omit<Notification, 'id' | 'timestamp'> = {
        userId: user.uid,
        category: 'event_registration',
        title: 'Ticket Acquired!',
        message: `You've successfully got a ticket for ${event.title}.`,
        relatedEventId: event.id,
        relatedEventName: event.title,
        relatedEventImageUrl: event.imageUrl,
        relatedEventImageHint: event.imageHint,
        link: `/profile/my-tickets?ticketId=${ticketDocRef.id}`,
        isRead: false,
        icon: 'Ticket',
      };

      await addDoc(collection(db, "userNotifications"), {
        ...notificationData,
        timestamp: serverTimestamp()
      });

      toast({
        title: '🎉 Ticket Acquired!',
        description: `You've successfully got a ticket for ${event.title}. A notification has been sent.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/profile/my-tickets')}>
            View Ticket
          </Button>
        ),
      });
    } catch (error) {
      console.error('Error finalizing ticket or creating notification:', error);
      toast({
        title: 'Error',
        description: 'Could not finalize your ticket or send notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  const initiateMidtransPayment = async () => {
    if (!user || !event || !(event.price && event.price > 0)) return;

    setActionInProgress(true);
    try {
      const response = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          eventPrice: event.price,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          // userPhone: '08123...' // Optional: Collect user phone if needed by Midtrans/your setup
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create Midtrans transaction (${response.status})`);
      }

      const { snapToken } = await response.json();

      if (!snapToken) {
        throw new Error('Snap token not received from server.');
      }

      if (!window.snap) {
        throw new Error('Midtrans Snap.js is not loaded.');
      }
      
      window.snap.pay(snapToken, {
        onSuccess: (result: any) => {
          console.log('Midtrans Payment Success:', result);
          toast({
            title: 'Payment Successful!',
            description: 'Your payment was processed successfully. Finalizing ticket...',
          });
          // IMPORTANT: In a real app, verify the transaction with your backend here
          // before calling finalizeTicketAcquisition.
          // For this example, we proceed directly.
          finalizeTicketAcquisition(); 
        },
        onPending: (result: any) => {
          console.log('Midtrans Payment Pending:', result);
          toast({
            title: 'Payment Pending',
            description: 'Your payment is pending. We will update you once it is confirmed.',
          });
          setActionInProgress(false);
        },
        onError: (result: any) => {
          console.error('Midtrans Payment Error:', result);
          toast({
            title: 'Payment Failed',
            description: result.message || 'There was an error processing your payment. Please try again.',
            variant: 'destructive',
          });
          setActionInProgress(false);
        },
        onClose: () => {
          // Only set loading to false if it wasn't successful or pending.
          // onSuccess/onPending will manage their own loading states.
          // This check helps prevent flicker if user closes immediately after success/pending.
          if (actionInProgress) { // Check if still in a loading state not handled by other callbacks
            toast({
              description: 'Payment popup closed.',
              variant: 'default',
            });
          }
          setActionInProgress(false); // Ensure loading is false if closed before any result.
        },
      });
      // setActionInProgress(false) is handled by Midtrans callbacks after this point.

    } catch (error: any) {
      console.error('Error initiating Midtrans payment:', error);
      toast({
        title: 'Payment Initiation Error',
        description: error.message || 'Could not start the payment process. Please try again.',
        variant: 'destructive',
      });
      setActionInProgress(false);
    }
  };


  const handleGetTicket = async () => {
    if (!user || !event) return;
    
    // If it's a free event, check for existing ticket then proceed or finalize.
    if (!event.price || event.price <= 0) {
      setIsCheckingExistingTicket(true);
      try {
        const ticketsRef = collection(db, 'userTickets');
        const q = query(ticketsRef, where('userId', '==', user.uid), where('eventId', '==', event.id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setShowConfirmationDialog(true); // For free event, confirm getting another
        } else {
          await finalizeTicketAcquisition(); // Directly get free ticket
        }
      } catch (error) {
        console.error('Error checking existing tickets for free event:', error);
        toast({ title: 'Error', description: 'Could not verify tickets. Please try again.', variant: 'destructive' });
      } finally {
        setIsCheckingExistingTicket(false);
      }
      return;
    }

    // For paid events:
    setIsCheckingExistingTicket(true);
    try {
      const ticketsRef = collection(db, 'userTickets');
      const q = query(ticketsRef, where('userId', '==', user.uid), where('eventId', '==', event.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setShowConfirmationDialog(true); // Paid event, already has one, confirm for another (will trigger payment)
      } else {
        await initiateMidtransPayment(); // Paid event, no existing ticket, initiate payment
      }
    } catch (error) {
      console.error('Error checking existing tickets for paid event:', error);
      toast({ title: 'Error', description: 'Could not verify existing tickets. Please try again.', variant: 'destructive' });
    } finally {
      setIsCheckingExistingTicket(false);
    }
  };

  const handleViewOrganizerProfile = () => {
    if (event?.creatorId && isRealCreator) {
        router.push(`/users/${event.creatorId}`);
    } else if (event?.creatorId) {
        toast({
            title: "Profile Unavailable",
            description: "Organizer profile information is currently not fully available.",
        });
    }
  };

  const handleFollowOrganizer = () => {
    if (isRealCreator && creator) {
        toast({
            title: "Feature Coming Soon!",
            description: `Following ${creator.displayName} will be implemented soon.`,
        });
    } else if (event?.creatorId) {
         toast({
            title: "Feature Coming Soon!",
            description: "Following organizers will be available in a future update.",
        });
    }
  };

  const handleInviteFriends = () => {
    setIsShareSheetOpen(true);
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

  const buttonLoadingState = actionInProgress || isCheckingExistingTicket;
  const buttonText = () => {
    if (isCheckingExistingTicket) return "Checking...";
    if (actionInProgress && event.price && event.price > 0) return "Processing Payment...";
    if (actionInProgress && (!event.price || event.price <=0)) return "Getting Ticket...";
    return event.price && event.price > 0 ? `Get Ticket - Rp ${event.price.toLocaleString('id-ID')}` : 'Get Free Ticket';
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

             <div className="mt-4 p-3 bg-card rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  {event.attendees && event.attendees.length > 0 && typeof event.attendanceCount === 'number' ? (
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-3">
                        {event.attendees.slice(0, 3).map((attendee, index) => (
                          <Avatar key={attendee.id || index} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={attendee.avatarUrl} alt={attendee.name} data-ai-hint="attendee avatar"/>
                            <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-foreground">{event.attendanceCount} people attending</span>
                    </div>
                  ) : (
                     <div className="flex items-center">
                        <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Be the first to join or invite friends!</span>
                    </div>
                  )}
                </div>
                <Button variant="default" size="sm" onClick={handleInviteFriends} className="bg-primary/10 text-primary hover:bg-primary/20">
                  <Share2 className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </div>
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
             {event.price !== undefined && event.price > 0 && (
              <div className="flex items-start space-x-3">
                <Banknote className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Rp {event.price.toLocaleString('id-ID')}</p>
                  <p className="text-sm text-muted-foreground">Ticket Price</p>
                </div>
              </div>
            )}
            {event.price === 0 && (
                 <div className="flex items-start space-x-3">
                    <Banknote className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                    <div>
                        <p className="font-medium text-foreground">Free</p>
                        <p className="text-sm text-muted-foreground">Ticket Price</p>
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
                    className="flex items-center space-x-3 group hover:opacity-80 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!event?.creatorId || !isRealCreator}
                    aria-label={isRealCreator && creator?.displayName ? `View profile of ${creator.displayName}` : 'View organizer profile'}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={creator.photoURL || undefined} alt={creator.displayName || 'Organizer'} data-ai-hint="organizer avatar"/>
                      <AvatarFallback>{(creator?.displayName && creator.displayName.trim() !== '') ? creator.displayName.charAt(0).toUpperCase() : 'O'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Organized by</p>
                      <p className={cn("font-medium text-foreground", isRealCreator && "group-hover:underline")}>{creator.displayName || 'Organizer'}</p>
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
              disabled={buttonLoadingState || !user}
            >
              {buttonLoadingState ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketIconLucide className="mr-2 h-5 w-5" />}
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
              You already have a ticket for "{event?.title}". 
              {event?.price && event.price > 0 ? " Would you like to purchase another one?" : " Would you like to get another one?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel onClick={() => setShowConfirmationDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowConfirmationDialog(false);
                if (event && event.price && event.price > 0) {
                  await initiateMidtransPayment(); 
                } else {
                  await finalizeTicketAcquisition(); 
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Yes, Get Another Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {event && typeof window !== 'undefined' && (
        <ShareSheet
          isOpen={isShareSheetOpen}
          onClose={() => setIsShareSheetOpen(false)}
          eventTitle={event.title}
          eventUrl={window.location.href}
        />
      )}
    </div>
  );
}
