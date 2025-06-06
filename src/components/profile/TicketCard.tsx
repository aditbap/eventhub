
'use client';

import type { Ticket } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const getDayWithSuffix = (day: number): string => {
  if (day > 3 && day < 21) return `${day}TH`;
  switch (day % 10) {
    case 1: return `${day}ST`;
    case 2: return `${day}ND`;
    case 3: return `${day}RD`;
    default: return `${day}TH`;
  }
};

const formatEventDateTime = (dateStr: string, timeStr?: string): string => {
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) { // Check if dateStr is valid
        return "Date N/A";
    }
    
    const day = dateObj.getUTCDate(); // Use UTC methods to avoid timezone issues if dateStr is YYYY-MM-DD
    const month = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
    
    let formattedTime = '';
    if (timeStr) {
      // Assuming timeStr is like "18:00"
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const d = new Date();
        d.setHours(h, m);
        formattedTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', ''); // e.g., 4PM, 10AM
      } else {
        formattedTime = timeStr; // Fallback to original time string if parsing fails
      }
    }

    return `${getDayWithSuffix(day)} ${month} - ${weekday}${formattedTime ? ` - ${formattedTime}` : ''}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Date/Time N/A";
  }
};


export function TicketCard({ ticket }: { ticket: Ticket }) {
  const formattedDateTime = formatEventDateTime(ticket.eventDate, ticket.eventTime);
  const imageUrl = ticket.eventImageUrl || `https://placehold.co/100x100.png?text=${ticket.eventName.charAt(0)}`;
  const imageHint = ticket.eventImageHint || "event";

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow rounded-xl bg-card">
      <CardContent className="p-3 flex items-center space-x-3">
        <div className="relative w-20 h-20 flex-shrink-0">
          <Image 
            src={imageUrl} 
            alt={ticket.eventName} 
            layout="fill" 
            objectFit="cover" 
            className="rounded-lg"
            data-ai-hint={imageHint}
          />
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-xs font-semibold text-primary mb-0.5 truncate">
            {formattedDateTime}
          </p>
          <h3 className="text-base font-headline font-semibold text-foreground mb-1 line-clamp-2">
            {ticket.eventName}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            <span className="truncate">{ticket.eventLocation}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
