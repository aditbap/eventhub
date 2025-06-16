
'use server';

import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Ticket, Notification, Event } from '@/types'; // Ensure Event type is imported

// Midtrans Server Configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_ENVIRONMENT = process.env.MIDTRANS_ENVIRONMENT; // 'sandbox' or 'production'

let snap: Midtrans.Snap | undefined;
if (MIDTRANS_SERVER_KEY && MIDTRANS_ENVIRONMENT) {
  snap = new Midtrans.Snap({
    isProduction: MIDTRANS_ENVIRONMENT === 'production',
    serverKey: MIDTRANS_SERVER_KEY,
  });
} else {
  console.warn(
    "VERIFY-PAYMENT API: Midtrans Server Key or Environment not configured. " +
    "Payment verification will likely fail for real transactions."
  );
}

interface EventDetailsForTicket {
    id: string;
    title: string;
    date: string; // ISO string or formatted string
    time?: string;
    location: string;
    imageUrl?: string;
    imageHint?: string;
    price?: number;
}

async function createTicketAndNotification(userId: string, eventDetails: EventDetailsForTicket, orderId: string) {
    try {
      const ticketData: Omit<Ticket, 'id' | 'qrCodeUrl' | 'purchaseDate'> = {
        userId: userId,
        eventId: eventDetails.id,
        eventName: eventDetails.title,
        eventDate: eventDetails.date,
        eventTime: eventDetails.time || undefined,
        eventLocation: eventDetails.location,
        eventImageUrl: eventDetails.imageUrl || undefined,
        eventImageHint: eventDetails.imageHint || undefined,
      };

      // Note: For production, you might want to store the Midtrans transaction_id or order_id with the ticket
      // for reconciliation purposes.
      const ticketDocRef = await addDoc(collection(db, "userTickets"), {
        ...ticketData,
        purchaseDate: serverTimestamp(),
        midtransOrderId: orderId, // Store Midtrans order ID
      });

      const notificationData: Omit<Notification, 'id' | 'timestamp'> = {
        userId: userId,
        category: 'event_registration',
        title: 'Ticket Acquired!',
        message: `You've successfully got a ticket for ${eventDetails.title}.`,
        relatedEventId: eventDetails.id,
        relatedEventName: eventDetails.title,
        relatedEventImageUrl: eventDetails.imageUrl,
        relatedEventImageHint: eventDetails.imageHint,
        link: `/profile/my-tickets?ticketId=${ticketDocRef.id}`,
        isRead: false,
        icon: 'Ticket',
      };

      await addDoc(collection(db, "userNotifications"), {
        ...notificationData,
        timestamp: serverTimestamp()
      });

      return { success: true, ticketId: ticketDocRef.id };
    } catch (error) {
      console.error('Error creating ticket/notification in Firestore:', error);
      throw new Error('Failed to finalize ticket creation in database.');
    }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, clientTransactionStatus, eventDetails, userId } = body;

    if (!order_id || !eventDetails || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required verification details' }, { status: 400 });
    }

    // Handle free tickets directly without Midtrans verification if indicated
    if (clientTransactionStatus === 'free_ticket' && eventDetails.price === 0) {
        console.log(`[Verify API] Processing free ticket for order_id: ${order_id}`);
        await createTicketAndNotification(userId, eventDetails, order_id);
        return NextResponse.json({ success: true, message: 'Free ticket acquired successfully!' });
    }
    
    // Proceed with Midtrans verification for paid tickets
    if (!snap) {
      // This case should ideally not be hit if create-transaction worked,
      // but as a safeguard for paid tickets:
      console.error("[Verify API] Midtrans server not configured. Cannot verify paid transaction.");
      return NextResponse.json({ success: false, error: 'Payment gateway not configured on server.' }, { status: 500 });
    }

    console.log(`[Verify API] Verifying Midtrans transaction for order_id: ${order_id}`);
    const transactionStatus = await snap.transaction.status(order_id);
    
    console.log('[Verify API] Midtrans Raw Status Response:', transactionStatus);

    const { transaction_status, fraud_status } = transactionStatus;

    // Check if payment is successful according to Midtrans
    // (settlement for most, capture if you use pre-auth/capture)
    if (
        (transaction_status === 'capture' && fraud_status === 'accept') ||
        (transaction_status === 'settlement') // Settlement implies fraud check passed
    ) {
      console.log(`[Verify API] Payment confirmed for order_id: ${order_id}. Status: ${transaction_status}`);
      // Payment is successful, proceed to create ticket and notification
      await createTicketAndNotification(userId, eventDetails, order_id);
      return NextResponse.json({ success: true, message: 'Ticket acquired successfully after payment verification!' });

    } else if (transaction_status === 'pending') {
        console.log(`[Verify API] Payment pending for order_id: ${order_id}. Status: ${transaction_status}`);
        // Handle pending: inform user, rely on webhook for final status
        return NextResponse.json({ success: false, error: 'Payment is still pending. We will notify you upon confirmation.', status: 'pending' }, { status: 202 });
    } else {
      // Payment failed or other status
      console.warn(`[Verify API] Payment not successful for order_id: ${order_id}. Midtrans status: ${transaction_status}, Fraud status: ${fraud_status}`);
      return NextResponse.json({ success: false, error: `Payment not confirmed or failed. Status: ${transaction_status}` }, { status: 402 }); // Payment Required or Bad Request
    }

  } catch (error: any) {
    console.error('[Verify API] Error during payment verification:', error);
    // Check if this is error from Midtrans API itself
    if (error.ApiResponse && error.ApiResponse.error_messages) {
        return NextResponse.json({ success: false, error: 'Midtrans API Error during verification.', details: error.ApiResponse.error_messages }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to verify payment or create ticket.' }, { status: 500 });
  }
}


    