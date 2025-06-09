
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap, type Icon as LeafletIconType } from 'leaflet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';
import { Loader2 } from 'lucide-react';

export interface MapPageEvent extends Pick<Event, 'id' | 'title' | 'category' | 'location'> {
  latitude: number;
  longitude: number;
}

const getCategoryIcon = (category?: string): LeafletIconType => {
  let color = '#757575'; // Default grey
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

if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41] as [number, number],
    iconAnchor: [12, 41] as [number, number],
    popupAnchor: [1, -34] as [number, number],
    shadowSize: [41, 41] as [number, number]
  });
}

interface EventMapProps {
  events: MapPageEvent[];
  initialPosition?: [number, number];
  initialZoom?: number;
}

let mapInstanceIdCounter = 0;

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // (B) Use a unique ID for the DOM element, stable for this component instance.
  const [mapDomId] = useState(() => `leaflet-map-instance-${mapInstanceIdCounter++}`);

  useEffect(() => {
    setIsClient(true); // Enable client-side rendering

    // (E) On component "dismount" destroy things
    return () => {
      if (mapRef.current) {
        // console.log(`Cleaning up map: ${mapDomId}`);
        mapRef.current.off(); // Remove all event listeners from the map instance
        mapRef.current.remove(); // Destroy the map instance and clear its related DOM elements
        mapRef.current = null; // Clear our reference
      }
    };
  }, [mapDomId]); // mapDomId is stable per instance, so this effect runs on mount/unmount

  if (!isClient) {
    return (
      <div style={{ height: '100%', width: '100%' }} className="flex justify-center items-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MapContainer
      // (B) Use the unique mapDomId as the React key AND the DOM id
      key={mapDomId} 
      id={mapDomId}   
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(mapInstance) => {
        // console.log(`Map created: ${mapDomId}`, mapInstance);
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
              {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
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
  );
}

const EventMap = memo(EventMapComponent);
EventMap.displayName = 'EventMap';

export default EventMap;
