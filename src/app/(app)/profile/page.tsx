
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/profile/TicketCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Ticket as TicketIconLucide, ArrowLeft, Pencil, SettingsIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const router = useRouter();

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
          // Sort tickets by eventDate, newest first
          userTickets.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
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
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100/30 via-emerald-50/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-transparent w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-white/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-headline font-semibold text-foreground">Profile</h1>
        <div className="w-9 h-9"></div> {/* Spacer for centering title */}
      </header>

      {/* User Info Section */}
      <div className="flex flex-col items-center justify-center pt-2 pb-8 px-4">
        <div className="relative mb-3">
          <Avatar className="h-28 w-28 border-4 border-white shadow-md">
            <AvatarImage src={user.photoURL || `https://placehold.co/120x120.png?text=${user.displayName?.charAt(0)}`} alt={user.displayName || 'User'} data-ai-hint="profile avatar"/>
            <AvatarFallback className="text-3xl">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <Button variant="outline" size="icon" className="absolute -bottom-1 -right-1 bg-background hover:bg-muted border-2 border-background h-8 w-8 rounded-full shadow-md">
            <Pencil className="h-4 w-4 text-primary" />
          </Button>
        </div>
        <h2 className="text-2xl font-headline font-semibold text-foreground mb-2">{user.displayName || 'User Name'}</h2>
        <Button 
          variant="default" 
          className="rounded-full bg-green-100 hover:bg-green-200 text-green-700 px-6 py-2 text-sm font-medium shadow-sm"
          onClick={() => { /* Navigate to settings page or open settings modal */ console.log("Settings clicked"); logout(); /* temp logout */}}
        >
          Settings
        </Button>
      </div>

      {/* My Tickets Section */}
      <section className="px-4 pb-20"> {/* Added pb-20 for bottom nav */}
        <div className="flex items-center mb-4">
          <TicketIconLucide className="h-6 w-6 mr-2 text-primary"/>
          <h2 className="text-xl font-headline font-semibold text-foreground">My Ticket</h2>
        </div>
        {loadingTickets ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <TicketIconLucide className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">You have no tickets yet.</p>
            <p className="text-sm text-muted-foreground">Explore events and get yours!</p>
          </div>
        )}
      </section>
    </div>
  );
}
