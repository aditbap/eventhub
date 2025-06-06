
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

// @ts-ignore Default Leaflet icon path fix
delete L.Icon.Default.prototype._getIconUrl;
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

let eventMapInstanceCounter = 0; 

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [mapContainerKey] = useState(() => {
    eventMapInstanceCounter++;
    const key = `map-instance-key-${eventMapInstanceCounter}-${Date.now()}`;
    console.log(`[EventMapComponent constructor-like] Generated mapContainerKey: ${key}`);
    return key;
  });

  useEffect(() => {
    console.log(`[EventMapComponent key: ${mapContainerKey}] useEffect: Running. Setting isMounted = true.`);
    setIsMounted(true); // Enable rendering of MapContainer

    // Cleanup function for this specific EventMapComponent instance
    return () => {
      console.log(`[EventMapComponent key: ${mapContainerKey}] useEffect cleanup: Running. Current mapRef ID: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
      if (mapRef.current) {
        const mapIdToRemove = (mapRef.current as any)._leaflet_id;
        console.log(`[EventMapComponent key: ${mapContainerKey}]   Removing map instance ID: ${mapIdToRemove}`);
        mapRef.current.remove();
        mapRef.current = null;
        console.log(`[EventMapComponent key: ${mapContainerKey}]   Map instance ID ${mapIdToRemove} removed and ref nulled.`);
      } else {
        console.log(`[EventMapComponent key: ${mapContainerKey}]   Cleanup: mapRef.current was already null. No map to remove.`);
      }
      // setIsMounted(false); // This component instance is unmounting, so its state doesn't matter for itself.
    };
  }, [mapContainerKey]); // mapContainerKey is stable for THIS instance, so effect runs once on mount, cleanup on unmount.

  if (!isMounted) {
    console.log(`[EventMapComponent key: ${mapContainerKey}] Render: isMounted is false. Returning null (or placeholder).`);
    return null; // Or a loading spinner, but MapPage's dynamic import already has a loader
  }

  console.log(`[EventMapComponent key: ${mapContainerKey}] Render: isMounted is true. Rendering <MapContainer>.`);
  return (
    <MapContainer
      key={mapContainerKey} // CRUCIAL: Forces React to create new DOM & MapContainer instance if EventMapComponent is remounted
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(mapInstance) => {
        const mapId = (mapInstance as any)._leaflet_id;
        console.log(`[MapContainer for key: ${mapContainerKey}] whenCreated: Leaflet map instance ID: ${mapId}. Assigning to mapRef.`);
        // Only assign if mapRef is not already pointing to this exact instance (though key should prevent this)
        if (mapRef.current !== mapInstance) {
             mapRef.current = mapInstance;
        }
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <Marker
          key={event.id} // Use event.id for marker key
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
