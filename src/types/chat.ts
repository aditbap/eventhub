
import type { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string; // Firestore document ID of the message
  chatId: string; // ID of the chat this message belongs to
  senderId: string;
  senderName?: string; // Optional: denormalized sender name
  senderAvatar?: string | null; // Optional: denormalized sender avatar
  text: string;
  timestamp: Timestamp | Date; // Firestore Timestamp or Date object for client-side
  isRead?: boolean; // Optional: for read receipts
}

export interface ChatParticipant {
  uid: string;
  displayName: string | null;
  photoURL?: string | null;
  username?: string | null;
}

export interface Chat {
  id: string; // Firestore document ID (e.g., uid1_uid2)
  participants: string[]; // Array of two user UIDs
  participantDetails: ChatParticipant[]; // Array of participant details
  lastMessage?: Pick<ChatMessage, 'text' | 'senderId' | 'timestamp'> & { senderName?: string };
  updatedAt: Timestamp | Date; // For sorting chats
  // unreadCounts?: { [userId: string]: number }; // Optional: for unread message counts
}
