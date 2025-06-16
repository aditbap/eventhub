
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, BellOff, Loader2, CalendarClock, AlertTriangle, Ticket, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import type { Notification as NotificationType, Ticket as UserTicket } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { NotificationListItem } from '@/components/notifications/NotificationListItem';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { differenceInCalendarDays, isToday, isTomorrow, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';


interface ImminentEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  imageUrl?: string;
  imageHint?: string;
  relativeTime: string;
}

export default function NotificationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [imminentEvents, setImminentEvents] = useState<ImminentEvent[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const notifsRef = collection(db, 'userNotifications');
        const q = query(
          notifsRef,
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotifications = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          } as NotificationType;
        });
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
      } finally {
        setLoadingNotifications(false);
      }
    };

    const fetchImminentEventReminders = async () => {
      setLoadingReminders(true);
      try {
        const ticketsRef = collection(db, 'userTickets');
        const ticketsQuery = query(ticketsRef, where('userId', '==', user.uid));
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const userTickets: UserTicket[] = ticketsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserTicket));

        const today = new Date();
        today.setHours(0,0,0,0);

        const upcomingReminders: ImminentEvent[] = userTickets
          .map(ticket => {
            const eventDate = new Date(ticket.eventDate);
            if (isNaN(eventDate.getTime())) return null;

            const daysUntil = differenceInCalendarDays(eventDate, today);
            let relativeTime = '';

            if (daysUntil < 0) return null;

            if (isToday(eventDate)) {
              relativeTime = 'Today';
            } else if (isTomorrow(eventDate)) {
              relativeTime = 'Tomorrow';
            } else if (daysUntil <= 7) {
              relativeTime = `In ${daysUntil} day${daysUntil > 1 ? 's' : ''} (${format(eventDate, 'EEE, MMM d')})`;
            } else {
              return null;
            }

            return {
              id: ticket.eventId,
              title: ticket.eventName,
              date: ticket.eventDate,
              time: ticket.eventTime,
              location: ticket.eventLocation,
              imageUrl: ticket.eventImageUrl,
              imageHint: ticket.eventImageHint,
              relativeTime,
            };
          })
          .filter(Boolean) as ImminentEvent[];

        upcomingReminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setImminentEvents(upcomingReminders.slice(0, 3));

      } catch (error) {
        console.error("Error fetching ticket reminders:", error);
      } finally {
        setLoadingReminders(false);
      }
    };

    fetchNotifications();
    fetchImminentEventReminders();
  }, [user, authLoading, router, toast]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'userNotifications', notificationId);
      await updateDoc(notifRef, { isRead: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({ title: "Error", description: "Could not update notification status.", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) {
        toast({
            description: "No unread notifications to mark.",
        });
        return;
    }

    try {
      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        const notifRef = doc(db, 'userNotifications', n.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({
        title: "All Read!",
        description: "All notifications have been marked as read.",
        action: <CheckCheck className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({ title: "Error", description: "Could not mark all as read.", variant: "destructive" });
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const isLoading = loadingNotifications || loadingReminders;
  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="flex flex-col min-h-screen bg-background"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Notifications</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/20 rounded-full">
              <MoreVertical className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={!hasUnreadNotifications}>
              Mark all as read
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings/notifications')}>
              Notification settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-grow p-4 space-y-6 pb-20">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {imminentEvents.length > 0 && (
              <section className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  Happening Soon
                </h2>
                <div className="space-y-3">
                  {imminentEvents.map(event => (
                    <Link key={event.id} href={`/events/${event.id}`} passHref className="block">
                      <Card className="hover:shadow-md transition-shadow bg-amber-50 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50">
                        <CardContent className="p-3 flex items-center space-x-3">
                           {event.imageUrl ? (
                              <Image
                                src={event.imageUrl}
                                alt={event.title}
                                width={48}
                                height={48}
                                objectFit="cover"
                                className="rounded-md flex-shrink-0"
                                data-ai-hint={event.imageHint || "event reminder"}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-md flex items-center justify-center flex-shrink-0">
                                <CalendarClock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                              </div>
                            )}
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 line-clamp-1">{event.title}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">{event.relativeTime}</p>
                            <p className="text-xs text-amber-500 dark:text-amber-500 truncate">{event.location}</p>
                          </div>
                           <ChevronRight className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                <Separator className="my-6" />
              </section>
            )}

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <NotificationListItem key={notif.id} notification={notif} onMarkAsRead={handleMarkAsRead} />
                ))}
              </div>
            ) : (
              imminentEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <BellOff className="h-24 w-24 text-primary/20 mb-6" strokeWidth={1.5} />
                  <p className="text-xl font-semibold text-primary mt-2 mb-2">
                    All caught up!
                  </p>
                  <p className="text-muted-foreground text-sm">
                    You have no new notifications right now.
                  </p>
                </div>
              )
            )}
             {notifications.length === 0 && imminentEvents.length > 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No other notifications right now.</p>
             )}
          </>
        )}
      </main>
    </motion.div>
  );
}
