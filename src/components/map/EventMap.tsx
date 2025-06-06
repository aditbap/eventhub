
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap } from 'leaflet';
import type { Icon as LeafletIconType } from 'leaflet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';

const getCategoryIcon = (category?: string): LeafletIconType => {
  let color = '#757575'; // Default grey
  switch (category) {
    case 'Music': color = '#F97068'; break; // Coral Red
    case 'Food': color = '#4CAF50'; break;  // Grass Green
    case 'Sports': color = '#FFA000'; break; // Amber Orange
    case 'Tech': color = '#3B82F6'; break; // Blue-500 for Tech
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

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface MapPageEvent extends Pick<Event, 'id' | 'title' | 'category' | 'location'> {
  latitude: number;
  longitude: number;
}

interface EventMapProps {
  events: MapPageEvent[];
  initialPosition?: [number, number];
  initialZoom?: number;
}

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [clientSideReady, setClientSideReady] = useState(false);
  const [mapContainerKey, setMapContainerKey] = useState(() => Date.now()); // Unique key for MapContainer

  useEffect(() => {
    console.log(`EventMapComponent Effect (Mount/Remount): Current key to be used: ${mapContainerKey}`);
    setClientSideReady(true);
    
    // If EventMapComponent is remounted (e.g. StrictMode), generate a new key for MapContainer
    // This forces MapContainer to be a new instance with a new DOM node.
    setMapContainerKey(Date.now()); 

    // The cleanup function will be associated with THIS instance of EventMapComponent
    // and the map instance IT created (which should be in mapInstanceRef.current).
    return () => {
      console.log(`EventMapComponent Cleanup: mapInstanceRef.current ID is ${mapInstanceRef.current ? (mapInstanceRef.current as any)._leaflet_id : 'null'}`);
      if (mapInstanceRef.current) {
        const mapId = (mapInstanceRef.current as any)._leaflet_id;
        console.log(`EventMapComponent Cleanup: Attempting to remove map instance ID: ${mapId}`);
        try {
          mapInstanceRef.current.remove();
          console.log(`EventMapComponent Cleanup: Map instance (ID: ${mapId}) remove() called successfully.`);
        } catch (e) {
          console.error(`EventMapComponent Cleanup: Error calling map.remove() for map ID ${mapId}:`, e);
        }
        mapInstanceRef.current = null; // Clear the ref for this unmounted instance
      } else {
        console.log("EventMapComponent Cleanup: No map instance in mapInstanceRef to remove.");
      }
    };
  }, []); // Empty dependency array means this effect runs on mount and its cleanup on unmount.

  if (!clientSideReady) {
    console.log("EventMapComponent: Not client-side ready yet, rendering null.");
    return null;
  }

  console.log(`EventMapComponent: Rendering MapContainer with key: ${mapContainerKey}. Current mapInstanceRef ID: ${mapInstanceRef.current ? (mapInstanceRef.current as any)._leaflet_id : 'null'}`);
  
  return (
    <MapContainer
      key={mapContainerKey} // This key is crucial.
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(map) => {
        const newMapId = (map as any)._leaflet_id;
        console.log(`MapContainer whenCreated (key: ${mapContainerKey}): map instance (ID: ${newMapId}) created. Assigning to mapInstanceRef.`);
        // This component instance now owns this map instance.
        mapInstanceRef.current = map;
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
