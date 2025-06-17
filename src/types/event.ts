
export interface Attendee {
  id: string;
  avatarUrl: string;
  name: string;
}

export interface Event {
  id: string; // Firestore document ID
  title: string;
  description: string;
  date: string; // ISO string or formatted string YYYY-MM-DD
  time?: string; // HH:MM
  location: string;
  venue?: string;
  category: 'Music' | 'Food' | 'Sports' | 'Tech' | 'Other';
  imageUrl: string;
  imageHint?: string;
  attendanceCount?: number; // Consider how this is updated (e.g. transactions or cloud function)
  attendees?: Attendee[]; // Potentially store as a subcollection for scalability
  isBookmarked?: boolean; // Purely client-side state for now, managed by eventStore
  price?: number;
  creatorId: string; // UID of the user who created the event
  creatorName?: string; // Denormalized creator name for quick display
  createdAt?: any; // Firestore Timestamp on write, JS Date or ISO string on read
  // Consider adding updatedAt if events can be edited
}
