import { NextRequest, NextResponse } from "next/server";
import {
  initiateMobileMoneyPayment,
  buildCardWidgetConfig,
  generateReference,
  type Currency,
  type MobileOperator,
  type FeeBearer,
} from "@/lenco-module/lib/lenco";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      method,         // "mobile_money" | "card"
      amount,         // number string, e.g. "10.50"
      currency,       // "ZMW" | "MWK" | "USD"
      phoneNumber,    // mobile money only
      operator,       // "airtel" | "mtn" | "zamtel"
      bearer,         // "merchant" | "customer"
      customerName,
      customerEmail,
    } = body;

    /* ── Validation ── */
    if (!method || !amount || !currency) {
      return NextResponse.json(
        { status: false, message: "Missing required fields: method, amount, currency" },
        { status: 400 }
      );
    }

    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      return NextResponse.json(
        { status: false, message: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const reference   = generateReference("PAY");
    const description = `Payment from ${customerName || "customer"}`;

    /* ── Mobile Money — STK push ── */
    if (method === "mobile_money") {
      if (!phoneNumber || !operator) {
        return NextResponse.json(
          { status: false, message: "Phone number and operator are required for mobile money" },
          { status: 400 }
        );
      }

      // Normalise Zambian numbers to local format (09xxxxxxxx)
      let phone = phoneNumber.replace(/\s+/g, "");
      if (phone.startsWith("+260"))       phone = "0" + phone.slice(4);
      else if (phone.startsWith("260") && phone.length === 12) phone = "0" + phone.slice(3);

      const result = await initiateMobileMoneyPayment({
        amount:        finalAmount,
        currency:      currency as Currency,
        reference,
        phoneNumber:   phone,
        operator:      operator as MobileOperator,
        bearer:        (bearer ?? "merchant") as FeeBearer,
        customerName,
        customerEmail,
        description,
      });

      return NextResponse.json({ ...result, reference });
    }

    /* ── Card — Lenco Inline Widget ──
       Card data is entered inside Lenco's own PCI-DSS iframe.
       We return a widgetConfig; the browser calls LencoPay.getPaid() with it.
       No raw card data ever reaches this server.
    ── */
    if (method === "card") {
      const publicKey = process.env.LENCO_PUBLIC_KEY;
      if (!publicKey) {
        return NextResponse.json(
          { status: false, message: "LENCO_PUBLIC_KEY is not configured on the server" },
          { status: 500 }
        );
      }

      const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const callbackUrl = `${appUrl}/status/${reference}`;

      const widgetConfig = buildCardWidgetConfig({
        publicKey,
        amount:        finalAmount,
        currency:      currency as Currency,
        reference,
        customerName,
        customerEmail,
        description,
        callbackUrl,
      });

      return NextResponse.json({
        status: true,
        message: "Card checkout session ready",
        reference,
        widgetConfig,
      });
    }

    return NextResponse.json(
      { status: false, message: `Unsupported payment method: ${method}` },
      { status: 400 }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[/api/initiate]", error);
    return NextResponse.json({ status: false, message }, { status: 500 });
  }
}
