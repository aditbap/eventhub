
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquarePlus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Placeholder: In a real app, you'd fetch and display actual chats here
const PlaceholderChats = () => (
  <div className="text-center py-10 text-muted-foreground bg-card rounded-lg shadow-sm mt-6">
    <MessageSquarePlus className="h-16 w-16 mx-auto mb-4 opacity-30" />
    <p className="text-xl font-semibold">No Messages Yet</p>
    <p className="text-sm mt-1">
      Start a new conversation from a user's profile or the social search page.
    </p>
  </div>
);

export default function MessagesPage() {
  const router = useRouter();

  // Placeholder data - replace with actual chat fetching logic
  const chats: any[] = []; // e.g., fetch from Firestore
  const isLoading = false; // e.g., loading state from fetch

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

      <main className="flex-grow p-4 pb-20">
        {/* Placeholder for search/filter bar for chats */}
        {/* <Input placeholder="Search chats..." className="mb-4" /> */}
        
        {isLoading ? (
          <p>Loading chats...</p>
        ) : chats.length === 0 ? (
          <PlaceholderChats />
        ) : (
          <div className="space-y-3">
            {/* Map through actual chats here */}
            {/* Example:
            {chats.map(chat => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
            */}
          </div>
        )}
      </main>
    </motion.div>
  );
}

// Placeholder ChatItem component (to be implemented later)
// const ChatItem = ({ chat }: { chat: any }) => (
//   <div className="p-3 bg-card rounded-lg shadow-sm hover:bg-muted/50 cursor-pointer">
//     <p className="font-semibold">{chat.otherUserName || 'Chat'}</p>
//     <p className="text-sm text-muted-foreground truncate">{chat.lastMessage?.text || 'No messages yet'}</p>
//   </div>
// );
