
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

let globalInstanceCounter = 0; // Module-level counter for unique IDs

function EventMapComponent({ events, initialPosition = [-6.2971, 106.7000], initialZoom = 13 }: EventMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  
  // Unique key for this specific component instance's MapContainer.
  // This ensures that if EventMapComponent is remounted (e.g., by StrictMode),
  // the MapContainer gets a new key, forcing React to create a new DOM element for it.
  const [mapContainerKey] = useState(() => {
    const newKey = `map-container-${globalInstanceCounter++}-${Date.now()}`;
    console.log(`EventMapComponent: Instance created. mapContainerKey: ${newKey}`);
    return newKey;
  });

  // State to delay rendering MapContainer until after this component instance's first "true" effect runs.
  const [clientRenderComplete, setClientRenderComplete] = useState(false);

  useEffect(() => {
    // This effect runs once after the component instance has truly mounted on the client.
    console.log(`EventMapComponent (${mapContainerKey}): useEffect[] mount. Setting clientRenderComplete = true.`);
    setClientRenderComplete(true);

    // This cleanup function runs when this *specific instance* of EventMapComponent unmounts.
    return () => {
      console.log(`EventMapComponent (${mapContainerKey}): useEffect[] cleanup. mapRef.current: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
      if (mapRef.current) {
        const mapId = (mapRef.current as any)._leaflet_id;
        console.log(`EventMapComponent (${mapContainerKey}): Removing map instance ${mapId}`);
        mapRef.current.remove();
        mapRef.current = null; // Clear the ref
      } else {
        console.log(`EventMapComponent (${mapContainerKey}): No map instance to remove in cleanup.`);
      }
    };
  }, []); // Empty dependency array: effect runs once on mount, cleanup once on unmount for this instance.

  if (!clientRenderComplete) {
    console.log(`EventMapComponent (${mapContainerKey}): Initial render phase, clientRenderComplete is false. Returning null.`);
    return null; 
  }

  console.log(`EventMapComponent (${mapContainerKey}): clientRenderComplete is true. Rendering MapContainer. mapRef.current before MapContainer render: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
  return (
    <MapContainer
      key={mapContainerKey} // This key is critical. If EventMapComponent remounts, this new key forces a new DOM element.
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(mapInstance) => {
        const newMapId = (mapInstance as any)._leaflet_id;
        console.log(`EventMapComponent (${mapContainerKey}): MapContainer (key: ${mapContainerKey}) 'whenCreated' callback. New Map ID: ${newMapId}. Current mapRef: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
        
        // If mapRef.current already exists from a previous render of *this same instance* (which shouldn't happen with this logic),
        // or if it somehow points to an old map, clear it.
        // However, the primary defense is the key forcing a new MapContainer and the useEffect cleanup removing the old instance.
        if (mapRef.current && mapRef.current !== mapInstance) {
             console.warn(`EventMapComponent (${mapContainerKey}): 'whenCreated' - mapRef.current was already set to a different map instance (${(mapRef.current as any)._leaflet_id}). This is unexpected. Overwriting.`);
        }
        mapRef.current = mapInstance;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <Marker
          key={event.id} // Use event.id for marker key (stable)
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
