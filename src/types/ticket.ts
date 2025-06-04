
export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  eventName: string;
  eventDate: string; // Date of the event
  eventLocation: string;
  qrCodeUrl?: string; // placeholder for QR code image URL
  purchaseDate?: string; // ISO string for when the ticket was acquired, Firestore Timestamp will be converted
}
