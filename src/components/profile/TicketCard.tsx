'use client';

import type { Ticket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, MapPin, QrCode } from 'lucide-react';
import Image from 'next/image'; // For placeholder QR

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const formattedDate = new Date(ticket.eventDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted/30 p-4">
        <CardTitle className="text-lg font-headline">{ticket.eventName}</CardTitle>
        <CardDescription className="text-sm">Ticket ID: {ticket.id}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center text-sm">
            <CalendarDays className="h-4 w-4 mr-2 text-primary shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-primary shrink-0" />
            <span>{ticket.eventLocation}</span>
          </div>
        </div>
        <div className="flex justify-center md:justify-end items-center">
          {ticket.qrCodeUrl ? (
            <Image src={ticket.qrCodeUrl} alt="QR Code" width={80} height={80} data-ai-hint="qr code" />
          ) : (
            <div className="w-20 h-20 bg-gray-100 flex flex-col items-center justify-center rounded-md text-muted-foreground">
              <QrCode className="h-8 w-8 mb-1" />
              <span className="text-xs">QR Code</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
