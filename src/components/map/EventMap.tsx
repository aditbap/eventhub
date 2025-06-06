
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

let eventMapComponentInstanceCounter = 0; // For debugging component instances

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  const instanceId = useRef(eventMapComponentInstanceCounter++).current; // Stable ID for this instance
  const mapRef = useRef<LeafletMap | null>(null);
  
  // Key for MapContainer. This will be new if EventMapComponent is remounted (e.g. by StrictMode).
  const [mapContainerKey] = useState(() => `map-container-key-${instanceId}-${Date.now()}`);

  useEffect(() => {
    console.log(`[EMC #${instanceId} key:${mapContainerKey}] Effect setup. mapRef current: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
    
    // Capture the map instance that this effect is responsible for cleaning up.
    // This is important because mapRef.current might be updated by a new render's whenCreated
    // (due to StrictMode remount) before this old effect's cleanup function runs.
    const mapInstanceForThisEffectRun = mapRef.current;

    return () => {
      console.log(`[EMC #${instanceId} key:${mapContainerKey}] Effect CLEANUP. Trying to remove map: ${mapInstanceForThisEffectRun ? (mapInstanceForThisEffectRun as any)._leaflet_id : 'null'}. Current mapRef: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
      if (mapInstanceForThisEffectRun) {
        mapInstanceForThisEffectRun.remove();
      }
      // If the map being cleaned up is the one currently in the ref for *this instance*, nullify it.
      // This check is to be absolutely sure we're not nullifying a ref that might have been
      // repopulated by a new map instance if cleanup timing is tricky with StrictMode.
      if (mapRef.current === mapInstanceForThisEffectRun) {
        mapRef.current = null;
      }
    };
  // The dependencies ensure this effect and its cleanup are correctly scoped to this component instance and its MapContainer key.
  // It runs once when the component instance (defined by instanceId and its mapContainerKey) mounts.
  }, [mapContainerKey, instanceId]); 

  console.log(`[EMC #${instanceId} key:${mapContainerKey}] RENDERING. mapRef current: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
  
  return (
    <MapContainer
      key={mapContainerKey} // Crucial: forces React to create a new DOM element & component instance if key changes
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(map) => {
        // This is called when Leaflet initializes the map for the MapContainer with `mapContainerKey`
        console.log(`[EMC #${instanceId} key:${mapContainerKey}] MapContainer WHENCREATED. New map ID: ${(map as any)._leaflet_id}. Setting mapRef.current.`);
        mapRef.current = map;
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
