
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L, { type Map as LeafletMap, type DivIcon } from 'leaflet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';
import { Loader2 } from 'lucide-react';

// Import leaflet-defaulticon-compatibility
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

// Leaflet CSS (already present)
import 'leaflet/dist/leaflet.css';


export interface MapPageEvent extends Pick<Event, 'id' | 'title' | 'category' | 'location'> {
  latitude: number;
  longitude: number;
}

// Counter for unique map instance keys if multiple EventMapComponent instances exist simultaneously
// and are not differentiated by a parent-provided key.
let mapInstanceIdCounter = 0;

const getCategoryIcon = (category?: string): DivIcon => {
  let color = '#757575'; // Default grey
  // iconPath is not used with current SVG marker, but kept for reference if style changes
  // let iconPath = 'M16 3C10.48 3 6 7.48 6 13c0 5.25 4.48 9.5 10 9.5s10-4.25 10-9.5C26 7.48 21.52 3 16 3zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S13.51 8.5 16 8.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z';

  switch (category) {
    case 'Music': color = '#F97068'; break;
    case 'Food': color = '#4CAF50'; break;
    case 'Sports': color = '#FFA000'; break;
    case 'Tech': color = '#3B82F6'; break;
  }

  const svgIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" class="event-marker-svg">
    <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;

  return L.divIcon({
    html: svgIconHtml,
    className: 'custom-leaflet-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Removed manual L.Icon.Default.mergeOptions as leaflet-defaulticon-compatibility handles it.

interface EventMapProps {
  events: MapPageEvent[];
  initialPosition?: [number, number];
  initialZoom?: number;
}

function EventMapComponent({
  events,
  initialPosition = [-6.2971, 106.7000], // Default to Bintaro/UPJ general area
  initialZoom = 13,
}: EventMapProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  const primaryEventIdForKey = events[0]?.id;
  const [mapContainerReactKey] = useState(() =>
    `${primaryEventIdForKey || 'map'}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    setIsClient(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Safely remove all Leaflet internal IDs from containers
      // This is an aggressive cleanup for development scenarios like HMR or React Strict Mode
      const containers = document.getElementsByClassName('leaflet-container');
      for (let i = 0; i < containers.length; i++) {
        const el = containers[i] as HTMLElement & { _leaflet_id?: string | null };
        if (el._leaflet_id) {
          el._leaflet_id = null;
        }
      }
    };
  }, []); // Empty dependency array: runs on mount, cleans up on unmount.

  if (!isClient) {
    return (
      <div style={{ height: '100%', width: '100%' }} className="flex justify-center items-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        key={mapContainerReactKey} // Use the stable, unique React key
        // No 'id' prop here; let react-leaflet manage the DOM element's ID.
        center={initialPosition}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-md z-0 leaflet-container" // Ensure class for cleanup
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={getCategoryIcon(event.category)}
          >
            <Popup minWidth={220}>
              <div className="space-y-1.5 p-1">
                <h3 className="font-headline font-semibold text-md">{event.title}</h3>
                {event.location && (
                  <p className="text-xs text-muted-foreground">{event.location}</p>
                )}
                <Link href={`/events/${event.id}`} passHref>
                  <Button size="sm" className="w-full mt-2">
                    View Details
                  </Button>
                </Link>
              </div>
            </Popup>
            <Tooltip>{event.title}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

const EventMap = memo(EventMapComponent);
EventMap.displayName = 'EventMap';

export default EventMap;
