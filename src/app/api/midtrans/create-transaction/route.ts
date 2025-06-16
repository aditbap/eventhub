
'use server';

import { NextResponse } from 'next/server';
// In a real scenario, you would import and use midtrans-client:
// import Midtrans from 'midtrans-client';

// Assume these are set in your environment variables:
// const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
// const MIDTRANS_ENVIRONMENT = process.env.MIDTRANS_ENVIRONMENT; // 'sandbox' or 'production'

// let snap;
// if (MIDTRANS_SERVER_KEY && MIDTRANS_ENVIRONMENT) {
//   snap = new Midtrans.Snap({
//     isProduction: MIDTRANS_ENVIRONMENT === 'production',
//     serverKey: MIDTRANS_SERVER_KEY,
//   });
// } else {
//   console.warn("Midtrans server key or environment is not configured. Midtrans functionality will be disabled.");
// }


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, eventTitle, eventPrice, userId, userEmail, userName, userPhone } = body;

    if (!eventId || !eventTitle || !eventPrice || !userId || !userEmail || !userName) {
      return NextResponse.json({ error: 'Missing required transaction details' }, { status: 400 });
    }
    
    // if (!snap) {
    //   return NextResponse.json({ error: 'Midtrans server is not configured.' }, { status: 500 });
    // }

    // Generate a unique order ID for each transaction attempt
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
        phone: userPhone || '081234567890', // Use provided phone or a default/placeholder
      },
      // Optional: expiry, custom_field, callbacks, etc.
      // expiry: {
      //   start_time: new Date().toISOString().slice(0, 19) + " +0700", // Current time in WIB
      //   unit: "minutes",
      //   duration: 30 // Example: 30 minutes expiry
      // }
    };

    // In a real scenario with 'midtrans-client' properly configured:
    // const transaction = await snap.createTransaction(parameter);
    // const snapToken = transaction.token;
    // return NextResponse.json({ snapToken });

    // For this placeholder, we return a dummy token for client-side testing.
    // This token will not work with actual Midtrans, but allows testing the Snap.js popup flow.
    const dummySnapToken = `DUMMY_SNAP_TOKEN_FOR_${orderId}`;
    console.log(`[API STUB] Generated dummy SnapToken for Order ID ${orderId}: ${dummySnapToken}`);
    return NextResponse.json({ snapToken: dummySnapToken });


  } catch (error: any) {
    console.error('[API Midtrans Error] Failed to create transaction:', error);
    // Check if it's a Midtrans API error object
    if (error.ApiResponse && error.ApiResponse.error_messages) {
      return NextResponse.json({ error: 'Midtrans API Error', details: error.ApiResponse.error_messages }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create Midtrans transaction' }, { status: 500 });
  }
}
