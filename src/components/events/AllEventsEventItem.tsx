
'use client';

import type { Event } from '@/types';
import Image from 'next/image';
import { MapPin, Bookmark } from 'lucide-react'; // Added Bookmark
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added Button
import { cn } from '@/lib/utils';
import { eventStore } from '@/lib/eventStore'; // Added eventStore

interface AllEventsEventItemProps {
  event: Event;
}

const formatEventDateTime = (dateStr: string, timeStr?: string): string => {
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return "Date N/A";

    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const month = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const dayOfMonth = dateObj.getUTCDate();

    let formattedTime = '';
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const d = new Date(0); 
        d.setUTCHours(h, m); 
        formattedTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).replace(' ', '');
      } else {
        formattedTime = timeStr;
      }
    }
    return `${day}, ${month} ${dayOfMonth} • ${formattedTime || 'Time TBD'}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Date/Time N/A";
  }
};

export function AllEventsEventItem({ event }: AllEventsEventItemProps) {
  const formattedDateTime = formatEventDateTime(event.date, event.time);
  const imageUrl = event.imageUrl || `https://placehold.co/80x80.png?text=${event.title.charAt(0)}`;
  const imageHint = event.imageHint || "event thumbnail";

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    eventStore.toggleEventBookmark(event.id);
  };

  return (
    <Card className="flex items-center p-3 space-x-3 hover:shadow-md transition-shadow duration-200 rounded-xl cursor-pointer bg-card">
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={imageUrl}
          alt={event.title}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
          data-ai-hint={imageHint}
        />
      </div>
      <div className="flex-grow min-w-0">
        <p className={cn(
            "text-xs font-semibold mb-0.5 truncate",
            new Date(event.date) < new Date() && !event.date.startsWith(new Date().toISOString().split('T')[0]) ? "text-muted-foreground" : "text-primary"
          )}>
          {formattedDateTime}
        </p>
        <h3 className="text-base font-headline font-semibold text-foreground mb-1 line-clamp-2">
          {event.title}
        </h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleBookmark}
        className="ml-2 h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-primary"
        aria-label={event.isBookmarked ? "Unbookmark event" : "Bookmark event"}
      >
        <Bookmark className={cn("h-5 w-5", event.isBookmarked ? "fill-primary text-primary" : "")} />
      </Button>
    </Card>
  );
}
