
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, Loader2, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { PublicUserProfile } from '@/types';
import { UserListItem } from '@/components/profile/UserListItem';
import { motion } from 'framer-motion';

function FollowingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: authLoading } = useAuth();

  const targetUserId = searchParams.get('userId');
  const targetUserName = searchParams.get('userName');

  const [following, setFollowing] = useState<PublicUserProfile[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [pageTitle, setPageTitle] = useState('Following');

  const effectiveUserId = targetUserId || currentUser?.uid;

  useEffect(() => {
    if (targetUserId && targetUserName) {
        setPageTitle(`${targetUserName} is Following`);
    } else if (currentUser) {
        setPageTitle('Who You Follow');
    }
  }, [targetUserId, targetUserName, currentUser]);


  useEffect(() => {
    if (!effectiveUserId) {
      if (!authLoading) router.replace('/login');
      return;
    }

    const fetchFollowing = async () => {
      setLoadingFollowing(true);
      try {
        const followingColRef = collection(db, 'users', effectiveUserId, 'following');
        const followingSnap = await getDocs(followingColRef);
        
        const followingList: PublicUserProfile[] = [];
        for (const followedDoc of followingSnap.docs) {
          const followedId = followedDoc.id;
          const userDocRef = doc(db, 'users', followedId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            followingList.push({
              uid: followedId,
              displayName: userData.displayName || 'User',
              photoURL: userData.photoURL || undefined,
              bio: userData.bio || undefined,
            });
          }
        }
        setFollowing(followingList);
      } catch (error) {
        console.error("Error fetching following list:", error);
      } finally {
        setLoadingFollowing(false);
      }
    };

    fetchFollowing();
  }, [effectiveUserId, authLoading, router]);
  
  const handleFollowStateChange = (changedUserId: string, isNowFollowing: boolean) => {
    // If the current user is viewing their own "following" list and unfollows someone,
    // remove that person from the list optimistically or refetch.
    if (effectiveUserId === currentUser?.uid && !isNowFollowing) {
      setFollowing(prev => prev.filter(user => user.uid !== changedUserId));
    }
    // If another user's list is being viewed, UserListItem will handle its own state.
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
        {loadingFollowing ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : following.length > 0 ? (
          <div className="space-y-3">
            {following.map((followedUser) => (
              <UserListItem 
                key={followedUser.uid} 
                profileUser={followedUser} 
                currentUserUid={currentUser?.uid}
                onFollowStateChange={handleFollowStateChange}
                showFollowButton={!!currentUser && followedUser.uid !== currentUser.uid} // Show follow if not current user and not self
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-xl shadow-sm mt-4">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" strokeWidth={1.5}/>
            <p className="text-xl font-semibold text-muted-foreground">
                {targetUserId && targetUserName ? `${targetUserName} is not following anyone yet.` : "You are not following anyone yet."}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
              Explore profiles and events to find people to follow!
            </p>
             {!targetUserId && (
                <Button onClick={() => router.push('/explore')} className="mt-6">
                    Explore People & Events
                </Button>
            )}
          </div>
        )}
      </main>
    </motion.div>
  );
}

export default function FollowingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <FollowingPageContent />
    </Suspense>
  );
}

