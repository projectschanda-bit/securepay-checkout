import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { paymentEmitter } from "@/lib/payment-emitter";

export async function POST(req: NextRequest) {
  try {
    // 1. Retrieve the signature header
    const signature = req.headers.get("x-lenco-signature") || "";
    if (!signature) {
      console.error("[Lenco Webhook] Missing X-Lenco-Signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // 2. Read the raw body as text (must be done before any JSON parse)
    const rawBody = await req.text();

    // 3. Verify HMAC-SHA512 signature
    const secretKey = process.env.LENCO_SECRET_KEY || "";
    if (!secretKey) {
      console.error("[Lenco Webhook] LENCO_SECRET_KEY is not configured");
      return NextResponse.json({ error: "Webhook key misconfigured" }, { status: 500 });
    }

    const webhookHashKey = crypto.createHash("sha256").update(secretKey).digest("hex");
    const computedBuffer = crypto
      .createHmac("sha512", webhookHashKey)
      .update(rawBody)
      .digest();
    const headerBuffer = Buffer.from(signature, "hex");

    // Use timingSafeEqual only when lengths match to prevent timing attacks
    let signaturesMatch = false;
    if (headerBuffer.length === computedBuffer.length) {
      signaturesMatch = crypto.timingSafeEqual(headerBuffer, computedBuffer);
    }

    if (!signaturesMatch) {
      console.error("[Lenco Webhook] Invalid signature — request rejected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 4. Parse the verified payload
    const payload = JSON.parse(rawBody) as {
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
      customerName?: string;
      reasonForFailure?: string;
      paidAt?: string;
    };

    const { reference, status, amount, currency, customerName, reasonForFailure, paidAt } = payload;

    if (!reference || !status) {
      console.warn("[Lenco Webhook] Payload missing reference or status — ignoring");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log("[Lenco Webhook] Verified update received:", {
      reference,
      status,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });

    // 5. Broadcast the update to any active SSE clients for this reference
    paymentEmitter.emit(reference, {
      reference,
      status,
      amount,
      currency,
      customerName,
      reasonForFailure,
      paidAt,
    });

    // 6. Log outcome (replace with real DB write in production)
    if (status === "successful") {
      console.log(`✅ Payment ${reference} was successful!`);
      // e.g. await db.transactions.update({ reference }, { status: "PAID" });
    } else if (status === "failed") {
      console.log(`❌ Payment ${reference} failed. Reason: ${reasonForFailure ?? "unknown"}`);
      // e.g. await db.transactions.update({ reference }, { status: "FAILED" });
    } else if (status === "cancelled") {
      console.log(`🚫 Payment ${reference} was cancelled.`);
    }

    // 7. Acknowledge receipt — Lenco stops retrying once it receives 200
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error processing webhook";
    console.error("[Lenco Webhook] Error:", message);
    // Return 400 so Lenco knows to retry if this was a transient failure
    return NextResponse.json({ received: false, error: message }, { status: 400 });
  }
}
