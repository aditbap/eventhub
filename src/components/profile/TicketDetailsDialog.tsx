
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import type { Ticket } from '@/types';
import { Trash2, ExternalLink, X } from 'lucide-react';

interface TicketDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onDeleteTicket: (ticketId: string) => void;
}

export function TicketDetailsDialog({ isOpen, onClose, ticket, onDeleteTicket }: TicketDetailsDialogProps) {
  if (!isOpen || !ticket) {
    return null;
  }

  const qrCodeData = `UPJEventHub-Ticket-${ticket.id}-Event-${ticket.eventId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{ticket.eventName}</DialogTitle>
          <DialogDescription>
            Scan this QR code for verification. Manage your ticket below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center my-6">
          <Image
            src={qrCodeUrl}
            alt={`QR Code for ${ticket.eventName}`}
            width={200}
            height={200}
            className="rounded-lg shadow-md border"
            data-ai-hint="qr code ticket"
          />
          <p className="text-xs text-muted-foreground mt-2">Ticket ID: {ticket.id}</p>
        </div>

        <div className="space-y-3">
          <Link href={`/events/${ticket.eventId}`} passHref legacyBehavior>
            <Button variant="outline" className="w-full justify-start" onClick={onClose}>
              <ExternalLink className="mr-2 h-5 w-5" />
              View Event Details
            </Button>
          </Link>
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => {
              onDeleteTicket(ticket.id);
            }}
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Delete My Ticket
          </Button>
        </div>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
