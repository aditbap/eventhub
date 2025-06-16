
'use client';

import type { Notification } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Bell, 
  CalendarClock, 
  CheckCircle, 
  ChevronRight, 
  Info, 
  MessageSquare, 
  Ticket as TicketIcon, 
  Users,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';

interface NotificationListItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void; // Optional action
}

const categoryIconMap: Record<Notification['category'], LucideIcon> = {
  event_registration: TicketIcon,
  event_reminder: CalendarClock,
  announcement: Bell,
  social: Users,
};

const categoryColorMap: Record<Notification['category'], string> = {
  event_registration: 'text-green-500',
  event_reminder: 'text-blue-500',
  announcement: 'text-indigo-500',
  social: 'text-purple-500',
};


const getIconByName = (name?: string): LucideIcon => {
  if (!name) return Info; // Default icon
  switch (name.toLowerCase()) {
    case 'ticket': return TicketIcon;
    case 'calendarclock': return CalendarClock;
    case 'bell': return Bell;
    case 'users': return Users;
    case 'checkcircle': return CheckCircle;
    case 'alertcircle': return AlertCircle;
    case 'messagesquare': return MessageSquare;
    default: return Info;
  }
};


export function NotificationListItem({ notification, onMarkAsRead }: NotificationListItemProps) {
  const IconToRender = notification.icon ? getIconByName(notification.icon) : categoryIconMap[notification.category] || Info;
  const iconColor = categoryColorMap[notification.category] || 'text-muted-foreground';
  const formattedTimestamp = notification.timestamp ? formatDistanceToNowStrict(new Date(notification.timestamp), { addSuffix: true }) : '';

  const content = (
    <Card 
      className={cn(
        "flex items-start p-3 sm:p-4 space-x-3 hover:shadow-md transition-shadow duration-200 rounded-xl cursor-pointer",
        notification.isRead ? "bg-card/70 opacity-70" : "bg-card"
      )}
      onClick={() => {
        if (onMarkAsRead && !notification.isRead) {
          onMarkAsRead(notification.id);
        }
        // Navigation will be handled by Link if present
      }}
    >
      <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", 
        notification.isRead ? "bg-muted/50" : "bg-muted"
      )}>
        {notification.relatedEventImageUrl ? (
          <Image
            src={notification.relatedEventImageUrl}
            alt={notification.relatedEventName || notification.title}
            width={40}
            height={40}
            objectFit="cover"
            className="rounded-md"
            data-ai-hint={notification.relatedEventImageHint || "notification event"}
          />
        ) : (
          <IconToRender className={cn("h-5 w-5", iconColor)} />
        )}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start">
          <h3 className={cn(
            "text-sm font-semibold text-foreground mb-0.5 line-clamp-2",
            notification.isRead && "font-normal"
          )}>
            {notification.title}
          </h3>
          {!notification.isRead && (
            <div className="h-2.5 w-2.5 bg-primary rounded-full flex-shrink-0 ml-2 mt-1" aria-label="Unread"/>
          )}
        </div>
        <p className={cn(
          "text-xs text-muted-foreground line-clamp-2",
          notification.isRead && "text-muted-foreground/80"
        )}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">{formattedTimestamp}</p>
      </div>
      {notification.link && (
        <ChevronRight className="h-5 w-5 text-muted-foreground self-center flex-shrink-0" />
      )}
    </Card>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} passHref className="block">
        {content}
      </Link>
    );
  }

  return content;
}

