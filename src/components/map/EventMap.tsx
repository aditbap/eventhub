
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

// Module-level counter to help ensure unique keys across HMR or other scenarios if needed, though Date.now + random should suffice.
let eventMapInstanceCounter = 0;

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  // Generate a unique key for the MapContainer for each instance of EventMapComponent.
  // This is crucial for React StrictMode, which remounts components to detect issues.
  // A new key forces React to create a new DOM element for MapContainer.
  const [mapContainerKey] = useState(() => {
    eventMapInstanceCounter++;
    const key = `map-container-instance-${eventMapInstanceCounter}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[EventMapComponent INSTANCE CREATED] Generated mapContainerKey: ${key}`);
    return key;
  });

  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    // This effect is tied to the lifecycle of this EventMapComponent instance
    // (and its specific mapContainerKey).
    console.log(`[EventMapComponent key: ${mapContainerKey}] Effect: Setup. Current map in ref: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);

    // The cleanup function will run when this EventMapComponent instance unmounts.
    return () => {
      console.log(`[EventMapComponent key: ${mapContainerKey}] Effect: Cleanup. Attempting to remove map. Current map in ref: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
      if (mapRef.current) {
        const mapIdToRemove = (mapRef.current as any)._leaflet_id;
        console.log(`[EventMapComponent key: ${mapContainerKey}] Effect: Removing Leaflet map instance ID: ${mapIdToRemove}`);
        mapRef.current.remove();
        mapRef.current = null; // Important: clear the ref
        console.log(`[EventMapComponent key: ${mapContainerKey}] Effect: Leaflet map instance ID: ${mapIdToRemove} removed and ref nulled.`);
      } else {
        console.log(`[EventMapComponent key: ${mapContainerKey}] Effect: Cleanup - mapRef.current was already null. No map to remove.`);
      }
    };
  }, [mapContainerKey]); // mapContainerKey is stable for the lifetime of this component instance.

  console.log(`[EventMapComponent key: ${mapContainerKey}] Rendering. Map ref is currently: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);

  return (
    <MapContainer
      key={mapContainerKey} // This key forces a new DOM element if EventMapComponent remounts.
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(mapInstance) => {
        // This callback is from react-leaflet when the Leaflet map is internally ready.
        const mapId = (mapInstance as any)._leaflet_id;
        console.log(`[MapContainer key: ${mapContainerKey}] whenCreated: Leaflet map instance ID: ${mapId} created.`);
        
        // Defensive check: if mapRef.current is already set and it's a different map instance,
        // it implies whenCreated might have been called multiple times for the same MapContainer key,
        // or a logic error. This should ideally not happen with a stable key per EventMapComponent instance.
        if (mapRef.current && mapRef.current !== mapInstance) {
            console.warn(`[MapContainer key: ${mapContainerKey}] whenCreated: mapRef.current was already set to a different map instance (ID: ${(mapRef.current as any)._leaflet_id}). Overwriting with new instance (ID: ${mapId}). This is unusual.`);
            // mapRef.current.remove(); // Consider if the old one needs explicit removal here, though useEffect cleanup should handle its own.
        }
        
        mapRef.current = mapInstance;
        console.log(`[MapContainer key: ${mapContainerKey}] whenCreated: mapRef.current has been set to Leaflet map instance ID: ${mapId}.`);
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
