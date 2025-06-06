
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap } from 'leaflet';
import type { Icon as LeafletIconType } from 'leaflet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';

const getCategoryIcon = (category?: string): LeafletIconType => {
  let color = '#757575'; 
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
  const mapRef = useRef<LeafletMap | null>(null);
  const [clientSideReady, setClientSideReady] = useState(false);
  const [containerKey, setContainerKey] = useState(0); // Key for MapContainer

  useEffect(() => {
    console.log("EventMapComponent: Mount effect executing.");
    setClientSideReady(true);
    setContainerKey(prevKey => {
      const newKey = prevKey + 1;
      console.log(`EventMapComponent: Setting new containerKey: ${newKey}`);
      return newKey;
    });

    return () => {
      console.log("EventMapComponent: Unmount cleanup executing.");
      if (mapRef.current) {
        const mapId = (mapRef.current as any)._leaflet_id; // Access internal ID for logging
        console.log(`Attempting to remove map instance ID: ${mapId}`);
        try {
          mapRef.current.remove();
          console.log(`Map instance (ID: ${mapId}) remove() called successfully.`);
        } catch (e) {
          console.error(`Error calling map.remove() for map ID ${mapId}:`, e);
        }
        mapRef.current = null; 
        console.log("mapRef.current set to null after removal attempt.");
      } else {
        console.log("EventMapComponent Unmount: mapRef.current was already null or not set.");
      }
    };
  }, []); 

  if (!clientSideReady) {
    console.log("EventMapComponent: Not client-side ready yet, rendering null.");
    return null;
  }

  console.log(`EventMapComponent: Rendering MapContainer with key: ${containerKey}. Current mapRef ID: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
  return (
    <MapContainer
      key={containerKey} 
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(mapInstance) => {
        const newMapId = (mapInstance as any)._leaflet_id;
        if (mapRef.current) {
            const oldMapId = (mapRef.current as any)._leaflet_id;
            console.warn(
              `MapContainer whenCreated (key: ${containerKey}): mapRef.current (ID: ${oldMapId}) was unexpectedly already set. ` +
              `New mapInstance ID: ${newMapId}. This might indicate an issue. Removing old ref's map before assigning new one.`
            );
            // This scenario is less likely with the keying strategy but added for extreme robustness
            try {
              mapRef.current.remove();
            } catch (e) {
              console.error(`Error removing stale mapRef.current (ID: ${oldMapId}) in whenCreated:`, e);
            }
        }
        mapRef.current = mapInstance;
        console.log(`MapContainer whenCreated (key: ${containerKey}): map instance (ID: ${newMapId}) assigned to mapRef.current.`);
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

const EventMap = React.memo(EventMapComponent);

export default EventMap;
