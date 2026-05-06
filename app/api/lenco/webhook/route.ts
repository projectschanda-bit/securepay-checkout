import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Read the incoming webhook payload
    const payload = await req.json();

    // 2. Validate webhook signature (if Lenco provides one via headers)
    // const signature = req.headers.get("x-lenco-signature");
    // TODO: Verify signature using your LENCO_SECRET_KEY

    // 3. Process the payment status update
    // Lenco typically sends the reference and the new status
    const { reference, status, amount, currency } = payload;

    console.log("[Lenco Webhook] Received update:", {
      reference,
      status,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });

    // 4. Update your database with the new status
    if (status === "successful") {
      // e.g. await db.orders.updateStatus(reference, "PAID");
      console.log(`✅ Payment ${reference} was successful!`);
    } else if (status === "failed") {
      // e.g. await db.orders.updateStatus(reference, "FAILED");
      console.log(`❌ Payment ${reference} failed.`);
    }

    // 5. Acknowledge receipt to Lenco
    // It's critical to return a 200 OK so Lenco stops retrying the webhook
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error processing webhook";
    console.error("[Lenco Webhook] Error:", message);
    
    // Still return 200 to prevent infinite retries if it's our parsing error,
    // or return 400 if you want Lenco to retry (depends on their docs)
    return NextResponse.json({ received: false, error: message }, { status: 400 });
  }
}
