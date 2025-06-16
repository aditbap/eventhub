
'use server';

import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';

// Ambil konfigurasi dari environment variables
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
    "PERINGATAN PENTING: Midtrans Server Key atau Environment tidak dikonfigurasi di environment variables." +
    "Fungsionalitas pembayaran Midtrans akan dinonaktifkan atau menggunakan dummy token. " +
    "Pastikan MIDTRANS_SERVER_KEY dan MIDTRANS_ENVIRONMENT sudah diatur dengan benar."
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, eventTitle, eventPrice, userId, userEmail, userName, userPhone } = body;

    if (!eventId || !eventTitle || !eventPrice || !userId || !userEmail || !userName) {
      return NextResponse.json({ error: 'Missing required transaction details' }, { status: 400 });
    }
    
    // Jika konfigurasi Midtrans tidak lengkap, kembalikan dummy token untuk testing UI
    if (!snap) {
      console.log("[API STUB] Midtrans server not configured. Returning dummy SnapToken for UI testing.");
      const dummyOrderId = `DUMMY-ORDER-${eventId.slice(0,5)}-${userId.slice(0,5)}-${Date.now()}`;
      const dummySnapToken = `DUMMY_SNAP_TOKEN_FOR_${dummyOrderId}`;
      return NextResponse.json({ snapToken: dummySnapToken });
    }

    // Generate order ID yang unik untuk setiap transaksi
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
        merchant_name: "UPJ Event Hub" // Ganti dengan nama merchant Anda jika perlu
      }],
      customer_details: {
        first_name: userName,
        // last_name: "", // Opsional
        email: userEmail,
        phone: userPhone || undefined, // Kirim jika ada, jika tidak maka undefined
      },
      // Optional: expiry, custom_field, callbacks, dll.
      // expiry: {
      //   start_time: new Date().toISOString().slice(0, 19) + " +0700", // Waktu saat ini dalam WIB
      //   unit: "minutes",
      //   duration: 30 // Contoh: expired dalam 30 menit
      // }
    };

    // Buat transaksi menggunakan midtrans-client
    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token;

    return NextResponse.json({ snapToken });

  } catch (error: any) {
    console.error('[API Midtrans Error] Failed to create transaction:', error);
    // Cek apakah ini error dari API Midtrans
    if (error.ApiResponse && error.ApiResponse.error_messages) {
      return NextResponse.json({ error: 'Midtrans API Error', details: error.ApiResponse.error_messages }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create Midtrans transaction' }, { status: 500 });
  }
}
