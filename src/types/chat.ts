
import type { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string; // Firestore document ID of the message
  chatId: string; // ID of the chat this message belongs to
  senderId: string;
  senderName?: string; // Denormalized sender name
  senderAvatar?: string | null; // Denormalized sender avatar
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
  id: string; // Firestore document ID (e.g., uid1_uid2 sorted)
  participants: string[]; // Array of two user UIDs
  participantDetails: { // Store details of both participants for easy access
    [key: string]: ChatParticipant; // Keyed by UID
  };
  lastMessage?: {
    text: string;
    senderId: string;
    senderName?: string; // Denormalized sender name for quick display
    timestamp: Timestamp | Date;
  };
  updatedAt: Timestamp | Date; // For sorting chats
  unreadCounts?: { [userId: string]: number }; // Optional: for unread message counts per user
}
