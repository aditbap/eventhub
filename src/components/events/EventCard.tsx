'use client';

import type { Event } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, UsersIcon, BookmarkIcon as BookmarkOutlineIcon, HeartIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact'; // For horizontal scroll vs vertical list
}

const categoryColors: { [key: string]: string } = {
  Music: 'bg-category-music text-white',
  Food: 'bg-category-food text-white',
  Sports: 'bg-category-sports text-white',
  Other: 'bg-gray-500 text-white',
};

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(event.isBookmarked || false);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if card itself is a link
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // Here you would typically call an API to update bookmark status
    console.log(`Event ${event.id} bookmark status: ${!isBookmarked}`);
  };
  
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (variant === 'compact') {
    return (
      <Link href={`/events/${event.id}`} className="block w-full">
        <Card className="flex overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
          <div className="relative w-1/3">
            <Image
              src={event.imageUrl}
              alt={event.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={event.imageHint || "event"}
            />
          </div>
          <div className="w-2/3 p-4 flex flex-col justify-between">
            <div>
              <Badge className={cn(categoryColors[event.category] || categoryColors['Other'], 'mb-1 text-xs')}>
                {event.category}
              </Badge>
              <CardTitle className="text-md font-headline leading-tight mb-1 line-clamp-2">{event.title}</CardTitle>
              <div className="text-xs text-muted-foreground flex items-center mb-1">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {formattedDate}{event.time ? `, ${event.time}` : ''}
              </div>
              <div className="text-xs text-muted-foreground flex items-center">
                <MapPinIcon className="h-3 w-3 mr-1" />
                {event.location}
              </div>
            </div>
             <Button variant="ghost" size="icon" onClick={toggleBookmark} className="absolute top-2 right-2 h-8 w-8 bg-white/70 hover:bg-white">
                <BookmarkOutlineIcon className={cn("h-4 w-4", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
             </Button>
          </div>
        </Card>
      </Link>
    );
  }


  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <CardHeader className="p-0 relative">
          <div className="aspect-[16/9] w-full relative">
            <Image
              src={event.imageUrl}
              alt={event.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={event.imageHint || "event"}
            />
          </div>
          <Badge className="absolute top-2 left-2 bg-background/80 text-foreground px-2 py-1 text-sm font-semibold">
            {formattedDate}
          </Badge>
           <Button variant="ghost" size="icon" onClick={toggleBookmark} className="absolute top-2 right-2 h-8 w-8 bg-white/70 hover:bg-white rounded-full">
              <BookmarkOutlineIcon className={cn("h-5 w-5", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
           </Button>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <Badge className={cn(categoryColors[event.category] || categoryColors['Other'], 'mb-2')}>
            {event.category}
          </Badge>
          <CardTitle className="text-lg font-headline mb-1 line-clamp-2">{event.title}</CardTitle>
          <div className="text-sm text-muted-foreground flex items-center mb-1">
            <MapPinIcon className="h-4 w-4 mr-1.5 shrink-0" />
            <span>{event.location}</span>
          </div>
          {event.attendanceCount !== undefined && (
            <div className="text-sm text-muted-foreground flex items-center">
              <UsersIcon className="h-4 w-4 mr-1.5 shrink-0" />
              <span>{event.attendanceCount} attending</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {/* Example interest icon */}
          <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm text-muted-foreground">Popular</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
