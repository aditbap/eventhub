
export interface Attendee {
  id: string;
  avatarUrl: string;
  name: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string or formatted string
  time?: string;
  location: string;
  venue?: string;
  category: 'Music' | 'Food' | 'Sports' | 'Tech' | 'Other';
  imageUrl: string;
  imageHint?: string;
  attendanceCount?: number;
  attendees?: Attendee[]; // Array of attendee objects for avatars
  isBookmarked?: boolean; // client-side state
  price?: number; // Optional price
  creatorId?: string; // UID of the user who created the event
}
