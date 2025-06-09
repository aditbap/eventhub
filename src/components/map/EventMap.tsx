
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap, type DivIcon } from 'leaflet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types'; // Ensure Event type is correctly imported if used here
import { Loader2 } from 'lucide-react';

export interface MapPageEvent extends Pick<Event, 'id' | 'title' | 'category' | 'location'> {
  latitude: number;
  longitude: number;
}

const getCategoryIcon = (category?: string): DivIcon => {
  let color = '#757575'; // Default grey
  let iconPath = 'M16 3C10.48 3 6 7.48 6 13c0 5.25 4.48 9.5 10 9.5s10-4.25 10-9.5C26 7.48 21.52 3 16 3zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S13.51 8.5 16 8.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z'; // Generic pin/dot

  switch (category) {
    case 'Music': color = '#F97068'; break; // Coral Red
    case 'Food': color = '#4CAF50'; break;  // Grass Green
    case 'Sports': color = '#FFA000'; break; // Amber Orange
    case 'Tech': color = '#3B82F6'; break; // Blue-500 (example for Tech)
    // 'Other' or undefined will use default grey
  }

  // Using a simpler filled circle as an SVG marker
  const svgIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" class="event-marker-svg">
    <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;

  return L.divIcon({
    html: svgIconHtml,
    className: 'custom-leaflet-div-icon', // Important for removing default Leaflet divIcon styles
    iconSize: [32, 32], // Size of the icon
    iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location (bottom center)
    popupAnchor: [0, -32], // Point from which the popup should open relative to the iconAnchor
  });
};

// Fix for default Leaflet icon paths when using bundlers
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface EventMapProps {
  events: MapPageEvent[];
  initialPosition?: [number, number];
  initialZoom?: number;
}

function EventMapComponent({
  events,
  initialPosition = [-6.2971, 106.7000], // Default to Bintaro/UPJ general area
  initialZoom = 13,
}: EventMapProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  // Generate a stable, unique key for this MapContainer instance.
  // This key only changes if EventMapComponent is completely unmounted and remounted.
  const [mapContainerReactKey] = useState(() =>
    `map-instance-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    setIsClient(true); // Set to true once component mounts on the client

    // Cleanup function: This will run when the EventMapComponent unmounts.
    return () => {
      if (mapRef.current) {
        mapRef.current.off(); // Remove all event listeners from the map instance
        mapRef.current.remove(); // Destroy the map instance and remove it from the DOM
        mapRef.current = null; // Clear our reference to the map instance
      }

      // Aggressive cleanup for Strict Mode / HMR:
      // Iterate over all DOM elements with the class 'leaflet-container'
      // (which Leaflet adds to map containers) and nullify the _leaflet_id property.
      // This tells Leaflet that these containers are no longer initialized.
      const containers = document.getElementsByClassName('leaflet-container');
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i] as HTMLElement & { _leaflet_id?: string | null };
        if (container._leaflet_id) {
          container._leaflet_id = null;
        }
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and its cleanup on unmount

  if (!isClient) {
    return (
      <div style={{ height: '100%', width: '100%' }} className="flex justify-center items-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        key={mapContainerReactKey} // Use the stable, unique React key
        // DO NOT provide an 'id' prop here; let react-leaflet manage the DOM element's ID.
        center={initialPosition}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-md z-0 leaflet-container" // Ensure leaflet-container class is present for cleanup
        whenCreated={(mapInstance) => {
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
                {event.location && (
                  <p className="text-xs text-muted-foreground">{event.location}</p>
                )}
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
    </div>
  );
}

const EventMap = memo(EventMapComponent);
EventMap.displayName = 'EventMap';

export default EventMap;
    