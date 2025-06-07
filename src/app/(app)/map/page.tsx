
'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { MapPageEvent } from '@/components/map/EventMap'; // Import the specific type

// Mock event data with coordinates (similar to your previous setup)
const MOCK_MAP_EVENTS_DATA: MapPageEvent[] = [
  { id: '1', title: 'UPJ Concert', category: 'Music', location: 'Universitas Pembangunan Jaya', latitude: -6.3014, longitude: 106.6953 },
  { id: '2', title: 'Forkalympics', category: 'Sports', location: 'Lapangan Bola UPJ', latitude: -6.3000, longitude: 106.6965 },
  { id: '3', title: 'Malam Minggu Concert', category: 'Music', location: 'Bintaro Jaya Xchange Mall', latitude: -6.2876, longitude: 106.7064 },
  { id: '4', title: 'AI Showtime (Exhibition)', category: 'Tech', location: 'Aula UPJ (Exhibition)', latitude: -6.3020, longitude: 106.6948 },
  { id: '5', title: 'Local Indie Night', category: 'Music', location: 'Kafe Kopi Senja, Sektor 7', latitude: -6.2932, longitude: 106.7011 },
  { id: '6', title: 'Startup Pitch Battle', category: 'Tech', location: 'UPJ Auditorium', latitude: -6.3008, longitude: 106.6958 },
  { id: '7', title: 'Weekend Food Bazaar', category: 'Food', location: 'Taman Menteng Bintaro', latitude: -6.2960, longitude: 106.7080 },
];

const EventMapWithNoSSR = dynamic(() => import('@/components/map/EventMap'), {
  ssr: false, // Ensure component is only rendered on the client
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  const eventsForMap = MOCK_MAP_EVENTS_DATA;

  return (
    // This outer div should fill the available height provided by AppLayout's <main>
    // The h-full class needs a parent with a defined height.
    // AppLayout's <main> is flex-grow, which is good.
    // We'll ensure this div also tries to take full height.
    <div className="flex flex-col h-full w-full">
      {/* The map container itself will grow to fill the remaining space */}
      <div className="flex-grow"> {/* This div needs to expand */}
        <EventMapWithNoSSR events={eventsForMap} />
      </div>
    </div>
  );
}
