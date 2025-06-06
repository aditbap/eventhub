
export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  eventName: string;
  eventDate: string; // Date of the event
  eventTime?: string; // Time of the event
  eventLocation: string;
  eventImageUrl?: string; // Image URL for the event
  eventImageHint?: string; // AI Hint for the event image
  qrCodeUrl?: string; // placeholder for QR code image URL
  purchaseDate?: string; // ISO string for when the ticket was acquired, Firestore Timestamp will be converted
}

