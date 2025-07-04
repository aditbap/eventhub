
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { Event, Notification, PublicUserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, writeBatch, serverTimestamp, addDoc, Timestamp, setDoc } from 'firebase/firestore';
import { eventStore } from '@/lib/eventStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, UserCheck, Loader2, CalendarDays, AtSign, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllEventsEventItem } from '@/components/events/AllEventsEventItem';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatItemProps {
  value: string | number | React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, onClick, className }) => {
  const content = (
    <div className="flex flex-col items-center">
      <p className="text-xl font-semibold text-foreground h-6 flex items-center justify-center">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
  if (onClick) {
    return (
        <button onClick={onClick} className={cn("text-center hover:opacity-80 transition-opacity", className)}>
            {content}
        </button>
    );
  }
  return <div className={cn("text-center", className)}>{content}</div>;
};


// Helper function to generate a consistent chat ID
const getChatId = (uid1: string, uid2: string): string => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};


export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: currentUserLoading } = useAuth();
  const { toast } = useToast();

  const userId = params.userId as string;

  const [profileUser, setProfileUser] = useState<PublicUserProfile | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollowStatus, setLoadingFollowStatus] = useState(true);
  const [followActionInProgress, setFollowActionInProgress] = useState(false);

  const [followersCount, setFollowersCount] = useState<number | React.ReactNode>(<Loader2 className="h-4 w-4 animate-spin" />);
  const [followingCount, setFollowingCount] = useState<number | React.ReactNode>(<Loader2 className="h-4 w-4 animate-spin" />);

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfileAndCounts = async () => {
      setLoadingProfile(true);
      setLoadingFollowStatus(true); 
      setFollowersCount(<Loader2 className="h-4 w-4 animate-spin" />);
      setFollowingCount(<Loader2 className="h-4 w-4 animate-spin" />);

      // Robust check for userId before any Firestore operation
      if (!userId || typeof userId !== 'string' || userId.trim() === "" || userId.includes("/") || userId.length > 128) {
        console.error(`[UserProfilePage] Invalid or malformed userId in params: '${userId}'. Aborting profile fetch.`);
        setProfileUser(null);
        setLoadingProfile(false);
        setLoadingFollowStatus(false);
        setFollowersCount(0);
        setFollowingCount(0);
        toast({
          title: "Invalid Profile URL",
          description: "The user ID in the URL is invalid or malformed. Cannot load profile.",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log(`[UserProfilePage] Fetching profile for valid userId: ${userId}`);
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          console.log(`[UserProfilePage] Document found for userId: ${userId}`);
          const data = userDocSnap.data();
          setProfileUser({
            uid: userDocSnap.id,
            displayName: data.displayName || 'User',
            username: data.username || null, 
            photoURL: data.photoURL || null,
            bio: data.bio || null,
          });

          const allEvents = eventStore.getEvents();
          const eventsCreatedByUser = allEvents.filter(event => event.creatorId === userId);
          setUserEvents(eventsCreatedByUser.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

          const followersColRef = collection(db, 'users', userId, 'followers');
          const followingColRef = collection(db, 'users', userId, 'following');
          const [followersSnap, followingSnap] = await Promise.all([
            getDocs(followersColRef),
            getDocs(followingColRef)
          ]);
          setFollowersCount(followersSnap.size);
          setFollowingCount(followingSnap.size);

          if (currentUser && currentUser.uid !== userId) {
            const currentUserFollowingRef = doc(db, 'users', currentUser.uid, 'following', userId);
            const followingDocSnap = await getDoc(currentUserFollowingRef);
            setIsFollowing(followingDocSnap.exists());
          }
        } else {
          console.warn(`[UserProfilePage] Document NOT found for userId: ${userId}`);
          setProfileUser(null);
          setFollowersCount(0);
          setFollowingCount(0);
        }
      } catch (error: any) {
        console.error(`[UserProfilePage] Error fetching user profile for ${userId}:`, error); // Full error object
        setProfileUser(null);
        setFollowersCount(0);
        setFollowingCount(0);
        toast({
            title: "Profile Load Error",
            description: `Could not load profile. ${error.code ? `Code: ${error.code}. ` : ''}${error.message ? `Details: ${error.message}` : 'Please try again.'}`,
            variant: "destructive",
            duration: 9000
        });
      } finally {
        setLoadingProfile(false);
        setLoadingFollowStatus(false);
      }
    };

    fetchUserProfileAndCounts();
  }, [userId, currentUser, toast]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser || currentUser.uid === profileUser.uid || followActionInProgress || loadingFollowStatus) {
      if (!currentUser) toast({ title: "Login Required", description: "Please log in to follow users.", variant: "destructive" });
      return;
    }

    setFollowActionInProgress(true);
    const batch = writeBatch(db);
    const currentUserFollowingRef = doc(db, 'users', currentUser.uid, 'following', profileUser.uid);
    const targetUserFollowersRef = doc(db, 'users', profileUser.uid, 'followers', currentUser.uid);

    try {
      if (isFollowing) { 
        batch.delete(currentUserFollowingRef);
        batch.delete(targetUserFollowersRef);
        await batch.commit();
        setIsFollowing(false);
        setFollowersCount(prev => typeof prev === 'number' ? prev - 1 : 0);
        toast({ title: `Unfollowed ${profileUser.displayName}` });
      } else { 
        batch.set(currentUserFollowingRef, { displayName: profileUser.displayName, username: profileUser.username, photoURL: profileUser.photoURL || null, followedAt: serverTimestamp() });
        batch.set(targetUserFollowersRef, { displayName: currentUser.displayName, username: currentUser.username, photoURL: currentUser.photoURL || null, followerAt: serverTimestamp() });

        const notificationData: Omit<Notification, 'id' | 'timestamp'> = {
            userId: profileUser.uid,
            category: 'social',
            title: `${currentUser.displayName || 'Someone'} started following you`,
            message: `You have a new follower! Check out their profile.`,
            relatedUserId: currentUser.uid,
            relatedUserName: currentUser.displayName,
            relatedUserAvatar: currentUser.photoURL,
            link: `/users/${currentUser.uid}`,
            isRead: false,
            icon: 'UserPlus',
        };
        const notificationsColRef = collection(db, 'userNotifications');
        const newNotificationRef = doc(notificationsColRef); 
        batch.set(newNotificationRef, { ...notificationData, timestamp: serverTimestamp() });

        await batch.commit();
        setIsFollowing(true);
        setFollowersCount(prev => typeof prev === 'number' ? prev + 1 : 1);
        toast({ title: `Followed ${profileUser.displayName}!` });
      }
    } catch (error) {
      console.error("Error toggling follow state:", error);
      toast({ title: "Error", description: "Could not update follow status.", variant: "destructive" });
    } finally {
      setFollowActionInProgress(false);
    }
  };

  const handleMessage = async () => {
    console.log("[handleMessage] Initiating message attempt...");

    if (currentUserLoading) {
        console.warn("[handleMessage] Auth state still loading. Aborting.");
        toast({ title: "Please Wait", description: "Authentication is still loading.", variant: "default" });
        return;
    }
    if (!currentUser) {
        console.warn("[handleMessage] No current user. Aborting. Redirecting to login.");
        toast({ title: "Login Required", description: "Please log in to send messages.", variant: "destructive" });
        router.push('/login');
        return;
    }
    if (!profileUser) {
        console.warn("[handleMessage] No profile user data. Aborting.");
        toast({ title: "Error", description: "Target user profile is not available.", variant: "destructive" });
        return;
    }
    if (currentUser.uid === profileUser.uid) {
        console.log("[handleMessage] User tried to message themselves.");
        toast({ description: "You cannot message yourself." });
        return;
    }

    // Critical UID validation
    if (!currentUser.uid || typeof currentUser.uid !== 'string' || currentUser.uid.trim() === '') {
        console.error("[handleMessage] Critical: currentUser.uid is invalid:", currentUser.uid, `(Type: ${typeof currentUser.uid})`);
        toast({ title: "Error", description: "Your user ID is invalid. Cannot start chat.", variant: "destructive" });
        return;
    }
    if (!profileUser.uid || typeof profileUser.uid !== 'string' || profileUser.uid.trim() === '') {
        console.error("[handleMessage] Critical: profileUser.uid is invalid:", profileUser.uid, `(Type: ${typeof profileUser.uid})`);
        toast({ title: "Error", description: "Target user ID is invalid. Cannot start chat.", variant: "destructive" });
        return;
    }
    
    console.log(`[handleMessage] Current User Validated: UID=${currentUser.uid} (Type: ${typeof currentUser.uid}), Name=${currentUser.displayName || 'N/A'}, Username=${currentUser.username || 'N/A'}`);
    console.log(`[handleMessage] Profile User Validated: UID=${profileUser.uid} (Type: ${typeof profileUser.uid}), Name=${profileUser.displayName || 'N/A'}, Username=${profileUser.username || 'N/A'}`);

    const chatId = getChatId(currentUser.uid, profileUser.uid);
    console.log(`[handleMessage] Generated Chat ID: ${chatId} (Type: ${typeof chatId})`);
    if (!chatId || !chatId.includes('_') || chatId.split('_').length !== 2 || chatId.startsWith('_') || chatId.endsWith('_')) {
        console.error("[handleMessage] Critical: Generated chatId is invalid:", chatId);
        toast({ title: "Error", description: "Could not generate a valid chat ID.", variant: "destructive" });
        return;
    }
    
    const participantsArray = [currentUser.uid, profileUser.uid];
    console.log(`[handleMessage] Participants Array (unsorted):`, participantsArray.map(p => ({ uid: p, type: typeof p })));
    
    const sortedParticipantsArray = [...participantsArray].sort();
    console.log(`[handleMessage] Participants Array (sorted):`, sortedParticipantsArray.map(p => ({ uid: p, type: typeof p })));

    if (sortedParticipantsArray.length !== 2 || 
        typeof sortedParticipantsArray[0] !== 'string' || sortedParticipantsArray[0].trim() === '' ||
        typeof sortedParticipantsArray[1] !== 'string' || sortedParticipantsArray[1].trim() === '' ||
        sortedParticipantsArray[0] === sortedParticipantsArray[1] ) {
        console.error("[handleMessage] Critical: sortedParticipantsArray is invalid:", sortedParticipantsArray);
        toast({ title: "Error", description: "Invalid participant data for chat.", variant: "destructive" });
        return;
    }

    const chatDocRef = doc(db, 'chats', chatId);

    const chatDataToWrite = {
      id: chatId,
      participants: sortedParticipantsArray,
      participantDetails: {
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || null,
          photoURL: currentUser.photoURL || null,
          username: currentUser.username || null,
        },
        [profileUser.uid]: {
          uid: profileUser.uid,
          displayName: profileUser.displayName || null,
          photoURL: profileUser.photoURL || null,
          username: profileUser.username || null,
        },
      },
      lastMessage: null, // Explicitly null for new chats
      updatedAt: serverTimestamp(),
      unreadCounts: {
        [currentUser.uid]: 0,
        [profileUser.uid]: 0,
      },
    };
    
    console.log("[handleMessage] --- PRE-CHECK for Firestore 'allow create' rule for /chats/{chatId} ---");
    console.log(`Rule: allow create: if request.auth != null && request.auth.uid in request.resource.data.participants && request.resource.data.participants.size() == 2;`);
    console.log(`1. request.auth != null (client-side perspective): ${!!currentUser}`);
    console.log(`2. request.auth.uid (client-side perspective): ${currentUser?.uid}`);
    console.log(`   request.resource.data.participants (to be written):`, chatDataToWrite.participants.map(p => ({ uid: p, type: typeof p })));
    const isAuthUidInParticipants = currentUser?.uid ? chatDataToWrite.participants.includes(currentUser.uid) : false;
    console.log(`   Is request.auth.uid in request.resource.data.participants? : ${isAuthUidInParticipants}`);
    console.log(`3. request.resource.data.participants.size() (to be written): ${chatDataToWrite.participants.length}`);
    console.log("[handleMessage] --- End of PRE-CHECK ---");
    console.log("[handleMessage] Full data object being sent to setDoc (chatDataToWrite):", JSON.parse(JSON.stringify({...chatDataToWrite, updatedAt: "SERVER_TIMESTAMP_PLACEHOLDER", lastMessage: null })));


    try {
      setFollowActionInProgress(true); 
      const chatDocSnap = await getDoc(chatDocRef);

      if (!chatDocSnap.exists()) {
        console.log(`[handleMessage] Chat document ${chatId} does not exist. Attempting to create new chat.`);
        await setDoc(chatDocRef, chatDataToWrite);
        console.log(`[handleMessage] Successfully created chat document ${chatId}.`);
      } else {
        console.log(`[handleMessage] Chat document ${chatId} already exists.`);
      }
      router.push(`/messages/${chatId}`);
    } catch (error: any) {
      console.error('[handleMessage] Error ensuring chat exists or navigating:', error);
      let errorMessage = "Could not start conversation.";
      if (error.code) {
        console.error(`[handleMessage] Firebase Error Code: ${error.code}`);
        errorMessage = `Could not start conversation. (Code: ${error.code})`;
      }
      if (error.message) {
        console.error(`[handleMessage] Firebase Error Message: ${error.message}`);
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setFollowActionInProgress(false);
    }
  };
  
  const isCurrentUserProfile = useMemo(() => currentUser?.uid === userId, [currentUser, userId]);

  if (loadingProfile || currentUserLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!profileUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex flex-col items-center justify-center min-h-screen bg-background p-4"
      >
        <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
        <p className="text-muted-foreground mb-6">The profile you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </motion.div>
    );
  }
  
  const avatarSrc = profileUser.photoURL || `https://placehold.co/128x128.png?text=${profileUser.displayName?.charAt(0) || 'U'}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen bg-background"
    >
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
          {profileUser.username && (
            <p className="text-sm text-muted-foreground flex items-center">
              <AtSign className="h-3.5 w-3.5 mr-0.5" />{profileUser.username}
            </p>
          )}
          {profileUser.bio ? (
             <p className="text-sm text-muted-foreground mt-1 max-w-md whitespace-pre-line break-words">{profileUser.bio}</p>
          ) : (
             <p className="text-sm text-muted-foreground mt-1 italic">No bio yet.</p>
          )}

          <div className="flex justify-around items-center w-full max-w-xs sm:max-w-sm mt-6 py-3 bg-card/70 backdrop-blur-sm rounded-xl shadow">
            <StatItem value={userEvents.length} label="Events" />
            <Separator orientation="vertical" className="h-10 bg-border/50" />
            <StatItem 
                value={loadingFollowStatus && typeof followingCount !== 'number' ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : followingCount} 
                label="Following" 
                onClick={profileUser ? () => router.push(`/profile/following?userId=${profileUser.uid}&userName=${profileUser.displayName}`) : undefined}
                className={profileUser ? "cursor-pointer" : ""}
            />
            <Separator orientation="vertical" className="h-10 bg-border/50" />
            <StatItem 
                value={loadingFollowStatus && typeof followersCount !== 'number' ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : followersCount} 
                label="Followers" 
                onClick={profileUser ? () => router.push(`/profile/followers?userId=${profileUser.uid}&userName=${profileUser.displayName}`) : undefined}
                className={profileUser ? "cursor-pointer" : ""}
            />
          </div>

          {!isCurrentUserProfile && currentUser && (
            <div className="mt-6 w-full max-w-xs flex space-x-2">
                <Button 
                  onClick={handleFollowToggle} 
                  variant={isFollowing ? "outline" : "default"}
                  className={cn(
                    "flex-1 h-11 text-sm font-semibold", 
                    isFollowing ? "border-primary text-primary hover:bg-primary/10" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  disabled={loadingFollowStatus || followActionInProgress}
                >
                  {loadingFollowStatus || followActionInProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (isFollowing ? <UserCheck className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4"/>)}
                  {loadingFollowStatus ? 'Checking...' : (followActionInProgress ? (isFollowing ? 'Unfollowing...' : 'Following...') : (isFollowing ? 'Following' : 'Follow'))}
                </Button>
                 <Button 
                  variant="outline"
                  className="flex-1 h-11 text-sm font-semibold border-input hover:bg-accent"
                  onClick={handleMessage}
                  disabled={followActionInProgress || loadingFollowStatus || currentUserLoading}
                >
                  {followActionInProgress && !(loadingFollowStatus || currentUserLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageSquare className="mr-2 h-4 w-4"/>}
                  Message
                </Button>
            </div>
          )}
           {isCurrentUserProfile && (
             <Button onClick={() => router.push('/settings')} variant="outline" className="mt-6 w-full max-w-xs h-11 text-base font-semibold">
                Edit Profile
            </Button>
           )}
        </div>
      </div>

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
          <div className="p-4 space-y-3 text-sm bg-card rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">About {profileUser.displayName}</h3>
            {profileUser.bio ? (
                <p className="text-muted-foreground whitespace-pre-line">{profileUser.bio}</p>
            ) : (
                <p className="text-muted-foreground italic">This user hasn't added a bio yet.</p>
            )}
            {profileUser.username && (
                <p className="text-xs text-muted-foreground/70 pt-2">Username: @{profileUser.username}</p>
            )}
            <p className="text-xs text-muted-foreground/70 pt-2">User ID: {profileUser.uid}</p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
    
