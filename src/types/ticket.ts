export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  qrCodeUrl?: string; // placeholder for QR code image URL
}
