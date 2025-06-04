
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/profile/TicketCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOutIcon, MailIcon, UserIcon, Loader2, TicketIcon } from 'lucide-react';
import { db } from '@/lib/firebase'; // REAL db
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
          const ticketsRef = collection(db, 'userTickets');
          const q = query(ticketsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          const userTickets: Ticket[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to a more usable format if needed, e.g., ISO string or Date object
            // For simplicity, we'll assume eventDate and purchaseDate are stored/retrieved as strings or handle conversion here.
            // If purchaseDate is a Firestore Timestamp:
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
              eventDate: data.eventDate, // Assuming this is already a string
              eventLocation: data.eventLocation,
              qrCodeUrl: data.qrCodeUrl, // if available
              purchaseDate: purchaseDateStr, // Add this
            } as Ticket;
          });
          setTickets(userTickets);

        } catch (error) {
          console.error('Error fetching tickets:', error);
        } finally {
          setLoadingTickets(false);
        }
      };
      fetchTickets();
    } else {
      setLoadingTickets(false);
    }
  }, [user]);

  if (authLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-headline font-bold text-primary">My Profile</h1>
      </header>

      <div className="bg-card shadow-lg rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${user.displayName?.charAt(0)}`} alt={user.displayName || 'User'} data-ai-hint="profile avatar"/>
            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold font-headline">{user.displayName || 'User'}</h2>
            {user.email && (
              <div className="flex items-center text-muted-foreground mt-1">
                <MailIcon className="h-4 w-4 mr-2" />
                {user.email}
              </div>
            )}
            <div className="flex items-center text-muted-foreground mt-1">
                <UserIcon className="h-4 w-4 mr-2" />
                User ID: {user.uid.substring(0,10)}...
            </div>
          </div>
          <Button onClick={logout} variant="outline" className="md:ml-auto mt-4 md:mt-0">
            <LogOutIcon className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-6 flex items-center">
            <TicketIcon className="h-6 w-6 mr-2 text-primary"/>
            My Tickets
        </h2>
        {loadingTickets ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">You have no tickets yet. Explore events and get yours!</p>
        )}
      </section>
    </div>
  );
}
