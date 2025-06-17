
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Paperclip, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
// import type { ChatMessage, ChatParticipant } from '@/types';
// import { db } from '@/lib/firebase';
// import { doc, getDoc, collection, onSnapshot, query, orderBy, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

// Placeholder data - replace with actual message fetching and sending logic
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const chatId = params.chatId as string;

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]); // Replace 'any' with ChatMessage[]
  const [chatPartner, setChatPartner] = useState<any | null>(null); // Replace 'any' with ChatParticipant
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Placeholder: Fetch chat details and messages
  useEffect(() => {
    if (!chatId || !currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Simulate fetching chat partner and messages
    setTimeout(() => {
      // Example: const uids = chatId.split('_'); const otherUid = uids.find(uid => uid !== currentUser.uid);
      // Fetch other user's details based on otherUid
      setChatPartner({ displayName: "Chat Partner", photoURL: `https://placehold.co/40x40.png?text=P` });
      setMessages([
        { id: '1', senderId: 'otherUserUid', text: 'Hello!', timestamp: new Date(), senderName: 'Chat Partner' },
        { id: '2', senderId: currentUser.uid, text: 'Hi there!', timestamp: new Date(), senderName: currentUser.displayName },
        { id: '3', senderId: 'otherUserUid', text: 'How are you?', timestamp: new Date(), senderName: 'Chat Partner' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [chatId, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !chatId) return;

    setIsSending(true);
    // Placeholder: const newMessage = { senderId: currentUser.uid, text: messageText, timestamp: serverTimestamp() };
    // Add to Firestore, update local state optimistically or refetch
    console.log("Sending message:", messageText);
    setTimeout(() => {
        // Optimistic update example
        setMessages(prev => [...prev, { id: Date.now().toString(), senderId: currentUser.uid, text: messageText, timestamp: new Date(), senderName: currentUser.displayName }]);
        setMessageText('');
        setIsSending(false);
    }, 500);
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading && !chatPartner) {
    return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-30 flex items-center px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full h-16">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </header>
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  const partnerName = chatPartner?.displayName || "Chat";
  const partnerAvatar = chatPartner?.photoURL || `https://placehold.co/40x40.png?text=${partnerName.charAt(0)}`;


  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col h-screen bg-background"
    >
      <header className="sticky top-0 z-30 flex items-center px-2 sm:px-4 py-2 bg-background/90 backdrop-blur-md border-b w-full h-16">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Avatar className="h-9 w-9 mr-3">
          <AvatarImage src={partnerAvatar} alt={partnerName} data-ai-hint="chat partner avatar"/>
          <AvatarFallback>{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
            <h1 className="text-md font-semibold text-foreground truncate">{partnerName}</h1>
            {/* <p className="text-xs text-muted-foreground">Online</p> */}
        </div>
        {/* <Button variant="ghost" size="icon" className="ml-auto rounded-full"> <MoreVertical className="h-5 w-5" /> </Button> */}
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
             <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={cn(
              "flex w-full",
              msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
            )}
          >
            <div className="flex items-end max-w-[75%]">
              {msg.senderId !== currentUser?.uid && (
                 <Avatar className="h-7 w-7 mr-2 mb-1 flex-shrink-0">
                    <AvatarImage src={chatPartner?.photoURL || `https://placehold.co/40x40.png?text=${(chatPartner?.displayName || 'P').charAt(0)}`} alt={chatPartner?.displayName || "Partner"} data-ai-hint="sender avatar"/>
                    <AvatarFallback>{(chatPartner?.displayName || 'P').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "p-2.5 rounded-xl shadow-sm text-sm",
                  msg.senderId === currentUser?.uid
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <p className={cn(
                    "text-xs mt-1",
                     msg.senderId === currentUser?.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"
                    )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
               {msg.senderId === currentUser?.uid && (
                 <Avatar className="h-7 w-7 ml-2 mb-1 flex-shrink-0">
                    <AvatarImage src={currentUser?.photoURL || `https://placehold.co/40x40.png?text=${(currentUser?.displayName || 'Y').charAt(0)}`} alt={currentUser?.displayName || "You"} data-ai-hint="your avatar"/>
                    <AvatarFallback>{(currentUser?.displayName || 'Y').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="sticky bottom-0 bg-background border-t p-2 sm:p-3">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
           <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-grow h-11 rounded-full px-4 border-input focus-visible:ring-primary"
            disabled={isSending}
          />
           <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" className="bg-primary text-primary-foreground rounded-full h-11 w-11" disabled={isSending || !messageText.trim()}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </footer>
    </motion.div>
  );
}
