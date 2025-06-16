
export type NotificationCategory = 'event_registration' | 'event_reminder' | 'announcement' | 'social';

export interface Notification {
  id: string; // Firestore document ID
  userId: string; // To whom this notification belongs
  category: NotificationCategory;
  title: string;
  message: string;
  relatedEventId?: string; // Optional: links to an event
  relatedEventName?: string; // Optional: event name for display
  relatedEventImageUrl?: string; // Optional: event image for display
  relatedEventImageHint?: string; // Optional: AI hint for event image
  link?: string; // Optional: a specific link for the notification to navigate to
  timestamp: string; // ISO string, from Firestore serverTimestamp
  isRead: boolean;
  icon?: string; // Lucide icon name string, e.g., 'Ticket', 'CalendarClock'
}
