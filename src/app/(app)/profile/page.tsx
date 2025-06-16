
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Ticket, Event, PublicUserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Ticket as TicketIconLucide, ArrowLeft, Pencil, ChevronRight, CalendarDays, Bookmark, PlusCircle, Edit3, Users, UserPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { eventStore } from '@/lib/eventStore';
import { ChangeBioDialog } from '@/components/profile/ChangeBioDialog';
import { motion } from 'framer-motion';

interface ProfileMenuItemProps {
  icon: React.ElementType;
  label: string;
  count?: number | React.ReactNode; // Allow ReactNode for loader
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
          {typeof count !== 'undefined' && count !== null && (
            <span className="text-base text-muted-foreground ml-1 flex items-center">
              ({count})
            </span>
          )}
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
  value: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, href, onClick }) => {
  const itemContent = (
    <div className="flex flex-col items-center">
      <p className="text-xl font-semibold text-foreground h-6 flex items-center justify-center">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  if (href) {
    return <Link href={href} className="text-center hover:opacity-80 transition-opacity">{itemContent}</Link>;
  }
  if (onClick) {
    return <button onClick={onClick} className="text-center hover:opacity-80 transition-opacity">{itemContent}</button>
  }
  return <div className="text-center">{itemContent}</div>;
};


export default function ProfilePage() {
  const { user, logout, loading: authLoading, updateUserBio } = useAuth();
  const [ticketsCount, setTicketsCount] = useState<number | React.ReactNode>(<Loader2 className="h-4 w-4 animate-spin" />);
  const [myEventsCount, setMyEventsCount] = useState<number | React.ReactNode>(<Loader2 className="h-4 w-4 animate-spin" />);
  const [savedEventsCount, setSavedEventsCount] = useState<number | React.ReactNode>(<Loader2 className="h-4 w-4 animate-spin" />);
  const [currentUserBio, setCurrentUserBio] = useState<string | null>(null);
  const [loadingBio, setLoadingBio] = useState(true);
  const [isChangeBioDialogOpen, setIsChangeBioDialogOpen] = useState(false);

  const [followingCount, setFollowingCount] = useState<number | React.ReactNode>(<Loader2 className="h-4 w-4 animate-spin" />);
  const [followersCount, setFollowersCount] = useState<number | React.ReactNode>(<Loader2 className="h-4 w-4 animate-spin" />);
  const [loadingFollowCounts, setLoadingFollowCounts] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setLoadingBio(true);
      setLoadingFollowCounts(true);
      setTicketsCount(<Loader2 className="h-4 w-4 animate-spin" />);
      setMyEventsCount(<Loader2 className="h-4 w-4 animate-spin" />);
      setSavedEventsCount(<Loader2 className="h-4 w-4 animate-spin" />);

      const fetchTicketsCount = async () => {
        try {
          const ticketsRef = collection(db, 'userTickets');
          const q = query(ticketsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          setTicketsCount(querySnapshot.docs.length);
        } catch (error: any) {
          console.error('Error fetching tickets for count:', error);
          setTicketsCount(0); // Set to 0 on error
        }
      };
      fetchTicketsCount();

      const fetchEventCountsFromStore = () => {
        const allEvents = eventStore.getEvents();
        const userCreatedEvents = allEvents.filter(event => event.creatorId === user.uid);
        setMyEventsCount(userCreatedEvents.length);
        const userSavedEvents = allEvents.filter(event => event.isBookmarked === true);
        setSavedEventsCount(userSavedEvents.length);
      };
      const unsubscribeEventStore = eventStore.subscribe(fetchEventCountsFromStore);
      fetchEventCountsFromStore();

      const fetchUserBioAndFollows = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const followersColRef = collection(db, 'users', user.uid, 'followers');
          const followingColRef = collection(db, 'users', user.uid, 'following');

          const [docSnap, followersSnap, followingSnap] = await Promise.all([
            getDoc(userDocRef),
            getDocs(followersColRef),
            getDocs(followingColRef)
          ]);

          if (docSnap.exists()) {
            setCurrentUserBio(docSnap.data()?.bio || null);
          } else {
            setCurrentUserBio(null);
          }
          setFollowersCount(followersSnap.size);
          setFollowingCount(followingSnap.size);

        } catch (error) {
          console.error("Error fetching user data/follows:", error);
          setCurrentUserBio(null);
          setFollowersCount(0);
          setFollowingCount(0);
        } finally {
          setLoadingBio(false);
          setLoadingFollowCounts(false);
        }
      };
      fetchUserBioAndFollows();

      return () => {
        unsubscribeEventStore();
      };

    } else if (!authLoading) {
      setLoadingBio(false);
      setLoadingFollowCounts(false);
      setTicketsCount(0);
      setMyEventsCount(0);
      setSavedEventsCount(0);
      setFollowersCount(0);
      setFollowingCount(0);
    }
  }, [user, authLoading]);

  const handleSaveBio = async (newBio: string) => {
    if (!user) return;
    const result = await updateUserBio(newBio);
    if (result.success) {
      setCurrentUserBio(newBio);
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
  
  const isLoadingCounts = typeof ticketsCount !== 'number' || 
                           typeof myEventsCount !== 'number' || 
                           typeof savedEventsCount !== 'number' ||
                           loadingFollowCounts;


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen bg-background"
    >
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
             <StatItem
              value={loadingFollowCounts || typeof myEventsCount !== 'number' ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : myEventsCount}
              label="My Events"
              href="/profile/my-events"
            />
            <Separator orientation="vertical" className="h-8 bg-border/70" />
            <StatItem
              value={loadingFollowCounts ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : followingCount}
              label="Following"
              href="/profile/following"
            />
            <Separator orientation="vertical" className="h-8 bg-border/70" />
            <StatItem
              value={loadingFollowCounts ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : followersCount}
              label="Followers"
              href="/profile/followers"
            />
          </div>
        </div>
      </div>

      <section className="px-4 pb-20 -mt-2">
        <div className="space-y-4 mb-6">
          <ProfileMenuItem
            icon={TicketIconLucide}
            label="My Tickets"
            count={isLoadingCounts ? <Loader2 className="h-4 w-4 animate-spin" /> : ticketsCount as number}
            href="/profile/my-tickets"
          />
          <ProfileMenuItem
            icon={CalendarDays}
            label="My Events"
            count={isLoadingCounts ? <Loader2 className="h-4 w-4 animate-spin" /> : myEventsCount as number}
            href="/profile/my-events"
          />
          <ProfileMenuItem
            icon={Bookmark}
            label="Saved Events"
            count={isLoadingCounts ? <Loader2 className="h-4 w-4 animate-spin" /> : savedEventsCount as number}
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
    </motion.div>
  );
}
