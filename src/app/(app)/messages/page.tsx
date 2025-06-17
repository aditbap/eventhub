
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquarePlus, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, type Timestamp } from 'firebase/firestore';
import type { Chat, ChatParticipant } from '@/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast'; 

interface ChatItemProps {
  chat: Chat;
  currentUserUid: string;
}

const ChatListItem: React.FC<ChatItemProps> = ({ chat, currentUserUid }) => {
  const router = useRouter();
  const otherParticipantUid = chat.participants.find(p => p !== currentUserUid);
  
  if (!otherParticipantUid) return null; 

  const otherParticipant = chat.participantDetails[otherParticipantUid];

  if (!otherParticipant) {
    console.warn("Other participant details not found for chat:", chat.id, "other UID:", otherParticipantUid);
    return ( 
        <div className="p-3 bg-card rounded-lg shadow-sm hover:bg-muted/50 cursor-pointer animate-pulse">
            <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-foreground">Loading...</p>
                    <p className="text-sm text-muted-foreground truncate">Loading message...</p>
                </div>
            </div>
        </div>
    );
  }

  const lastMessageText = chat.lastMessage?.text || 'No messages yet.';
  const lastMessageTimestamp = chat.lastMessage?.timestamp
    ? formatDistanceToNowStrict(new Date((chat.lastMessage.timestamp as Timestamp).toDate()), { addSuffix: true })
    : '';
  const isLastMessageFromCurrentUser = chat.lastMessage?.senderId === currentUserUid;
  const lastMessageSenderName = isLastMessageFromCurrentUser ? "You" : chat.lastMessage?.senderName;
  const displayLastMessage = lastMessageSenderName ? `${lastMessageSenderName}: ${lastMessageText}` : lastMessageText;

  const unreadCount = chat.unreadCounts?.[currentUserUid] || 0;

  return (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => router.push(`/messages/${chat.id}`)}
        className={cn(
            "p-3 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ease-in-out",
            unreadCount > 0 ? "bg-primary/10 hover:bg-primary/20" : "bg-card hover:bg-muted/50"
        )}
    >
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherParticipant.photoURL || `https://placehold.co/48x48.png?text=${otherParticipant.displayName?.charAt(0)}`} alt={otherParticipant.displayName || 'User'} data-ai-hint="chat partner avatar"/>
          <AvatarFallback>{otherParticipant.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="font-semibold truncate text-foreground">{otherParticipant.displayName || 'Chat User'}</p>
            {lastMessageTimestamp && <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{lastMessageTimestamp}</p>}
          </div>
          <p className={cn("text-sm truncate", unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground")}>
            {displayLastMessage}
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>
    </motion.div>
  );
};


export default function MessagesPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast(); 

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    if (!currentUser || !currentUser.uid) { // Explicitly check for user and uid
      router.replace('/login');
      return;
    }

    setLoadingChats(true);
    console.log(`[MessagesPage] Current user UID: ${currentUser.uid}. Setting up Firestore listener for chats.`);
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedChats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        fetchedChats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setChats(fetchedChats);
      setLoadingChats(false);
      console.log(`[MessagesPage] Successfully fetched ${fetchedChats.length} chats.`);
    }, (error) => {
      console.error("[MessagesPage] Error fetching chats (onSnapshot):", error);
      if (error.code === 'permission-denied' || (error as any).code === 'failed-precondition') {
        console.error("[MessagesPage] Firestore permission error or missing index. Please check your Firestore rules and ensure the necessary composite index exists for 'chats' collection (participants array-contains ASC, updatedAt DESC).");
        toast({
            title: "Error Loading Chats",
            description: "Could not load your conversations. This might be a permission issue or a missing database index. Ensure Firestore index: `chats` (participants Array ASC, updatedAt Timestamp DESC) exists.",
            variant: "destructive",
            duration: 15000, 
        });
      } else {
         toast({
            title: "Error Loading Chats",
            description: `An unexpected error occurred: ${error.message}`,
            variant: "destructive",
        });
      }
      setLoadingChats(false);
    });

    return () => {
      console.log("[MessagesPage] Unsubscribing from Firestore chats listener.");
      unsubscribe();
    };
  }, [currentUser, authLoading, router, toast]);

  const filteredChats = chats.filter(chat => {
    if (!currentUser) return false;
    const otherParticipantUid = chat.participants.find(p => p !== currentUser.uid);
    if (!otherParticipantUid) return false;
    const otherParticipant = chat.participantDetails[otherParticipantUid];
    if (!otherParticipant) return false;
    
    return (otherParticipant.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (otherParticipant.username || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading authentication...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="flex flex-col min-h-screen bg-background"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full h-16">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Messages</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push('/social')} className="text-foreground hover:bg-muted/20 rounded-full" aria-label="Search users to message">
          <Search className="h-6 w-6" />
        </Button>
      </header>

      <main className="flex-grow p-4 pb-20 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search chats..." 
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loadingChats ? (
          <div className="flex flex-col justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-card rounded-lg shadow-sm mt-6">
            <MessageSquarePlus className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-semibold">
                {searchTerm ? 'No chats match your search' : 'No Messages Yet'}
            </p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Try a different search term.' : 'Start a new conversation from a user\'s profile or the social search page.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentUser && filteredChats.map(chat => (
              <ChatListItem key={chat.id} chat={chat} currentUserUid={currentUser.uid}/>
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}

