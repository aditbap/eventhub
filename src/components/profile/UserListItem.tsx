
'use client';

import React, { useState, useEffect } from 'react';
import type { PublicUserProfile } from '@/types'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2, AtSign } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

interface UserListItemProps {
  profileUser: PublicUserProfile;
  currentUserUid?: string | null; 
  onFollowStateChange?: (targetUserId: string, isNowFollowing: boolean) => void;
  showFollowButton?: boolean;
}

export function UserListItem({ 
  profileUser, 
  currentUserUid,
  onFollowStateChange,
  showFollowButton = true 
}: UserListItemProps) {
  const { user: authUser } = useAuth(); 
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollowState, setLoadingFollowState] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const { toast } = useToast();

  // Log the profileUser details when the component renders or props change
  console.log(`[UserListItem] Rendering for user: ${profileUser.displayName}, UID: ${profileUser.uid}, Username: ${profileUser.username || 'N/A'}`);

  useEffect(() => {
    if (!currentUserUid || !profileUser.uid || currentUserUid === profileUser.uid || !showFollowButton) {
      setLoadingFollowState(false);
      return;
    }
    setLoadingFollowState(true);
    const checkFollowingStatus = async () => {
      try {
        const followingDocRef = doc(db, 'users', currentUserUid, 'following', profileUser.uid);
        const docSnap = await getDoc(followingDocRef);
        setIsFollowing(docSnap.exists());
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setLoadingFollowState(false);
      }
    };
    checkFollowingStatus();
  }, [currentUserUid, profileUser.uid, showFollowButton]);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();

    if (!currentUserUid || !authUser || currentUserUid === profileUser.uid || !showFollowButton) return;

    setActionInProgress(true);
    const batch = writeBatch(db);
    const currentUserFollowingRef = doc(db, 'users', currentUserUid, 'following', profileUser.uid);
    const targetUserFollowersRef = doc(db, 'users', profileUser.uid, 'followers', currentUserUid);

    try {
      if (isFollowing) { 
        batch.delete(currentUserFollowingRef);
        batch.delete(targetUserFollowersRef);
        await batch.commit();
        setIsFollowing(false);
        toast({ title: `Unfollowed ${profileUser.displayName}` });
        if (onFollowStateChange) onFollowStateChange(profileUser.uid, false);
      } else { 
        batch.set(currentUserFollowingRef, { 
            displayName: profileUser.displayName, 
            username: profileUser.username || null, 
            photoURL: profileUser.photoURL || null, 
            followedAt: serverTimestamp() 
        });
        batch.set(targetUserFollowersRef, { 
            displayName: authUser.displayName, 
            username: authUser.username || null, 
            photoURL: authUser.photoURL || null, 
            followerAt: serverTimestamp() 
        });
        
        const notificationData: Omit<Notification, 'id' | 'timestamp'> = {
            userId: profileUser.uid, 
            category: 'social',
            title: `${authUser.displayName || 'Someone'} started following you`,
            message: `You have a new follower! Check out their profile.`,
            relatedUserId: authUser.uid,
            relatedUserName: authUser.displayName,
            relatedUserAvatar: authUser.photoURL,
            link: `/users/${authUser.uid}`,
            isRead: false,
            icon: 'UserPlus',
        };
        const notificationsColRef = collection(db, 'userNotifications');
        const newNotificationRef = doc(notificationsColRef); 
        batch.set(newNotificationRef, { ...notificationData, timestamp: serverTimestamp() });

        await batch.commit();
        setIsFollowing(true);
        toast({ title: `Followed ${profileUser.displayName}!` });
        if (onFollowStateChange) onFollowStateChange(profileUser.uid, true);
      }
    } catch (error) {
      console.error("Error toggling follow state:", error);
      toast({ title: "Error", description: "Could not update follow status.", variant: "destructive" });
    } finally {
      setActionInProgress(false);
    }
  };
  
  const avatarSrc = profileUser.photoURL || `https://placehold.co/40x40.png?text=${profileUser.displayName?.charAt(0) || 'P'}`;

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm hover:bg-muted/50 transition-colors">
      <Link href={`/users/${profileUser.uid}`} className="flex items-center space-x-3 flex-grow min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarSrc} alt={profileUser.displayName || 'User'} data-ai-hint="user avatar" />
          <AvatarFallback>{profileUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{profileUser.displayName || 'User'}</p>
          {profileUser.username && (
            <p className="text-xs text-muted-foreground flex items-center truncate">
              <AtSign className="h-3 w-3 mr-0.5"/>{profileUser.username}
            </p>
          )}
          {!profileUser.username && profileUser.bio && ( // Show bio if no username but bio exists
             <p className="text-xs text-muted-foreground truncate">{profileUser.bio}</p>
          )}
        </div>
      </Link>
      {showFollowButton && currentUserUid && currentUserUid !== profileUser.uid && (
        <div className="ml-auto pl-2 flex-shrink-0">
          {loadingFollowState ? (
            <Button variant="outline" size="sm" disabled className="w-[100px]">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={handleFollowToggle}
              disabled={actionInProgress}
              className="w-[100px]"
              aria-label={isFollowing ? `Unfollow ${profileUser.displayName}` : `Follow ${profileUser.displayName}`}
            >
              {actionInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserCheck className="mr-1.5 h-4 w-4" /> Following
                </>
              ) : (
                <>
                  <UserPlus className="mr-1.5 h-4 w-4" /> Follow
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

