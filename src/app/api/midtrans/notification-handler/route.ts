
'use server';

import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { db } from '@/lib/firebase';
import { createTicketAndNotification } from '../verify-payment/route';
import type { Event } from '@/types';
import { doc, getDoc } from 'firebase/firestore'; // Import getDoc and doc


// Midtrans Server Configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_ENVIRONMENT = process.env.MIDTRANS_ENVIRONMENT;

let coreApi: Midtrans.CoreApi | undefined;
if (MIDTRANS_SERVER_KEY && MIDTRANS_ENVIRONMENT && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
    coreApi = new Midtrans.CoreApi({
        isProduction: MIDTRANS_ENVIRONMENT === 'production',
        serverKey: MIDTRANS_SERVER_KEY,
        clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    });
} else {
    console.warn(
        "NOTIFICATION-HANDLER API: Midtrans Server Key, Client Key, atau Environment not configured. " +
        "Notification handling might not be secure atau fully functional."
    );
}

interface CustomFieldData {
    eventId: string;
    userId: string; // Registrant's UID
    eventDate: string;
    eventTime: string | null;
    eventLocation: string;
    eventCreatorId: string | null; // Added from create-transaction
}
interface MidtransNotificationPayload {
    transaction_time: string;
    transaction_status: 'capture' | 'settlement' | 'pending' | 'deny' | 'expire' | 'cancel' | string;
    transaction_id: string;
    status_message: string;
    status_code: string;
    signature_key?: string;
    payment_type: string;
    order_id: string;
    merchant_id: string;
    masked_card?: string;
    gross_amount: string;
    fraud_status?: 'accept' | 'challenge' | 'deny';
    currency: string;
    custom_field1?: string;
    item_details?: Array<{
        id: string;
        price: number;
        quantity: number;
        name: string;
    }>;
}


export async function POST(request: Request) {
    try {
        const notification: MidtransNotificationPayload = await request.json();
        console.log('[Notification Handler] Received Midtrans Notification:', JSON.stringify(notification, null, 2));

        // Basic signature key verification example (adapt as needed, SHA512 is common)
        // if (coreApi && notification.signature_key && MIDTRANS_SERVER_KEY) {
        //   const crypto = await import('crypto'); // Dynamic import for crypto
        //   const hash = crypto.createHash('sha512')
        //     .update(notification.order_id + notification.status_code + notification.gross_amount + MIDTRANS_SERVER_KEY)
        //     .digest('hex');
        //   if (notification.signature_key !== hash) {
        //     console.error('[Notification Handler] Invalid signature for order_id:', notification.order_id);
        //     return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 403 });
        //   }
        //   console.log('[Notification Handler] Signature verified for order_id:', notification.order_id);
        // } else if (coreApi) {
        //   console.warn('[Notification Handler] Signature key not found or coreApi/serverKey not fully configured for verification. Proceeding without strict signature check.');
        // }


        const { order_id, transaction_status, fraud_status, custom_field1, item_details, gross_amount, transaction_id } = notification;

        if (!custom_field1 || !item_details || item_details.length === 0) {
            console.error('[Notification Handler] Missing custom_field1 or item_details in notification for order_id:', order_id);
            return NextResponse.json({ success: false, error: 'Missing custom_field1 or item_details' }, { status: 200 });
        }

        let parsedCustomField: CustomFieldData;
        try {
            parsedCustomField = JSON.parse(custom_field1);
        } catch (e) {
            console.error('[Notification Handler] Failed to parse custom_field1 for order_id:', order_id, e);
            return NextResponse.json({ success: false, error: 'Invalid custom_field1 format' }, { status: 200 });
        }

        const { userId: registrantUserId, eventId, eventCreatorId } = parsedCustomField;
        
        if (!registrantUserId || !eventId) {
            console.error(`[Notification Handler] Missing registrantUserId or eventId in custom_field1 for order_id: ${order_id}`);
            return NextResponse.json({ success: false, error: 'Incomplete custom field data' }, { status: 200 });
        }
        
        // Fetch full event details from Firestore using eventId
        const eventDocRef = doc(db, 'events', eventId);
        const eventDocSnap = await getDoc(eventDocRef);
        if (!eventDocSnap.exists()) {
          console.error(`[Notification Handler] Event ${eventId} not found in Firestore for order_id: ${order_id}.`);
          return NextResponse.json({ success: false, error: 'Event details not found for ticket creation.' }, { status: 200 }); // 200 to acknowledge Midtrans
        }
        const eventData = eventDocSnap.data() as Event;
         // Ensure eventCreatorId from custom_field1 matches the one in the event document, or use from event document if custom_field1 was null
        if (!eventData.creatorId && !eventCreatorId) {
            console.error(`[Notification Handler] Critical: Creator ID missing for event ${eventId}. Cannot notify organizer. Order ID: ${order_id}`);
             // Potentially still create ticket for user, but organizer won't be notified.
        }
        // Prefer creatorId from the event document as source of truth if custom_field1 was null
        const finalEventCreatorId = eventData.creatorId || eventCreatorId;
        if (!finalEventCreatorId) {
             console.warn(`[Notification Handler] Creator ID for event ${eventId} could not be determined. Organizer will not be notified. Order ID: ${order_id}`);
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
             console.warn(`[Notification Handler] Registrant user ${registrantUserId} not found. Using default name for notification. Order ID: ${order_id}`);
        }
        
        // Construct the full Event object to pass to createTicketAndNotification
        const fullEventDataForTicket: Event = {
            ...eventData, // Spread existing event data
            id: eventId, // Ensure id is correct
            creatorId: finalEventCreatorId || '', // Ensure creatorId is string, even if empty (though it should exist)
        };


        if (
            (transaction_status === 'capture' && fraud_status === 'accept') ||
            (transaction_status === 'settlement')
        ) {
            console.log(`[Notification Handler] Payment confirmed for order_id: ${order_id}. Status: ${transaction_status}. Attempting to create ticket.`);

            const ticketResult = await createTicketAndNotification(
                registrantUserId,
                registrantDetails,
                fullEventDataForTicket, // Pass the fetched full event data
                order_id,
                transaction_id
            );

            if (ticketResult.success) {
                if (ticketResult.alreadyExists) {
                    console.log(`[Notification Handler] Ticket for order_id ${order_id} was already processed.`);
                } else {
                    console.log(`[Notification Handler] Ticket ${ticketResult.ticketId} created successfully via webhook for order_id ${order_id}.`);
                }
            } else {
                console.error(`[Notification Handler] Failed to create ticket via webhook for order_id ${order_id}.`);
            }

        } else if (transaction_status === 'pending') {
            console.log(`[Notification Handler] Payment pending for order_id: ${order_id}. Status: ${transaction_status}. No action taken by webhook yet.`);
        } else {
            console.log(`[Notification Handler] Payment status for order_id ${order_id} is '${transaction_status}'. No ticket created by webhook.`);
        }

        return NextResponse.json({ success: true, message: 'Notification received' }, { status: 200 });

    } catch (error: any) {
        console.error('[Notification Handler] Error processing Midtrans notification:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to process notification' }, { status: 500 });
    }
}
