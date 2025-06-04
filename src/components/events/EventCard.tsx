'use client';

import type { Event } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card'; // Removed CardFooter, CardHeader, CardTitle for custom layout
import { Button } from '@/components/ui/button';
import { MapPinIcon, Bookmark, CalendarDays } from 'lucide-react'; // Using Bookmark for filled version
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  variant?: 'upcoming' | 'nearYou';
}

export function EventCard({ event, variant = 'upcoming' }: EventCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(event.isBookmarked || false);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // API call to update bookmark status
  };
  
  const formatDate = (dateString: string, format: 'short' | 'overlay') => {
    const date = new Date(dateString);
    if (format === 'overlay') {
      const day = date.toLocaleDateString('en-US', { day: 'numeric' });
      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      return { day, month };
    }
    // 'short' format: 1ST JUNE - SAT -2:00 PM
    const day = date.toLocaleDateString('en-US', { day: 'numeric' });
    const suffix = (d: number) => {
      if (d > 3 && d < 21) return 'TH';
      switch (d % 10) {
        case 1:  return "ST";
        case 2:  return "ND";
        case 3:  return "RD";
        default: return "TH";
      }
    };
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return `${day}${suffix(parseInt(day))} ${month} - ${weekday} ${event.time ? `- ${event.time}` : ''}`;
  };


  if (variant === 'upcoming') {
    const { day, month } = formatDate(event.date, 'overlay');
    return (
      <Link href={`/events/${event.id}`} className="block h-full">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full rounded-xl">
          <div className="relative aspect-[4/3] w-full"> {/* Adjusted aspect ratio */}
            <Image
              src={event.imageUrl}
              alt={event.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={event.imageHint || "event"}
              className="rounded-t-xl"
            />
            <div className="absolute top-3 left-3 bg-white/90 text-primary font-bold p-2.5 rounded-lg text-center leading-none shadow">
              <span className="block text-xl">{day}</span>
              <span className="block text-xs">{month}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleBookmark} 
              className="absolute top-3 right-3 h-9 w-9 bg-white/80 hover:bg-white rounded-lg shadow"
            >
              <Bookmark className={cn("h-5 w-5", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
            </Button>
          </div>
          <CardContent className="p-3 flex-grow flex flex-col justify-between">
            <div>
              <h3 className="text-md font-headline font-semibold mb-1.5 line-clamp-2 text-foreground">{event.title}</h3>
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center mb-1.5">
                  <div className="flex -space-x-2 mr-2">
                    {event.attendees.slice(0,3).map((attendee) => (
                      <Avatar key={attendee.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={attendee.avatarUrl} alt={attendee.name} data-ai-hint="profile attendee"/>
                        <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {event.attendanceCount && <span className="text-xs text-red-500 font-medium">+{event.attendanceCount - (event.attendees?.slice(0,3).length || 0)} Going</span>}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              <MapPinIcon className="h-3.5 w-3.5 mr-1 shrink-0" />
              <span>{event.location}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === 'nearYou') {
    return (
      <Link href={`/events/${event.id}`} className="block w-full">
        <Card className="flex overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full rounded-xl p-3 items-center">
          <div className="relative w-20 h-20 mr-4 flex-shrink-0">
            <Image
              src={event.imageUrl}
              alt={event.title}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
              data-ai-hint={event.imageHint || "event small"}
            />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs font-semibold text-primary mb-0.5 truncate">{formatDate(event.date, 'short')}</p>
            <h4 className="text-sm font-headline font-medium text-foreground mb-1 line-clamp-2">{event.title}</h4>
            <div className="text-xs text-muted-foreground flex items-center">
              <MapPinIcon className="h-3.5 w-3.5 mr-1 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleBookmark} 
            className="ml-2 h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-primary"
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked ? "fill-primary text-primary" : "")} />
          </Button>
        </Card>
      </Link>
    );
  }

  // Fallback for default (old styling or can be adapted)
  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <div className="p-0 relative">
          <div className="aspect-[16/9] w-full relative">
            <Image
              src={event.imageUrl}
              alt={event.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={event.imageHint || "event"}
            />
          </div>
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg font-headline mb-1 line-clamp-2">{event.title}</h3>
          {/* Other details */}
        </CardContent>
      </Card>
    </Link>
  );
}
