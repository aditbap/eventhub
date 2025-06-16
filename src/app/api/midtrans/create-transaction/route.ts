
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
    clientKey: MIDTRANS_CLIENT_KEY,
  });
} else {
  console.warn(
    "PERINGATAN PENTING (CREATE-TRANSACTION): Midtrans Server Key, Client Key, atau Environment tidak dikonfigurasi di environment variables." +
    "Fungsionalitas pembayaran Midtrans akan dinonaktifkan atau menggunakan dummy token. " +
    "Pastikan MIDTRANS_SERVER_KEY, NEXT_PUBLIC_MIDTRANS_CLIENT_KEY, dan MIDTRANS_ENVIRONMENT sudah diatur dengan benar."
  );
}

interface CreateTransactionBody {
  eventId: string;
  eventTitle: string;
  eventPrice: number;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM
  eventLocation: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateTransactionBody = await request.json();
    const { 
      eventId, 
      eventTitle, 
      eventPrice, 
      eventDate,
      eventTime,
      eventLocation,
      userId, 
      userEmail, 
      userName, 
      userPhone 
    } = body;

    if (!eventId || !eventTitle || eventPrice === undefined || !eventDate || !eventLocation || !userId || !userEmail || !userName) {
      return NextResponse.json({ error: 'Missing required transaction details' }, { status: 400 });
    }
    
    if (!snap) {
      console.log("[API STUB / CREATE-TRANSACTION] Midtrans server not configured. Returning dummy SnapToken for UI testing.");
      const dummyOrderId = `DUMMY-ORDER-${eventId.slice(0,5)}-${userId.slice(0,5)}-${Date.now()}`;
      const dummySnapToken = `dummy-snap-token-${dummyOrderId}`; 
      return NextResponse.json({ snapToken: dummySnapToken });
    }

    const orderId = `UPJEH-${eventId.slice(0,5)}-${userId.slice(0,5)}-${Date.now()}`;

    const customField1Data = {
      eventId: eventId,
      userId: userId,
      eventDate: eventDate,
      eventTime: eventTime || null, // Ensure time is passed or null
      eventLocation: eventLocation,
    };

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: eventPrice,
      },
      item_details: [{
        id: eventId, // Usually the product ID
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
      custom_field1: JSON.stringify(customField1Data),
      callbacks: {
        // finish: 'YOUR_APP_FINISH_REDIRECT_URL' // e.g., https://upjevent.vercel.app/profile/my-tickets
      },
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
    
