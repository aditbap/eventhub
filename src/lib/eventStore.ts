
import type { Event } from '@/types';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayForMock = new Date(); // Base for relative dates

const dateToday = new Date(todayForMock);

const dateIn2Days = new Date(todayForMock);
dateIn2Days.setDate(todayForMock.getDate() + 2);

const dateIn4Days = new Date(todayForMock);
dateIn4Days.setDate(todayForMock.getDate() + 4);

const dateIn6Days = new Date(todayForMock);
dateIn6Days.setDate(todayForMock.getDate() + 6);


// Initial mock events (moved from explore page and diversified)
const MOCK_EVENTS_INITIAL: Event[] = [
  {
    id: '1',
    title: 'UPJ Annual Music Fest',
    description: 'Join us for an unforgettable summer music festival featuring top artists and bands from various genres. Enjoy a variety of food stalls, interactive experiences, and art installations. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    date: '2024-08-15', // Kept as a future, non-immediate event
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
    date: '2024-09-05', // Kept as a future, non-immediate event
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
    date: '2024-09-22', // Kept as a future, non-immediate event
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
    date: '2024-10-10', // Kept as a future, non-immediate event
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
    date: '2024-08-28', // Kept as a future, non-immediate event
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
    date: '2024-11-02', // Kept as a future, non-immediate event
    time: '14:00',
    location: 'UPJ Indoor Sports Hall',
    category: 'Sports',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'basketball tournament sport',
    attendanceCount: 600, 
    price: 5,
    attendees: [ ],
    isBookmarked: true,
  },
  // --- NEW DUMMY EVENTS FOR UPCOMING/NEAR YOU ---
  {
    id: 'event-upcoming-near-1',
    title: 'Yoga by the Bintaro Lake',
    description: 'Start your day with a refreshing outdoor yoga session by the lake. All levels welcome. Bring your own mat.',
    date: formatDate(dateToday), // Today
    time: '07:00',
    location: 'Taman Bintaro Lakefront', // Matches "Bintaro" for Near You
    category: 'Sports',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'yoga lake morning',
    attendanceCount: 0,
    attendees: [],
    price: 0,
    isBookmarked: false,
  },
  {
    id: 'event-upcoming-2',
    title: 'Digital Art Workshop',
    description: 'Learn the basics of digital painting and illustration. Software and tablets provided. Limited spots!',
    date: formatDate(dateIn2Days), // In 2 days (for Upcoming)
    time: '13:00',
    location: 'Creative Hub Sektor 9',
    category: 'Tech',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'digital art tablet',
    attendanceCount: 0, // No attendees yet
    attendees: [],
    price: 15,
    isBookmarked: true,
  },
  {
    id: 'event-nearyou-upcoming-3',
    title: 'Bintaro Community Picnic',
    description: 'A fun community picnic at Bintaro Park. Bring your own food, games, and good vibes. Great for families.',
    date: formatDate(dateIn4Days), // In 4 days (for Upcoming)
    time: '11:00',
    location: 'Bintaro Central Park', // Matches "Bintaro" for Near You
    category: 'Food',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'picnic park food',
    attendanceCount: 0, // No attendees yet
    attendees: [],
    price: 0,
    isBookmarked: false,
  },
  {
    id: 'event-upcoming-4',
    title: 'Live Jazz Night',
    description: 'Enjoy smooth jazz tunes from a local band. Cozy atmosphere and great drinks.',
    date: formatDate(dateIn6Days), // In 6 days (for Upcoming)
    time: '20:00',
    location: 'The Groove Cafe',
    category: 'Music',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'jazz band cafe',
    attendanceCount: 0, // No attendees, will show in upcoming
    attendees: [],
    price: 10,
    isBookmarked: false,
  },
  {
    id: 'event-past-near-you-test',
    title: 'Historical Bintaro Walking Tour (PAST)',
    description: 'Explore the history of Bintaro with a guided walking tour. This event is in the past to test filtering.',
    date: '2023-01-15', // Past date
    time: '09:00',
    location: 'Bintaro Old Town Square', // Matches "Bintaro"
    category: 'Other',
    imageUrl: 'https://placehold.co/1200x600.png',
    imageHint: 'history old building',
    attendanceCount: 0,
    attendees: [],
    price: 5,
    isBookmarked: false,
  }
];

let eventsData: Event[] = [...MOCK_EVENTS_INITIAL];
const subscribers: Set<() => void> = new Set();

export const eventStore = {
  getEvents: (): Event[] => {
    // Sort by date descending (newest first) initially
    return [...eventsData].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  addEvent: (newEvent: Event): void => {
    // Ensure unique ID for new events, simple increment for mock
    const maxId = eventsData.reduce((max, event) => {
        const numericId = parseInt(event.id.replace(/\D/g, ''), 10); // Extract numbers from ID
        return numericId > max ? numericId : max;
    }, 0);
    
    // Check if newEvent.id is already a string like 'event-upcoming-1' or numeric.
    // This simple ID generation is mostly for events created via UI.
    if (!newEvent.id.includes('-')) { // If it's purely numeric or Date.now() string
        const newNumericId = (parseInt(newEvent.id, 10) > maxId) ? newEvent.id : (maxId + 1).toString();
        newEvent.id = newNumericId;
    }
    // For IDs like 'event-new-xyz', this doesn't try to make them numeric.

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

