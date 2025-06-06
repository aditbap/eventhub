
import type { Event } from '@/types';

// Initial mock events (moved from explore page)
const MOCK_EVENTS_INITIAL: Event[] = [
  {
    id: '1',
    title: 'UPJ Concert',
    description: 'An amazing summer music festival.',
    date: '2024-08-15',
    time: '18:00',
    location: 'UPJ Bintaro',
    category: 'Music',
    imageUrl: 'https://placehold.co/300x200.png',
    imageHint: 'concert stage',
    attendanceCount: 235,
    price: 50,
    attendees: [
      { id: 'a1', avatarUrl: 'https://placehold.co/32x32.png?text=A', name: 'User A' },
      { id: 'a2', avatarUrl: 'https://placehold.co/32x32.png?text=B', name: 'User B' },
      { id: 'a3', avatarUrl: 'https://placehold.co/32x32.png?text=C', name: 'User C' },
    ]
  },
  {
    id: '2',
    title: 'Forkalympics',
    description: 'Taste the best food trucks in town.',
    date: '2024-09-18',
    time: '12:00',
    location: 'UPJ Bintaro',
    category: 'Sports',
    imageUrl: 'https://placehold.co/300x200.png',
    imageHint: 'sports crowd',
    attendanceCount: 217,
    price: 0,
    attendees: [
      { id: 'b1', avatarUrl: 'https://placehold.co/32x32.png?text=D', name: 'User D' },
      { id: 'b2', avatarUrl: 'https://placehold.co/32x32.png?text=E', name: 'User E' },
      { id: 'b3', avatarUrl: 'https://placehold.co/32x32.png?text=F', name: 'User F' },
    ]
  },
  {
    id: '3',
    title: 'Malam Minggu Concert',
    description: 'Run for a cause!',
    date: '2024-08-01',
    time: '19:00',
    location: 'Bintaro Xchange',
    category: 'Music',
    imageUrl: 'https://placehold.co/100x100.png',
    imageHint: 'female singer',
    attendanceCount: 500,
    price: 10
  },
  {
    id: '4',
    title: 'AI Showtime',
    description: 'Latest in tech innovations.',
    date: '2024-10-01',
    time: '10:00',
    location: 'Online',
    category: 'Tech',
    imageUrl: 'https://placehold.co/100x100.png',
    imageHint: 'tech desk',
    attendanceCount: 300,
    price: 100
  },
  { id: '5', title: 'Local Indie Night', description: 'Discover local indie bands.', date: '2024-08-28', time: '20:00', location: 'Coffee Town Bintaro', category: 'Music', imageUrl: 'https://placehold.co/300x200.png', imageHint: 'indie band', attendanceCount: 150, price: 15,
    attendees: [
      { id: 'c1', avatarUrl: 'https://placehold.co/32x32.png?text=G', name: 'User G' },
      { id: 'c2', avatarUrl: 'https://placehold.co/32x32.png?text=H', name: 'User H' },
    ]
  },
  { id: '6', title: 'Startup Pitch Battle', description: 'Watch startups compete.', date: '2024-09-10', time: '09:00', location: 'UPJ Auditorium', category: 'Tech', imageUrl: 'https://placehold.co/300x200.png', imageHint: 'startup pitch', attendanceCount: 250, price: 25,
    attendees: [
      { id: 'd1', avatarUrl: 'https://placehold.co/32x32.png?text=I', name: 'User I' },
      { id: 'd2', avatarUrl: 'https://placehold.co/32x32.png?text=J', name: 'User J' },
      { id: 'd3', avatarUrl: 'https://placehold.co/32x32.png?text=K', name: 'User K' },
    ]
  },
  {
    id: '7',
    title: 'Weekend Food Bazaar',
    description: 'Explore diverse culinary delights at our weekend food bazaar. Many stalls to choose from!',
    date: '2024-09-21',
    time: '11:00',
    location: 'City Park Bintaro',
    category: 'Food',
    imageUrl: 'https://placehold.co/300x200.png',
    imageHint: 'food bazaar',
    attendanceCount: 180,
    price: 5,
    attendees: [
      { id: 'e1', avatarUrl: 'https://placehold.co/32x32.png?text=L', name: 'User L' },
      { id: 'e2', avatarUrl: 'https://placehold.co/32x32.png?text=M', name: 'User M' },
    ]
  },
  {
    id: '8',
    title: 'Intro to Coding Workshop',
    description: 'Learn the basics of coding in this interactive workshop. No prior experience needed.',
    date: '2024-10-05',
    time: '10:00',
    location: 'Community Hub UPJ',
    category: 'Tech',
    imageUrl: 'https://placehold.co/100x100.png',
    imageHint: 'coding workshop',
    attendanceCount: 75,
    price: 0
  },
  {
    id: '9',
    title: 'Jazz Night Serenade',
    description: 'Relax with smooth jazz tunes under the stars.',
    date: '2024-11-12',
    time: '19:30',
    location: 'Rooftop Lounge Bintaro',
    category: 'Music',
    imageUrl: 'https://placehold.co/300x200.png',
    imageHint: 'jazz music',
    attendanceCount: 120,
    price: 75,
    attendees: [
        { id: 'f1', avatarUrl: 'https://placehold.co/32x32.png?text=N', name: 'User N' },
        { id: 'f2', avatarUrl: 'https://placehold.co/32x32.png?text=O', name: 'User O' },
    ]
  },
  {
    id: '10',
    title: 'Street Food Fiesta',
    description: 'A vibrant gathering of street food vendors.',
    date: '2024-10-25',
    time: '16:00',
    location: 'Bintaro Town Square',
    category: 'Food',
    imageUrl: 'https://placehold.co/300x200.png',
    imageHint: 'street food',
    attendanceCount: 300,
    price: 0,
    attendees: [
        { id: 'g1', avatarUrl: 'https://placehold.co/32x32.png?text=P', name: 'User P' },
        { id: 'g2', avatarUrl: 'https://placehold.co/32x32.png?text=Q', name: 'User Q' },
        { id: 'g3', avatarUrl: 'https://placehold.co/32x32.png?text=R', name: 'User R' },
    ]
  },
  {
    id: '11',
    title: 'Morning Run Club',
    description: 'Join us for a refreshing morning run.',
    date: '2024-08-20',
    time: '06:00',
    location: 'UPJ jogging track',
    category: 'Sports',
    imageUrl: 'https://placehold.co/100x100.png',
    imageHint: 'running group',
    attendanceCount: 45,
    price: 0
  },
  {
    id: '12',
    title: 'Digital Art Workshop',
    description: 'Unleash your creativity with digital tools.',
    date: '2024-11-05',
    time: '13:00',
    location: 'Creative Lab UPJ',
    category: 'Tech',
    imageUrl: 'https://placehold.co/100x100.png',
    imageHint: 'digital art',
    attendanceCount: 60,
    price: 20
  }
];

let eventsData: Event[] = [...MOCK_EVENTS_INITIAL];
const subscribers: Set<() => void> = new Set();

export const eventStore = {
  getEvents: (): Event[] => {
    return [...eventsData]; // Return a copy
  },
  addEvent: (newEvent: Event): void => {
    eventsData = [newEvent, ...eventsData]; // Add new event to the beginning
    subscribers.forEach(callback => callback());
  },
  subscribe: (callback: () => void): (() => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback); // Unsubscribe function
  },
};
