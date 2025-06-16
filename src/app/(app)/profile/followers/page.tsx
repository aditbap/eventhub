
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, Loader2, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { PublicUserProfile } from '@/types';
import { UserListItem } from '@/components/profile/UserListItem'; // Assuming this component exists
import { motion } from 'framer-motion';

function FollowersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: authLoading } = useAuth();

  const targetUserId = searchParams.get('userId');
  const targetUserName = searchParams.get('userName');

  const [followers, setFollowers] = useState<PublicUserProfile[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [pageTitle, setPageTitle] = useState('Followers');

  const effectiveUserId = targetUserId || currentUser?.uid;

  useEffect(() => {
    if (targetUserId && targetUserName) {
        setPageTitle(`${targetUserName}'s Followers`);
    } else if (currentUser) {
        setPageTitle('Your Followers');
    }
  }, [targetUserId, targetUserName, currentUser]);


  useEffect(() => {
    if (!effectiveUserId) {
      if (!authLoading) router.replace('/login'); // Redirect if no user context and not loading
      return;
    }

    const fetchFollowers = async () => {
      setLoadingFollowers(true);
      try {
        const followersColRef = collection(db, 'users', effectiveUserId, 'followers');
        const followersSnap = await getDocs(followersColRef);
        
        const followersList: PublicUserProfile[] = [];
        for (const followerDoc of followersSnap.docs) {
          const followerId = followerDoc.id;
          const userDocRef = doc(db, 'users', followerId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            followersList.push({
              uid: followerId,
              displayName: userData.displayName || 'User',
              photoURL: userData.photoURL || undefined,
              bio: userData.bio || undefined,
            });
          }
        }
        setFollowers(followersList);
      } catch (error) {
        console.error("Error fetching followers:", error);
        // Handle error display, e.g., toast
      } finally {
        setLoadingFollowers(false);
      }
    };

    fetchFollowers();
  }, [effectiveUserId, authLoading, router]);

  const handleFollowStateChange = (changedUserId: string, isNowFollowing: boolean) => {
    // This function could be used to update UI optimistically if needed,
    // but for now, UserListItem handles its own follow state.
    // We might need to refetch or update counts if this page showed them.
  };

  if (authLoading && !effectiveUserId) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">{pageTitle}</h1>
        <div className="w-9 h-9"></div> {/* Spacer */}
      </header>

      <main className="p-4">
        {loadingFollowers ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : followers.length > 0 ? (
          <div className="space-y-3">
            {followers.map((follower) => (
              <UserListItem 
                key={follower.uid} 
                profileUser={follower} 
                currentUserUid={currentUser?.uid}
                onFollowStateChange={handleFollowStateChange}
                showFollowButton={!!currentUser && follower.uid !== currentUser.uid}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" strokeWidth={1.5}/>
            <p className="text-xl font-semibold text-muted-foreground">
                {targetUserId && targetUserName ? `${targetUserName} has no followers yet.` : "You don't have any followers yet."}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                Share your profile or events to connect with others!
            </p>
            {!targetUserId && (
                <Button onClick={() => router.push('/explore')} className="mt-6">
                    Discover More
                </Button>
            )}
          </div>
        )}
      </main>
    </motion.div>
  );
}

export default function FollowersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <FollowersPageContent />
    </Suspense>
  );
}
