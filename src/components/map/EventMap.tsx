
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

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [isMapReadyToRender, setIsMapReadyToRender] = useState(false);
  // A stable key for this instance of EventMapComponent, ensuring MapContainer gets a new key if EventMapComponent itself is remounted.
  const [mapContainerKey] = useState(() => `map-container-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  useEffect(() => {
    console.log(`[EventMap key: ${mapContainerKey}] Effect setup. Setting isMapReadyToRender to true.`);
    setIsMapReadyToRender(true);

    return () => {
      console.log(`[EventMap key: ${mapContainerKey}] Effect cleanup. Current map in ref: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
      if (mapRef.current) {
        console.log(`[EventMap key: ${mapContainerKey}] Removing map instance: ${(mapRef.current as any)._leaflet_id}`);
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Do not set isMapReadyToRender to false here as this cleanup also runs on actual unmount.
      // A new instance will start with isMapReadyToRender = false.
    };
  }, [mapContainerKey]); // mapContainerKey is stable for this component instance's lifetime.

  if (!isMapReadyToRender) {
    console.log(`[EventMap key: ${mapContainerKey}] Not rendering MapContainer (isMapReadyToRender is false).`);
    // The dynamic import's `loading` prop in MapPage will handle showing a loading indicator.
    return null;
  }

  console.log(`[EventMap key: ${mapContainerKey}] Rendering MapContainer. Current map in ref: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
  return (
    <MapContainer
      key={mapContainerKey} // Crucial: Forces React to create a new DOM element & MapContainer instance if key changes (i.e., EventMapComponent remounts)
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(mapInstance) => {
        console.log(`[MapContainer key: ${mapContainerKey}] whenCreated. New map ID: ${(mapInstance as any)._leaflet_id}.`);
        // Assign the newly created map instance to our ref.
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
