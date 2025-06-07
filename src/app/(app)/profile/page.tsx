
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Ticket, Event } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Ticket as TicketIconLucide, ArrowLeft, Pencil, ChevronRight, CalendarDays, Bookmark, PlusCircle, Edit3 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore'; // Added getDoc
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { eventStore } from '@/lib/eventStore'; 
import { ChangeBioDialog } from '@/components/profile/ChangeBioDialog'; 

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
  return <div className="w-full">{content}</div>; 
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
  const { user, logout, loading: authLoading, updateUserBio } = useAuth(); 
  const [ticketsCount, setTicketsCount] = useState<number>(0); 
  const [myEventsCount, setMyEventsCount] = useState<number>(0); 
  const [savedEventsCount, setSavedEventsCount] = useState<number>(0); 
  const [loadingTickets, setLoadingTickets] = useState(true); 
  const [loadingMyEvents, setLoadingMyEvents] = useState(true); 
  const [loadingSavedEvents, setLoadingSavedEvents] = useState(true); 
  const [currentUserBio, setCurrentUserBio] = useState<string | null>(null); 
  const [loadingBio, setLoadingBio] = useState(true); 
  const [isChangeBioDialogOpen, setIsChangeBioDialogOpen] = useState(false); 

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Fetch tickets count
      const fetchTicketsCount = async () => {
        setLoadingTickets(true);
        try {
          const ticketsRef = collection(db, 'userTickets');
          const q = query(ticketsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          setTicketsCount(querySnapshot.docs.length);
        } catch (error: any) {
          console.error('Error fetching tickets for count:', error);
        } finally {
          setLoadingTickets(false);
        }
      };
      fetchTicketsCount();

      // Fetch My Events count and Saved Events count from eventStore
      const fetchEventCountsFromStore = () => {
        setLoadingMyEvents(true);
        setLoadingSavedEvents(true);
        const allEvents = eventStore.getEvents();
        const userCreatedEvents = allEvents.filter(event => event.creatorId === user.uid);
        setMyEventsCount(userCreatedEvents.length);
        setLoadingMyEvents(false);
        const userSavedEvents = allEvents.filter(event => event.isBookmarked === true);
        setSavedEventsCount(userSavedEvents.length);
        setLoadingSavedEvents(false);
      };
      const unsubscribeEventStore = eventStore.subscribe(fetchEventCountsFromStore);
      fetchEventCountsFromStore(); 

      // Fetch Bio
      const fetchUserBio = async () => {
        setLoadingBio(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setCurrentUserBio(docSnap.data()?.bio || null);
          } else {
            setCurrentUserBio(null);
          }
        } catch (error) {
          console.error("Error fetching user bio:", error);
          setCurrentUserBio(null);
        } finally {
          setLoadingBio(false);
        }
      };
      fetchUserBio();

      return () => {
        unsubscribeEventStore(); 
      };

    } else if (!authLoading) { 
      setLoadingTickets(false);
      setLoadingMyEvents(false);
      setLoadingSavedEvents(false);
      setLoadingBio(false);
    }
  }, [user, authLoading]);

  const handleSaveBio = async (newBio: string) => {
    if (!user) return;
    const result = await updateUserBio(newBio);
    if (result.success) {
      setCurrentUserBio(newBio); // Update local state to reflect change immediately
      toast({
        title: "Bio Updated",
        description: "Your bio has been successfully updated.",
      });
    } else {
      toast({
        title: "Error Updating Bio",
        description: result.error?.message || "Could not update your bio. Please try again.",
        variant: "destructive",
      });
      throw new Error(result.error?.message || "Failed to update bio.");
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
          
          {loadingBio ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
          ) : currentUserBio ? (
            <div className="mt-1 text-sm text-muted-foreground text-center max-w-md px-4">
              <p className="whitespace-pre-line break-words">{currentUserBio}</p>
              <Button 
                variant="link" 
                className="text-xs text-primary hover:underline p-0 h-auto mt-0.5"
                onClick={() => setIsChangeBioDialogOpen(true)}
              >
                <Edit3 className="h-3 w-3 mr-1"/> Edit Bio
              </Button>
            </div>
          ) : (
            <Button 
              variant="link" 
              className="text-sm text-muted-foreground hover:text-primary p-0 h-auto mt-1"
              onClick={() => setIsChangeBioDialogOpen(true)}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1"/> Add Bio
            </Button>
          )}

          <Button 
            variant="default" 
            className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-6 py-2 text-sm font-semibold mt-3 shadow-sm"
            onClick={() => router.push('/settings')}
          >
            Settings
          </Button>

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
        <div className="space-y-4 mb-6">
          <ProfileMenuItem 
            icon={TicketIconLucide} 
            label="My Tickets" 
            count={loadingTickets ? undefined : ticketsCount}
            href="/profile/my-tickets" 
          />
          <ProfileMenuItem 
            icon={CalendarDays} 
            label="My Events" 
            count={loadingMyEvents ? undefined : myEventsCount} 
            href="/profile/my-events"
          />
          <ProfileMenuItem 
            icon={Bookmark} 
            label="Saved Events" 
            count={loadingSavedEvents ? undefined : savedEventsCount} 
            href="/profile/saved-events" 
          />
        </div>
      </section>
      
      <ChangeBioDialog
        isOpen={isChangeBioDialogOpen}
        onClose={() => setIsChangeBioDialogOpen(false)}
        currentBio={currentUserBio}
        onSave={handleSaveBio}
      />
    </div>
  );
}

    
