
'use server';

import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { db } from '@/lib/firebase';
import { createTicketAndNotification } from '../verify-payment/route'; // Import from verify-payment
import type { Event } from '@/types'; // Import Event type if needed for event details structure

// Midtrans Server Configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_ENVIRONMENT = process.env.MIDTRANS_ENVIRONMENT;

let coreApi: Midtrans.CoreApi | undefined;
if (MIDTRANS_SERVER_KEY && MIDTRANS_ENVIRONMENT && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
    coreApi = new Midtrans.CoreApi({
        isProduction: MIDTRANS_ENVIRONMENT === 'production',
        serverKey: MIDTRANS_SERVER_KEY,
        clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY, // CoreApi constructor needs clientKey
    });
} else {
    console.warn(
        "NOTIFICATION-HANDLER API: Midtrans Server Key, Client Key, or Environment not configured. " +
        "Notification handling might not be secure or fully functional."
    );
}

interface CustomFieldData {
    eventId: string;
    userId: string;
    eventDate: string;
    eventTime: string | null;
    eventLocation: string;
}
interface MidtransNotificationPayload {
    transaction_time: string;
    transaction_status: 'capture' | 'settlement' | 'pending' | 'deny' | 'expire' | 'cancel' | string; // string for other statuses
    transaction_id: string;
    status_message: string;
    status_code: string;
    signature_key?: string; // For verification
    payment_type: string;
    order_id: string;
    merchant_id: string;
    masked_card?: string;
    gross_amount: string;
    fraud_status?: 'accept' | 'challenge' | 'deny';
    currency: string;
    custom_field1?: string; // We expect JSON string: { eventId, userId, eventDate, eventTime, eventLocation }
    // ... other fields depending on payment type
    item_details?: Array<{ // item_details might be present in some notification types
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

        // TODO: Implement robust signature key verification for security if coreApi is configured
        // if (coreApi && notification.signature_key) {
        //   const expectedSignature = crypto.createHash('sha512')
        //     .update(notification.order_id + notification.status_code + notification.gross_amount + MIDTRANS_SERVER_KEY)
        //     .digest('hex');
        //   if (notification.signature_key !== expectedSignature) {
        //     console.error('[Notification Handler] Invalid signature for order_id:', notification.order_id);
        //     return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 403 });
        //   }
        //   console.log('[Notification Handler] Signature verified for order_id:', notification.order_id);
        // } else if (coreApi) {
        //   console.warn('[Notification Handler] Signature key not found in notification or coreApi not configured for verification. Proceeding without signature check.');
        // }


        const { order_id, transaction_status, fraud_status, custom_field1, item_details, gross_amount, transaction_id } = notification;

        if (!custom_field1 || !item_details || item_details.length === 0) {
            console.error('[Notification Handler] Missing custom_field1 or item_details in notification for order_id:', order_id);
            // Still return 200 to Midtrans to prevent retries for malformed notifications we can't process
            return NextResponse.json({ success: false, error: 'Missing custom_field1 or item_details' }, { status: 200 });
        }

        let parsedCustomField: CustomFieldData;
        try {
            parsedCustomField = JSON.parse(custom_field1);
        } catch (e) {
            console.error('[Notification Handler] Failed to parse custom_field1 for order_id:', order_id, e);
            return NextResponse.json({ success: false, error: 'Invalid custom_field1 format' }, { status: 200 });
        }

        const { userId, eventId, eventDate, eventTime, eventLocation } = parsedCustomField;
        const eventName = item_details[0].name;
        const eventPrice = parseFloat(gross_amount); // Use gross_amount from notification as source of truth

        // Construct EventDetailsForTicket for createTicketAndNotification
        // Note: imageUrl and imageHint will be undefined as they are not in the webhook payload
        const eventDetailsForTicket = {
            id: eventId,
            title: eventName,
            date: eventDate,
            time: eventTime || undefined,
            location: eventLocation,
            price: eventPrice,
            imageUrl: undefined, 
            imageHint: undefined,
        };
        
        if (
            (transaction_status === 'capture' && fraud_status === 'accept') ||
            (transaction_status === 'settlement')
        ) {
            console.log(`[Notification Handler] Payment confirmed for order_id: ${order_id}. Status: ${transaction_status}. Attempting to create ticket.`);
            
            // createTicketAndNotification will handle idempotency by checking midtransOrderId
            const ticketResult = await createTicketAndNotification(
                userId, 
                eventDetailsForTicket, 
                order_id,
                transaction_id // Pass Midtrans transaction_id
            );

            if (ticketResult.success) {
                if (ticketResult.alreadyExists) {
                    console.log(`[Notification Handler] Ticket for order_id ${order_id} was already processed.`);
                } else {
                    console.log(`[Notification Handler] Ticket ${ticketResult.ticketId} created successfully via webhook for order_id ${order_id}.`);
                }
            } else {
                // Log error, but still return 200 to Midtrans if it's a DB error on our side
                console.error(`[Notification Handler] Failed to create ticket via webhook for order_id ${order_id}.`);
            }

        } else if (transaction_status === 'pending') {
            console.log(`[Notification Handler] Payment pending for order_id: ${order_id}. Status: ${transaction_status}. No action taken by webhook yet.`);
            // Handle pending logic if necessary, e.g., update order status in DB to 'pending'
        } else {
            console.log(`[Notification Handler] Payment status for order_id ${order_id} is '${transaction_status}'. No ticket created by webhook.`);
            // Handle other statuses like 'deny', 'expire', 'cancel' (e.g., mark order as failed)
        }

        return NextResponse.json({ success: true, message: 'Notification received' }, { status: 200 });

    } catch (error: any) {
        console.error('[Notification Handler] Error processing Midtrans notification:', error);
        // Even on internal error, try to return 200 if the request was valid JSON from Midtrans,
        // to prevent Midtrans from retrying indefinitely for errors on our side.
        // If parsing request.json() itself fails, Next.js will handle it.
        return NextResponse.json({ success: false, error: error.message || 'Failed to process notification' }, { status: 500 }); // Or 200 if you want to absorb server errors.
    }
}
