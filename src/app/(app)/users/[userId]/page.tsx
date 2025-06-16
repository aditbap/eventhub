
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { User as AuthUser } from '@/contexts/AuthContext'; // Renamed to avoid conflict
import type { Event } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { eventStore } from '@/lib/eventStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, UserCheck, Loader2, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PublicUserProfile {
  uid: string;
  displayName: string | null;
  photoURL?: string | null;
  bio?: string | null;
}

interface StatItemProps {
  value: string | number | React.ReactNode;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <p className="text-2xl font-bold text-foreground">
      {value}
    </p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);


export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: currentUserLoading } = useAuth(); // Currently logged-in user
  const { toast } = useToast();

  const userId = params.userId as string;

  const [profileUser, setProfileUser] = useState<PublicUserProfile | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // Mock state
  const [followersCount, setFollowersCount] = useState(346); // Mock
  const [followingCount, setFollowingCount] = useState(1304); // Mock

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      setLoadingProfile(true);
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setProfileUser({
            uid: userDocSnap.id,
            displayName: data.displayName || 'User',
            photoURL: data.photoURL || undefined,
            bio: data.bio || undefined,
          });

          // Fetch user's events from eventStore
          const allEvents = eventStore.getEvents();
          const eventsCreatedByUser = allEvents.filter(event => event.creatorId === userId);
          setUserEvents(eventsCreatedByUser.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        } else {
          console.warn(`User document not found for ID: ${userId}`);
          // Optionally redirect to a 404 page or show error
          setProfileUser(null); // Or handle as "user not found"
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfileUser(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleFollowToggle = () => {
    if (!currentUser) {
        toast({ title: "Login Required", description: "Please log in to follow users.", variant: "destructive" });
        return;
    }
    if (currentUser.uid === userId) {
        toast({ title: "Action Not Allowed", description: "You cannot follow yourself.", variant: "destructive" });
        return;
    }
    setIsFollowing(!isFollowing); // Toggle mock state
    setFollowersCount(prev => isFollowing ? prev -1 : prev + 1); // Adjust mock follower count
    toast({
      title: isFollowing ? `Unfollowed ${profileUser?.displayName || 'User'}` : `Followed ${profileUser?.displayName || 'User'}!`,
      description: `You are now ${isFollowing ? 'not following' : 'following'} this user. (Placeholder)`,
    });
  };
  
  const isCurrentUserProfile = useMemo(() => currentUser?.uid === userId, [currentUser, userId]);


  if (loadingProfile || currentUserLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
        <p className="text-muted-foreground mb-6">The profile you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }
  
  const avatarSrc = profileUser.photoURL || `https://placehold.co/128x128.png?text=${profileUser.displayName?.charAt(0) || 'U'}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="relative bg-gradient-to-b from-emerald-100/40 via-emerald-50/20 to-background/0 pt-4 pb-8 px-4">
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-black/10 hover:bg-black/20 text-foreground rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <h1 className="text-xl font-headline font-semibold text-foreground text-center mb-6 pt-1">Profile</h1>
        
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-lg rounded-2xl mb-3">
            <AvatarImage src={avatarSrc} alt={profileUser.displayName || 'User'} data-ai-hint="user profile avatar" />
            <AvatarFallback className="text-4xl rounded-2xl">{profileUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-headline font-bold text-primary">{profileUser.displayName}</h2>
          {profileUser.bio ? (
             <p className="text-sm text-muted-foreground mt-1 max-w-md whitespace-pre-line break-words">{profileUser.bio}</p>
          ) : (
             <p className="text-sm text-muted-foreground mt-1 italic">No bio yet.</p>
          )}

          {/* Stats Section */}
          <div className="flex justify-around items-center w-full max-w-xs sm:max-w-sm mt-6 py-3 bg-card/70 backdrop-blur-sm rounded-xl shadow">
            <StatItem value={userEvents.length} label="Events" />
            <Separator orientation="vertical" className="h-10 bg-border/50" />
            <StatItem value={followingCount} label="Following" />
            <Separator orientation="vertical" className="h-10 bg-border/50" />
            <StatItem value={followersCount} label="Followers" />
          </div>

          {/* Follow/Edit Button */}
          {!isCurrentUserProfile && currentUser && (
            <Button 
              onClick={handleFollowToggle} 
              variant={isFollowing ? "outline" : "default"}
              className={cn(
                "mt-6 w-full max-w-xs h-11 text-base font-semibold",
                isFollowing ? "border-primary text-primary hover:bg-primary/10" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isFollowing ? <UserCheck className="mr-2 h-5 w-5"/> : <UserPlus className="mr-2 h-5 w-5"/>}
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
           {isCurrentUserProfile && (
             <Button onClick={() => router.push('/settings')} variant="outline" className="mt-6 w-full max-w-xs h-11 text-base font-semibold">
                Edit Profile
            </Button>
           )}
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="event" className="w-full px-2 sm:px-4 -mt-2">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b rounded-none mb-4">
          <TabsTrigger 
            value="event" 
            className="pb-3 text-base data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=active]:font-semibold rounded-none data-[state=active]:shadow-none"
          >
            Event
          </TabsTrigger>
          <TabsTrigger 
            value="about" 
            className="pb-3 text-base data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=active]:font-semibold rounded-none data-[state=active]:shadow-none"
          >
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="event" className="pb-20">
          {userEvents.length > 0 ? (
            <div className="space-y-4">
              {userEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} passHref>
                  <AllEventsEventItem event={event} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-card rounded-lg shadow-sm">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">{profileUser.displayName} hasn't created any events yet.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="about" className="pb-20">
          <div className="text-center py-10 text-muted-foreground bg-card rounded-lg shadow-sm">
            <p>More information about {profileUser.displayName} will be available here soon.</p>
            {profileUser.bio && <p className="mt-4 italic">Current Bio: "{profileUser.bio}"</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

