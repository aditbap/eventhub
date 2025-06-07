
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/profile/TicketCard';
import { Loader2, ArrowLeft, MoreVertical, CalendarClock, ArrowRight, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { TicketDetailsDialog } from '@/components/profile/TicketDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [upcomingTickets, setUpcomingTickets] = useState<Ticket[]>([]);
  const [pastTickets, setPastTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const router = useRouter();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!authLoading && !user) {
        router.replace('/login');
        return;
    }
    if (user) {
      const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
          const ticketsRef = collection(db, 'userTickets');
          const q = query(ticketsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          const fetchedTickets: Ticket[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            let purchaseDateStr = '';
            if (data.purchaseDate && data.purchaseDate instanceof Timestamp) {
              purchaseDateStr = data.purchaseDate.toDate().toISOString();
            } else if (typeof data.purchaseDate === 'string') {
              purchaseDateStr = data.purchaseDate;
            }

            return {
              id: doc.id,
              userId: data.userId,
              eventId: data.eventId,
              eventName: data.eventName,
              eventDate: data.eventDate, // This is 'YYYY-MM-DD'
              eventTime: data.eventTime, 
              eventLocation: data.eventLocation,
              eventImageUrl: data.eventImageUrl, 
              eventImageHint: data.eventImageHint,
              qrCodeUrl: data.qrCodeUrl, 
              purchaseDate: purchaseDateStr,
            } as Ticket;
          });

          // Sort all tickets by event date initially (most recent first for general view if needed)
          fetchedTickets.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
          setAllTickets(fetchedTickets);

          const today = new Date();
          today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

          const upcoming = fetchedTickets.filter(ticket => {
            const eventDate = new Date(ticket.eventDate); // eventDate is YYYY-MM-DD
            return eventDate >= today;
          }).sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()); // Upcoming sorted soonest first

          const past = fetchedTickets.filter(ticket => {
            const eventDate = new Date(ticket.eventDate);
            return eventDate < today;
          }).sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()); // Past sorted latest first
          
          setUpcomingTickets(upcoming);
          setPastTickets(past);

        } catch (error: any) {
          console.error('Error fetching tickets:', error);
          toast({
            title: "Error Fetching Tickets",
            description: error.message || "Could not load your tickets. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setLoadingTickets(false);
        }
      };
      fetchTickets();
    } else if (!authLoading) {
      setLoadingTickets(false);
    }
  }, [user, authLoading, router, toast]);

  const handleOpenTicketDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  };

  const handleCloseTicketDialog = () => {
    setSelectedTicket(null);
    setIsTicketDialogOpen(false);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!user) return;
    try {
      await deleteDoc(firestoreDoc(db, 'userTickets', ticketId));
      // Refetch or update local state
      setAllTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));
      setUpcomingTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));
      setPastTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));

      toast({
        title: "Ticket Deleted",
        description: "Your ticket has been successfully removed.",
      });
      handleCloseTicketDialog();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({
        title: "Error",
        description: "Could not delete your ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || (!user && loadingTickets) ) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!user && !authLoading) { // Check explicitly for no user after auth check
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <p className="text-muted-foreground">Please log in to view your tickets.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">Login</Button>
        </div>
      );
  }

  const EmptyState = ({ type }: { type: 'upcoming' | 'past' }) => (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 flex-grow">
        <CalendarClock className="h-32 w-32 text-primary/20 mb-6" strokeWidth={1.5} />
        <p className="text-xl font-semibold text-foreground mb-2">
            {type === 'upcoming' ? 'No Upcoming Event' : 'No Past Events'}
        </p>
        <p className="text-muted-foreground mb-8 text-sm max-w-xs">
            {type === 'upcoming' 
                ? 'No upcoming event for now, go reserve event to get upcoming event!'
                : 'You have no past event tickets to display.'}
        </p>
        {type === 'upcoming' && (
            <Button 
                onClick={() => router.push('/explore')} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 text-base font-semibold w-full max-w-sm"
            >
                EXPLORE EVENTS
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        )}
         {type === 'past' && (
            <Button 
                onClick={() => router.push('/explore')} 
                variant="outline"
                className="h-12 px-6 text-base font-semibold w-full max-w-sm"
            >
                <Search className="mr-2 h-5 w-5" />
                Explore Events
            </Button>
        )}
    </div>
);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full h-16">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Events</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/20 rounded-full">
              <MoreVertical className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>Ticket Settings</DropdownMenuItem>
            <DropdownMenuItem disabled>Help</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upcoming' | 'past')} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 rounded-none h-12 sticky top-16 z-20 bg-background border-b px-4">
          <TabsTrigger 
            value="upcoming" 
            className={cn(
              "text-base data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none",
              activeTab === 'upcoming' ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            UPCOMING
          </TabsTrigger>
          <TabsTrigger 
            value="past"
            className={cn(
              "text-base data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none",
              activeTab === 'past' ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            PAST EVENTS
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="flex-grow flex flex-col p-4 pb-20">
          {loadingTickets ? (
            <div className="flex justify-center items-center flex-grow"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : upcomingTickets.length > 0 ? (
            <div className="space-y-4">
              {upcomingTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => handleOpenTicketDialog(ticket)}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="upcoming" />
          )}
        </TabsContent>
        <TabsContent value="past" className="flex-grow flex flex-col p-4 pb-20">
           {loadingTickets ? (
            <div className="flex justify-center items-center flex-grow"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : pastTickets.length > 0 ? (
            <div className="space-y-4">
              {pastTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => handleOpenTicketDialog(ticket)}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="past" />
          )}
        </TabsContent>
      </Tabs>

      <TicketDetailsDialog
        isOpen={isTicketDialogOpen}
        onClose={handleCloseTicketDialog}
        ticket={selectedTicket}
        onDeleteTicket={handleDeleteTicket}
      />
    </div>
  );
}

    