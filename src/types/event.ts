export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string or formatted string
  time?: string;
  location: string;
  venue?: string;
  category: 'Music' | 'Food' | 'Sports' | 'Other';
  imageUrl: string;
  imageHint?: string;
  attendanceCount?: number;
  isBookmarked?: boolean; // client-side state
  price?: number; // Optional price
}
