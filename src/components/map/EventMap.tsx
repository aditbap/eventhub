
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap, type Icon as LeafletIconType } from 'leaflet';
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
  // Create a unique key for this specific component instance's MapContainer.
  // This ensures that if EventMapComponent is remounted (e.g., by StrictMode),
  // the MapContainer gets a new key, forcing React to create a new DOM element for it.
  const [mapContainerKey] = useState(() => `map-container-${globalInstanceCounter++}-${Date.now()}`);
  const [clientRenderComplete, setClientRenderComplete] = useState(false);

  console.log(`EventMapComponent (${mapContainerKey}): Instance created/rendered. clientRenderComplete: ${clientRenderComplete}`);

  useEffect(() => {
    console.log(`EventMapComponent (${mapContainerKey}): useEffect[] mount. Initializing timeout to set clientRenderComplete.`);
    
    // Defer setting clientRenderComplete to true. This helps ensure that any cleanup
    // from a previous instance (especially in StrictMode) has a chance to complete.
    const timerId = setTimeout(() => {
      console.log(`EventMapComponent (${mapContainerKey}): Timeout finished. Setting clientRenderComplete = true.`);
      setClientRenderComplete(true);
    }, 0); // A 0ms timeout defers execution to the next event loop cycle. Increase if problems persist (e.g., to 50).

    // This cleanup function runs when THIS SPECIFIC EventMapComponent instance unmounts.
    return () => {
      console.log(`EventMapComponent (${mapContainerKey}): useEffect[] cleanup. Clearing timeout. Attempting to remove map instance: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
      clearTimeout(timerId); // Clear the timeout if the component unmounts before it fires.
      if (mapRef.current) {
        mapRef.current.remove(); // Remove the Leaflet map instance.
        mapRef.current = null;   // Nullify the ref.
        console.log(`EventMapComponent (${mapContainerKey}): Map instance removed and ref set to null.`);
      } else {
        console.log(`EventMapComponent (${mapContainerKey}): No map instance in ref to remove during cleanup.`);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup once on unmount FOR THIS INSTANCE.

  if (!clientRenderComplete) {
    console.log(`EventMapComponent (${mapContainerKey}): clientRenderComplete is false. Returning null (placeholder or loading state).`);
    // While clientRenderComplete is false, return null or a loading indicator.
    // The dynamic import's loading prop in MapPage.tsx will handle the visual loading state.
    return null; 
  }

  console.log(`EventMapComponent (${mapContainerKey}): clientRenderComplete is true. Rendering MapContainer. mapRef.current before MapContainer render: ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
  return (
    <MapContainer
      key={mapContainerKey} // This key is critical. If EventMapComponent remounts (e.g. by StrictMode), this new key forces a new DOM element & MapContainer instance.
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-md z-0"
      whenCreated={(mapInstance) => {
        const newMapId = (mapInstance as any)._leaflet_id;
        // This callback is for the MapContainer instance associated with the current mapContainerKey.
        console.log(`EventMapComponent (${mapContainerKey}): MapContainer (key: ${mapContainerKey}) 'whenCreated' callback. New Map ID: ${newMapId}. Current mapRef (before assignment): ${mapRef.current ? (mapRef.current as any)._leaflet_id : 'null'}`);
        mapRef.current = mapInstance;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <Marker
          key={event.id} // Use event.id for marker key (stable across renders for the same event)
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
