
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/profile/TicketCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Ticket as TicketIconLucide, ArrowLeft, Pencil, ChevronRight, CalendarDays, Bookmark, PlusCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { TicketDetailsDialog } from '@/components/profile/TicketDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface ProfileMenuItemProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  href?: string;
  onClick?: () => void;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ icon: Icon, label, count, href, onClick }) => {
  const content = (
    <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer shadow-sm rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className="h-6 w-6 mr-3 text-primary" />
          <span className="text-base font-medium text-foreground">{label}</span>
          {typeof count !== 'undefined' && <span className="text-base text-muted-foreground ml-1">({count})</span>}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }
  return <div className="w-full">{content}</div>; // Non-interactive version
};

interface StatItemProps {
  value: string | number;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <p className="text-xl font-semibold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);


export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const router = useRouter();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const { toast } = useToast();

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
    } else {
      setLoadingTickets(false);
    }
  }, [user, toast]);

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

  if (authLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-transparent w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-white/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-headline font-semibold text-foreground">Profile</h1>
        <div className="w-9 h-9"></div> 
      </header>

      <div className="bg-gradient-to-b from-emerald-100/40 via-emerald-50/20 to-background/0 pt-2 pb-8 px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-2">
            <Avatar className="h-28 w-28 border-4 border-white shadow-lg rounded-2xl">
              <AvatarImage src={user.photoURL || `https://placehold.co/120x120.png?text=${user.displayName?.charAt(0)}`} alt={user.displayName || 'User'} data-ai-hint="profile avatar" className="rounded-2xl" />
              <AvatarFallback className="text-4xl rounded-2xl">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Button 
              variant="default" 
              size="icon" 
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 rounded-full shadow-md border-2 border-background" 
              onClick={() => router.push('/settings')}
              aria-label="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-2xl font-headline font-semibold text-foreground mt-2">{user.displayName || 'User Name'}</h2>
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground hover:text-primary p-0 h-auto mt-1"
            onClick={() => toast({ title: "Coming Soon!", description: "Adding a bio is not yet implemented."})}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1"/> Add Bio
          </Button>
          <Button 
            variant="default" 
            className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-6 py-2 text-sm font-semibold mt-3 shadow-sm"
            onClick={() => router.push('/settings')}
          >
            Settings
          </Button>

          {/* Stats Section */}
          <div className="flex justify-around items-center w-full max-w-sm mt-6 py-3 bg-card/50 rounded-xl shadow-sm">
            <StatItem value="0" label="Post" />
            <Separator orientation="vertical" className="h-8 bg-border/70" />
            <StatItem value="234" label="Following" /> 
            <Separator orientation="vertical" className="h-8 bg-border/70" />
            <StatItem value="105" label="Follower" />
          </div>
        </div>
      </div>

      <section className="px-4 pb-20 -mt-2">
        <div className="space-y-3 mb-6">
          {/* My Ticket menu item removed as per request */}
          <ProfileMenuItem 
            icon={CalendarDays} 
            label="My Events" 
            count={0} 
            onClick={() => toast({ title: "Coming Soon!", description: "Viewing your created events is not yet implemented."})}
          />
          <ProfileMenuItem 
            icon={Bookmark} 
            label="Save" 
            count={0} 
            onClick={() => toast({ title: "Coming Soon!", description: "Viewing saved items is not yet implemented."})}
          />
        </div>
        
        {/* Ticket List Section */}
        {loadingTickets ? (
          <div className="flex justify-center py-8">
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
          !loadingTickets && (
            <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
              <TicketIconLucide className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">You have no tickets yet.</p>
              <p className="text-sm text-muted-foreground">Explore events and get yours!</p>
            </div>
          )
        )}
      </section>

      <TicketDetailsDialog
        isOpen={isTicketDialogOpen}
        onClose={handleCloseTicketDialog}
        ticket={selectedTicket}
        onDeleteTicket={handleDeleteTicket}
      />
    </div>
  );
}
