
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/profile/TicketCard';
import { Loader2, Ticket as TicketIconLucide, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { TicketDetailsDialog } from '@/components/profile/TicketDetailsDialog';
import { useToast } from '@/hooks/use-toast';

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const router = useRouter();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
        router.replace('/login'); // Redirect if not logged in and auth check complete
        return;
    }
    if (user) {
      const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
          const ticketsRef = collection(db, 'userTickets');
          const q = query(ticketsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          const userTickets: Ticket[] = querySnapshot.docs.map(doc => {
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
              eventDate: data.eventDate,
              eventTime: data.eventTime, 
              eventLocation: data.eventLocation,
              eventImageUrl: data.eventImageUrl, 
              eventImageHint: data.eventImageHint,
              qrCodeUrl: data.qrCodeUrl, 
              purchaseDate: purchaseDateStr,
            } as Ticket;
          });
          userTickets.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
          setTickets(userTickets);

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
    } else if (!authLoading) { // if not loading and no user
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
      setTickets(prevTickets => prevTickets.filter(t => t.id !== ticketId));
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

  if (authLoading || (!user && loadingTickets) ) { // Show loader if auth is loading OR if user is not yet set but we are still trying to load tickets (initial state)
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  // If done loading auth, and still no user, they shouldn't be here (redirected by useEffect), but as a fallback:
  if (!user) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <p className="text-muted-foreground">Please log in to view your tickets.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">Login</Button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background pb-20"> {/* Added pb-20 for bottom nav space */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">My Tickets</h1>
        <div className="w-9 h-9"></div> {/* Spacer for centering title */}
      </header>

      <main className="p-4">
        {loadingTickets ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => handleOpenTicketDialog(ticket)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
            <TicketIconLucide className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg text-muted-foreground">You have no tickets yet.</p>
            <p className="text-sm text-muted-foreground">Explore events and get yours!</p>
            <Button onClick={() => router.push('/explore')} className="mt-6">
              Explore Events
            </Button>
          </div>
        )}
      </main>

      <TicketDetailsDialog
        isOpen={isTicketDialogOpen}
        onClose={handleCloseTicketDialog}
        ticket={selectedTicket}
        onDeleteTicket={handleDeleteTicket}
      />
    </div>
  );
}
