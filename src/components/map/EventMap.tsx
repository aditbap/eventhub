
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap } from 'leaflet';
import type { Icon as LeafletIconType } from 'leaflet'; // Corrected import type
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
    className: 'custom-leaflet-div-icon', // Ensure this class is used for styling if needed
    iconSize: [32, 32],
    iconAnchor: [16, 32], // Anchor point of the icon (bottom center)
    popupAnchor: [0, -32], // Anchor point for popups relative to iconAnchor
  });
};

// @ts-ignore Default Leaflet icon path fix (common workaround)
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

// Counter to help generate unique DOM IDs if multiple maps were on one page
let mapIdCounter = 0;

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  // Generate a unique ID for this map instance when the component mounts.
  // This ID is used for the key and id of MapContainer.
  // useState ensures this ID is stable for this component instance's lifetime
  // but will be new if EventMapComponent itself is unmounted and remounted.
  const [mapDomId] = useState(() => `leaflet-map-${mapIdCounter++}`);

  useEffect(() => {
    // This effect is now primarily for cleanup.
    // It captures the map instance associated with this component instance (and its mapDomId).
    console.log(`EventMapComponent Effect setup for mapDomId: ${mapDomId}`);
    
    const instanceToCleanUp = mapInstanceRef.current; // Capture the instance at the time of effect setup

    return () => {
      console.log(`EventMapComponent Cleanup for mapDomId: ${mapDomId}. Instance to clean up: ${instanceToCleanUp ? 'exists' : 'null'}`);
      if (instanceToCleanUp) {
        const leafletId = (instanceToCleanUp as any)._leaflet_id;
        console.log(`EventMapComponent Cleanup: Removing map instance ID: ${leafletId} associated with mapDomId: ${mapDomId}`);
        instanceToCleanUp.remove();
      }
      // If mapInstanceRef.current was this instance, it's now gone.
      // If a new instance quickly replaced it, mapInstanceRef.current would point to the new one,
      // but instanceToCleanUp would correctly point to the old one.
      if (mapInstanceRef.current === instanceToCleanUp) {
        mapInstanceRef.current = null;
      }
    };
  }, [mapDomId]); // The effect and its cleanup are tied to mapDomId.

  console.log(`EventMapComponent Render. MapContainer key/id: ${mapDomId}. Current mapInstanceRef: ${mapInstanceRef.current ? (mapInstanceRef.current as any)._leaflet_id : 'null'}`);
  
  return (
    <MapContainer
      key={mapDomId} // Crucial: Forces React to treat this as a new component if mapDomId changes
      id={mapDomId}   // Also set the DOM ID for Leaflet to target
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(map) => {
        // This callback is invoked when Leaflet initializes the map for this MapContainer instance.
        console.log(`MapContainer whenCreated for ID ${mapDomId}: New map instance (Leaflet ID: ${(map as any)._leaflet_id}). Setting mapInstanceRef.`);
        mapInstanceRef.current = map;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <Marker
          key={event.id} // Event ID is unique for markers within this map instance
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
