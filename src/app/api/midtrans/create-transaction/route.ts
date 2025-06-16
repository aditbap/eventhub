
'use server';

import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';

// Ambil konfigurasi dari environment variables
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY; // For Snap.js initialization info
const MIDTRANS_ENVIRONMENT = process.env.MIDTRANS_ENVIRONMENT; // 'sandbox' or 'production'

let snap: Midtrans.Snap | undefined;
if (MIDTRANS_SERVER_KEY && MIDTRANS_CLIENT_KEY && MIDTRANS_ENVIRONMENT) {
  snap = new Midtrans.Snap({
    isProduction: MIDTRANS_ENVIRONMENT === 'production',
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY, // midtrans-client also needs clientKey
  });
} else {
  console.warn(
    "PERINGATAN PENTING (CREATE-TRANSACTION): Midtrans Server Key, Client Key, atau Environment tidak dikonfigurasi di environment variables." +
    "Fungsionalitas pembayaran Midtrans akan dinonaktifkan atau menggunakan dummy token. " +
    "Pastikan MIDTRANS_SERVER_KEY, NEXT_PUBLIC_MIDTRANS_CLIENT_KEY, dan MIDTRANS_ENVIRONMENT sudah diatur dengan benar."
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, eventTitle, eventPrice, userId, userEmail, userName, userPhone } = body;

    if (!eventId || !eventTitle || !eventPrice || !userId || !userEmail || !userName) {
      return NextResponse.json({ error: 'Missing required transaction details' }, { status: 400 });
    }
    
    if (!snap) {
      console.log("[API STUB / CREATE-TRANSACTION] Midtrans server not configured. Returning dummy SnapToken for UI testing.");
      const dummyOrderId = `DUMMY-ORDER-${eventId.slice(0,5)}-${userId.slice(0,5)}-${Date.now()}`;
      // Important: The dummy token should be a plausible string, not just any random text,
      // as Snap.js might have some basic format validation.
      // A real token is typically a UUID-like string.
      const dummySnapToken = `dummy-snap-token-${dummyOrderId}`; 
      return NextResponse.json({ snapToken: dummySnapToken });
    }

    const orderId = `UPJEH-${eventId.slice(0,5)}-${userId.slice(0,5)}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: eventPrice,
      },
      item_details: [{
        id: eventId,
        price: eventPrice,
        quantity: 1,
        name: eventTitle,
        merchant_name: "UPJ Event Hub" 
      }],
      customer_details: {
        first_name: userName,
        email: userEmail,
        phone: userPhone || undefined, 
      },
      // Optional: Add custom fields if needed for backend processing or reconciliation
      custom_field1: JSON.stringify({ eventId: eventId, userId: userId }), // Example: storing eventId and userId
      // custom_field2: "Additional data",
      // custom_field3: "More data",
      callbacks: {
        // finish: 'YOUR_APP_FINISH_REDIRECT_URL' // Redirect URL after payment (optional)
      },
      expiry: {
        // Optional: set transaction expiry
        // start_time: new Date().toISOString().replace("T", " ").substring(0, 19) + " +0700",
        // unit: "minutes",
        // duration: 60 // e.g., transaction expires in 60 minutes
      }
    };

    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token;

    return NextResponse.json({ snapToken });

  } catch (error: any) {
    console.error('[API Midtrans Error / CREATE-TRANSACTION] Failed to create transaction:', error);
    if (error.ApiResponse && error.ApiResponse.error_messages) {
      return NextResponse.json({ error: 'Midtrans API Error', details: error.ApiResponse.error_messages }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create Midtrans transaction' }, { status: 500 });
  }
}

    