
import type { Event } from '@/types';

// Initial mock events (moved from explore page and diversified)
const MOCK_EVENTS_INITIAL: Event[] = [
  {
    id: '1',
    title: 'UPJ Annual Music Fest',
    description: 'Join us for an unforgettable summer music festival featuring top artists and bands from various genres. Enjoy a variety of food stalls, interactive experiences, and art installations. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    date: '2024-08-15',
    time: '18:00',
    location: 'UPJ Grand Plaza',
    venue: 'Main Stage UPJ',
    category: 'Music',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'music festival concert',
    attendanceCount: 1250,
    price: 50,
    attendees: [
      { id: 'a1', avatarUrl: 'https://placehold.co/32x32.png?text=U1', name: 'User One' },
      { id: 'a2', avatarUrl: 'https://placehold.co/32x32.png?text=U2', name: 'User Two' },
      { id: 'a3', avatarUrl: 'https://placehold.co/32x32.png?text=U3', name: 'User Three' },
    ],
    isBookmarked: false,
  },
  {
    id: '2',
    title: 'Campus Food Truck Rally',
    description: 'A culinary adventure awaits! Sample delicious treats from the best food trucks gathering on campus. From savory to sweet, there is something for everyone. Family-friendly with live acoustic music. Bring your friends and enjoy a delightful afternoon.',
    date: '2024-09-05',
    time: '12:00',
    location: 'UPJ Central Park',
    venue: 'Food Arena',
    category: 'Food',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'food trucks festival',
    attendanceCount: 870,
    price: 0, // Free event
    attendees: [
      { id: 'b1', avatarUrl: 'https://placehold.co/32x32.png?text=S1', name: 'Student Alpha' },
      { id: 'b2', avatarUrl: 'https://placehold.co/32x32.png?text=S2', name: 'Student Beta' },
    ],
    isBookmarked: true,
  },
  {
    id: '3',
    title: 'UPJ Charity Run 5K',
    description: 'Lace up your running shoes for a good cause. This 5K run aims to raise funds for local charities and promote a healthy lifestyle on campus. All fitness levels welcome. Medals for all finishers and special prizes for top runners!',
    date: '2024-09-22',
    time: '07:00',
    location: 'UPJ Sports Complex',
    venue: 'Campus Track',
    category: 'Sports',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'charity run marathon',
    attendanceCount: 530,
    price: 10,
    isBookmarked: false,
  },
   {
    id: '4',
    title: 'Tech Innovators Summit',
    description: 'Explore the latest in technology and innovation at the annual Tech Innovators Summit. Featuring keynote speakers, workshops, and a startup showcase. Network with industry leaders and discover emerging trends.',
    date: '2024-10-10',
    time: '09:00',
    location: 'UPJ Auditorium',
    category: 'Tech',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'tech conference summit',
    attendanceCount: 450,
    price: 75,
    attendees: [
      { id: 'c1', avatarUrl: 'https://placehold.co/32x32.png?text=T1', name: 'Techie A' },
      { id: 'c2', avatarUrl: 'https://placehold.co/32x32.png?text=T2', name: 'Techie B' },
      { id: 'c3', avatarUrl: 'https://placehold.co/32x32.png?text=T3', name: 'Techie C' },
      { id: 'c4', avatarUrl: 'https://placehold.co/32x32.png?text=T4', name: 'Techie D' },
    ],
    isBookmarked: true,
  },
  {
    id: '5',
    title: 'Open Mic Night',
    description: 'Showcase your talent or enjoy performances from fellow students. Poetry, music, comedy - all are welcome! A casual and supportive environment for creative expression.',
    date: '2024-08-28',
    time: '19:30',
    location: 'Student Union Cafe',
    category: 'Other',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'open mic cafe',
    attendanceCount: 95,
    price: 0,
    isBookmarked: false,
  },
  {
    id: '6',
    title: 'Inter-Faculty Basketball Tournament',
    description: 'Cheer for your faculty team or participate in the annual inter-faculty basketball tournament. Expect thrilling matches and a vibrant atmosphere. Finals will be held on the last day.',
    date: '2024-11-02',
    time: '14:00',
    location: 'UPJ Indoor Sports Hall',
    category: 'Sports',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'basketball tournament sport',
    attendanceCount: 600, // Estimated spectators
    price: 5,
    attendees: [ /* Player lists could be too long, focus on general attendance */ ],
    isBookmarked: true,
  }
];

let eventsData: Event[] = [...MOCK_EVENTS_INITIAL];
const subscribers: Set<() => void> = new Set();

export const eventStore = {
  getEvents: (): Event[] => {
    return [...eventsData].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Keep sorted by date descending for consistency
  },
  addEvent: (newEvent: Event): void => {
    eventsData = [newEvent, ...eventsData];
    subscribers.forEach(callback => callback());
  },
  getEventById: (id: string): Event | undefined => {
    return eventsData.find(event => event.id === id);
  },
  subscribe: (callback: () => void): (() => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback); // Unsubscribe function
  },
};
