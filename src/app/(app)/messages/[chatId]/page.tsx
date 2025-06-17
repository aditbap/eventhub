
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Paperclip, Smile, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, ChatParticipant, Chat } from '@/types';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  addDoc, 
  updateDoc,
  writeBatch,
  arrayUnion,
  Timestamp,
  setDoc,
  increment
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const chatId = params.chatId as string;

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatPartner, setChatPartner] = useState<ChatParticipant | null>(null);
  const [chatDetails, setChatDetails] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch chat details and messages
  useEffect(() => {
    if (!chatId || !currentUser) {
      if (!authLoading) router.replace('/login');
      return;
    }

    setIsLoading(true);

    // Fetch chat document to get participant details
    const chatDocRef = doc(db, 'chats', chatId);
    const unsubscribeChatDetails = onSnapshot(chatDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as Chat;
        setChatDetails(chatData);
        const partnerUid = chatData.participants.find(uid => uid !== currentUser.uid);
        if (partnerUid && chatData.participantDetails[partnerUid]) {
          setChatPartner(chatData.participantDetails[partnerUid]);
        } else {
          // Fallback: try to get partner UID from chatId if structure is simple uid1_uid2
          const uidsInChatId = chatId.split('_');
          const potentialPartnerUid = uidsInChatId.find(uid => uid !== currentUser.uid);
          if (potentialPartnerUid) {
            // Fetch partner details directly if not in chatDoc (e.g. chat just created)
            getDoc(doc(db, 'users', potentialPartnerUid)).then(userDoc => {
              if (userDoc.exists()) {
                const partnerData = userDoc.data();
                setChatPartner({
                  uid: potentialPartnerUid,
                  displayName: partnerData.displayName || 'User',
                  photoURL: partnerData.photoURL || null,
                  username: partnerData.username || null,
                });
              }
            });
          } else {
             console.warn("Could not determine chat partner from chat document or chat ID.");
             setChatPartner({ uid: 'unknown', displayName: 'Chat Partner', photoURL: null });
          }
        }

        // Mark messages as read when chat is opened
        if (chatData.unreadCounts && chatData.unreadCounts[currentUser.uid] > 0) {
          updateDoc(chatDocRef, {
            [`unreadCounts.${currentUser.uid}`]: 0
          }).catch(err => console.error("Error marking messages as read:", err));
        }

      } else {
        // Chat doc might not exist if this is the first time messaging.
        // Attempt to derive partner from chatId and fetch their details.
        const uids = chatId.split('_');
        const otherUid = uids.find(uid => uid !== currentUser.uid);
        if (otherUid) {
          getDoc(doc(db, 'users', otherUid)).then(userDoc => {
            if (userDoc.exists()) {
              const partnerData = userDoc.data();
              setChatPartner({
                uid: otherUid,
                displayName: partnerData.displayName || 'User',
                photoURL: partnerData.photoURL || null,
                username: partnerData.username || null,
              });
            } else {
               setChatPartner({ uid: 'unknown', displayName: 'New Chat', photoURL: null });
            }
          });
        } else {
          setChatPartner({ uid: 'unknown', displayName: 'New Chat', photoURL: null });
        }
      }
    }, (error) => {
        console.error("Error fetching chat details:", error);
        toast({ title: "Error", description: "Could not load chat information.", variant: "destructive" });
    });


    // Fetch messages
    const messagesColRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(fetchedMessages);
      setIsLoading(false);
      scrollToBottom();
    }, (error) => {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
        toast({ title: "Error", description: "Could not load messages.", variant: "destructive" });
    });

    return () => {
      unsubscribeChatDetails();
      unsubscribeMessages();
    };
  }, [chatId, currentUser, authLoading, router, scrollToBottom, toast]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !chatId || !chatPartner) return;

    setIsSending(true);

    const newMessage: Omit<ChatMessage, 'id' | 'chatId' | 'timestamp'> = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'User',
      senderAvatar: currentUser.photoURL || null,
      text: messageText.trim(),
      isRead: false, // Initially false
    };
    
    const finalMessageText = messageText.trim();
    setMessageText(''); // Clear input optimistically

    try {
      const batch = writeBatch(db);
      const chatDocRef = doc(db, 'chats', chatId);
      const messagesColRef = collection(db, 'chats', chatId, 'messages');
      const newMessageRef = doc(messagesColRef); // Generate new doc ref for message

      batch.set(newMessageRef, {
        ...newMessage,
        chatId: chatId,
        timestamp: serverTimestamp()
      });

      const chatDocSnap = await getDoc(chatDocRef);
      if (!chatDocSnap.exists()) {
        // Chat doesn't exist, create it
        if (!chatPartner || !currentUser.displayName) { // Need partner details to create chat
            console.error("Cannot create new chat: Missing current user display name or chat partner details.");
            toast({title: "Error", description: "Could not send message to new chat.", variant: "destructive"});
            setIsSending(false);
            setMessageText(finalMessageText); // Restore message text
            return;
        }
        const newChatData: Chat = {
          id: chatId,
          participants: [currentUser.uid, chatPartner.uid].sort(),
          participantDetails: {
            [currentUser.uid]: {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL || null,
              username: currentUser.username || null,
            },
            [chatPartner.uid]: {
              uid: chatPartner.uid,
              displayName: chatPartner.displayName,
              photoURL: chatPartner.photoURL || null,
              username: chatPartner.username || null,
            },
          },
          lastMessage: {
            text: finalMessageText,
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            timestamp: serverTimestamp() as Timestamp,
          },
          updatedAt: serverTimestamp() as Timestamp,
          unreadCounts: { // Initialize unread count for the recipient
            [chatPartner.uid]: 1,
            [currentUser.uid]: 0
          }
        };
        batch.set(chatDocRef, newChatData);
      } else {
        // Chat exists, update it
        batch.update(chatDocRef, {
          lastMessage: {
            text: finalMessageText,
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
          [`unreadCounts.${chatPartner.uid}`]: increment(1) // Increment unread for partner
        });
      }
      
      await batch.commit();
      scrollToBottom();

    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
      setMessageText(finalMessageText); // Restore message text on error
    } finally {
      setIsSending(false);
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (isLoading && !chatPartner) { // Initial loading state for header
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
  const partnerAvatarSrc = chatPartner?.photoURL || `https://placehold.co/40x40.png?text=${partnerName.charAt(0)}`;


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
          <AvatarImage src={partnerAvatarSrc} alt={partnerName} data-ai-hint="chat partner avatar"/>
          <AvatarFallback>{partnerName ? partnerName.charAt(0).toUpperCase() : <UserCircle/>}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
            <h1 className="text-md font-semibold text-foreground truncate">{partnerName}</h1>
            {/* <p className="text-xs text-muted-foreground">Online</p> // Presence detection is complex */}
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
             <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full group",
              msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn("flex items-end max-w-[75%]", msg.senderId === currentUser?.uid ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="h-7 w-7 mb-1 flex-shrink-0 mx-2">
                <AvatarImage 
                    src={msg.senderId === currentUser?.uid ? (currentUser?.photoURL || undefined) : (chatPartner?.photoURL || undefined)} 
                    alt={msg.senderName || "User"}
                    data-ai-hint={msg.senderId === currentUser?.uid ? "your avatar" : "sender avatar"}
                />
                <AvatarFallback>
                    {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : <UserCircle size={16} />}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "p-2.5 rounded-xl shadow-sm text-sm relative",
                  msg.senderId === currentUser?.uid
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <p className={cn(
                    "text-xs mt-1 opacity-70",
                     msg.senderId === currentUser?.uid ? "text-right" : "text-left"
                    )}>
                    {msg.timestamp instanceof Timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="sticky bottom-0 bg-background border-t p-2 sm:p-3">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
           <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full" disabled>
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-grow h-11 rounded-full px-4 border-input focus-visible:ring-primary"
            disabled={isSending || isLoading || !chatPartner}
          />
           <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full" disabled>
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" className="bg-primary text-primary-foreground rounded-full h-11 w-11" disabled={isSending || !messageText.trim() || isLoading || !chatPartner}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </footer>
    </motion.div>
  );
}

