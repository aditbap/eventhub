
'use server';

import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Ticket, Notification, Event, User } from '@/types';

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

// Updated function signature and logic
export async function createTicketAndNotification(
  registrantUserId: string,
  registrantDetails: { displayName: string | null; photoURL: string | null },
  event: Event, // Full event object from Firestore
  midtransOrderId: string,
  midtransTransactionId?: string
) {
    try {
      const ticketsRef = collection(db, "userTickets");
      const q = query(ticketsRef, where("midtransOrderId", "==", midtransOrderId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`[Ticket Creation] Ticket for Midtrans Order ID ${midtransOrderId} already exists. Skipping creation.`);
        return { success: true, ticketId: querySnapshot.docs[0].id, alreadyExists: true };
      }

      const ticketData: Omit<Ticket, 'id' | 'qrCodeUrl' | 'purchaseDate'> & { midtransOrderId: string; midtransTransactionId?: string } = {
        userId: registrantUserId,
        eventId: event.id,
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.time || undefined,
        eventLocation: event.location,
        eventImageUrl: event.imageUrl || undefined,
        eventImageHint: event.imageHint || undefined,
        midtransOrderId: midtransOrderId,
        midtransTransactionId: midtransTransactionId || undefined,
      };

      const ticketDocRef = await addDoc(collection(db, "userTickets"), {
        ...ticketData,
        purchaseDate: serverTimestamp(),
      });

      // Notification for the registrant
      const registrantNotificationData: Omit<Notification, 'id' | 'timestamp'> = {
        userId: registrantUserId,
        category: 'event_registration',
        title: 'Ticket Acquired!',
        message: `You've successfully got a ticket for ${event.title}.`,
        relatedEventId: event.id,
        relatedEventName: event.title,
        relatedEventImageUrl: event.imageUrl,
        relatedEventImageHint: event.imageHint,
        link: `/profile/my-tickets?ticketId=${ticketDocRef.id}`,
        isRead: false,
        icon: 'Ticket',
      };

      await addDoc(collection(db, "userNotifications"), {
        ...registrantNotificationData,
        timestamp: serverTimestamp()
      });

      // Notification for the event organizer (if registrant is not the organizer)
      if (event.creatorId && event.creatorId !== registrantUserId) {
        const organizerNotificationData: Omit<Notification, 'id' | 'timestamp'> = {
          userId: event.creatorId, // Notify the event creator
          category: 'social', // Or a more specific category like 'event_update' or 'new_registrant'
          title: `New Registration: ${event.title}`,
          message: `${registrantDetails.displayName || 'Someone'} has registered for your event.`,
          relatedEventId: event.id,
          relatedEventName: event.title,
          relatedUserId: registrantUserId, // User who registered
          relatedUserName: registrantDetails.displayName,
          relatedUserAvatar: registrantDetails.photoURL,
          link: `/events/${event.id}`, // Link to the event or a future participant list page
          isRead: false,
          icon: 'UserPlus', // Icon indicating a new user interaction
        };
        await addDoc(collection(db, "userNotifications"), {
          ...organizerNotificationData,
          timestamp: serverTimestamp()
        });
        console.log(`[Ticket Creation] Sent notification to organizer ${event.creatorId} for event ${event.id}`);
      }


      console.log(`[Ticket Creation] Successfully created ticket ${ticketDocRef.id} for Midtrans Order ID ${midtransOrderId}`);
      return { success: true, ticketId: ticketDocRef.id, alreadyExists: false };
    } catch (error) {
      console.error(`[Ticket Creation] Error creating ticket/notification in Firestore for Midtrans Order ID ${midtransOrderId}:`, error);
      throw new Error('Failed to finalize ticket creation in database.');
    }
}

interface ClientEventDetails { // Details client sends, might be partial
    id: string;
    title: string;
    date: string;
    time?: string;
    location: string;
    imageUrl?: string;
    imageHint?: string;
    price?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Renamed eventDetails from client to clientEventDetails to avoid confusion
    const { order_id, clientTransactionStatus, eventDetails: clientEventDetails, userId: registrantUserId } = body;

    if (!order_id || !clientEventDetails || !registrantUserId) {
      return NextResponse.json({ success: false, error: 'Missing required verification details' }, { status: 400 });
    }

    // Fetch full event details from Firestore
    const eventDocRef = doc(db, 'events', clientEventDetails.id);
    const eventDocSnap = await getDoc(eventDocRef);
    if (!eventDocSnap.exists()) {
      console.error(`[Verify API] Event ${clientEventDetails.id} not found in Firestore.`);
      return NextResponse.json({ success: false, error: 'Event details not found.' }, { status: 404 });
    }
    const eventData = eventDocSnap.data() as Event;
    // Ensure the eventData includes creatorId as per Event type
    if (!eventData.creatorId) {
        console.error(`[Verify API] Event ${clientEventDetails.id} is missing creatorId.`);
        return NextResponse.json({ success: false, error: 'Event data is incomplete (missing creatorId).' }, { status: 500 });
    }


    // Fetch registrant user details
    const registrantUserDocRef = doc(db, 'users', registrantUserId);
    const registrantUserDocSnap = await getDoc(registrantUserDocRef);
    let registrantDetails = { displayName: 'A User', photoURL: null }; // Defaults
    if (registrantUserDocSnap.exists()) {
      const registrantData = registrantUserDocSnap.data();
      registrantDetails = {
        displayName: registrantData?.displayName || 'A User',
        photoURL: registrantData?.photoURL || null,
      };
    } else {
        console.warn(`[Verify API] Registrant user ${registrantUserId} not found in Firestore. Using default name.`);
    }


    if (clientTransactionStatus === 'free_ticket' && (eventData.price === undefined || eventData.price <= 0)) {
        console.log(`[Verify API] Processing free ticket for order_id: ${order_id}`);
        await createTicketAndNotification(registrantUserId, registrantDetails, eventData, order_id);
        return NextResponse.json({ success: true, message: 'Free ticket acquired successfully!' });
    }

    if (!snap) {
      console.error("[Verify API] Midtrans server not configured. Cannot verify paid transaction.");
      return NextResponse.json({ success: false, error: 'Payment gateway not configured on server.' }, { status: 500 });
    }

    console.log(`[Verify API] Verifying Midtrans transaction for order_id: ${order_id}`);
    const transactionStatus = await snap.transaction.status(order_id);

    console.log('[Verify API] Midtrans Raw Status Response:', transactionStatus);

    const { transaction_status, fraud_status, transaction_id } = transactionStatus;

    if (
        (transaction_status === 'capture' && fraud_status === 'accept') ||
        (transaction_status === 'settlement')
    ) {
      console.log(`[Verify API] Payment confirmed for order_id: ${order_id}. Status: ${transaction_status}`);
      await createTicketAndNotification(registrantUserId, registrantDetails, eventData, order_id, transaction_id);
      return NextResponse.json({ success: true, message: 'Ticket acquired successfully after payment verification!' });

    } else if (transaction_status === 'pending') {
        console.log(`[Verify API] Payment pending for order_id: ${order_id}. Status: ${transaction_status}`);
        return NextResponse.json({ success: false, error: 'Payment is still pending. We will notify you upon confirmation.', status: 'pending' }, { status: 202 });
    } else {
      console.warn(`[Verify API] Payment not successful for order_id: ${order_id}. Midtrans status: ${transaction_status}, Fraud status: ${fraud_status}`);
      return NextResponse.json({ success: false, error: `Payment not confirmed or failed. Status: ${transaction_status}` }, { status: 402 });
    }

  } catch (error: any) {
    console.error('[Verify API] Error during payment verification:', error);
    if (error.ApiResponse && error.ApiResponse.error_messages) {
        return NextResponse.json({ success: false, error: 'Midtrans API Error during verification.', details: error.ApiResponse.error_messages }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to verify payment or create ticket.' }, { status: 500 });
  }
}
