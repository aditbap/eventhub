
export type NotificationCategory = 'event_registration' | 'event_reminder' | 'announcement' | 'social';

export interface Notification {
  id: string; // Firestore document ID
  userId: string; // To whom this notification belongs
  category: NotificationCategory;
  title: string;
  message: string;
  relatedEventId?: string; 
  relatedEventName?: string; 
  relatedEventImageUrl?: string; 
  relatedEventImageHint?: string; 
  relatedUserId?: string; // For social notifications, UID of the actor
  relatedUserName?: string; // For social notifications, name of the actor
  relatedUserAvatar?: string; // For social notifications, avatar of the actor
  link?: string; 
  timestamp: string; // ISO string, from Firestore serverTimestamp
  isRead: boolean;
  icon?: string; 
}
