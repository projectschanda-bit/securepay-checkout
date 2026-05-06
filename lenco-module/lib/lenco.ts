/**
 * Lenco BroadPay API Client
 *
 * All calls are server-side only — the secret key never reaches the browser.
 * Swap this module for any other provider adapter without touching UI components.
 *
 * Required environment variables:
 *   LENCO_SECRET_KEY   — your Lenco secret API key
 *   LENCO_PUBLIC_KEY   — your Lenco public key (used client-side in the widget)
 *   LENCO_BASE_URL     — optional override (default: https://api.lenco.co/access/v2)
 */

const BASE_URL   = process.env.LENCO_BASE_URL  ?? "https://api.lenco.co/access/v2";
const SECRET_KEY = process.env.LENCO_SECRET_KEY ?? "";
const IS_DEV     = process.env.NODE_ENV === "development";

if (!SECRET_KEY && typeof window === "undefined") {
  console.warn("[Lenco] LENCO_SECRET_KEY is not set — add it to .env.local");
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** Mobile money network operators supported by Lenco */
export type MobileOperator = "airtel" | "mtn" | "zamtel";

/** Currencies supported by the integration */
export type Currency = "ZMW" | "MWK" | "USD";

/** Which party absorbs the Lenco transaction fee */
export type FeeBearer = "merchant" | "customer";

/** Payment method */
export type PaymentMethod = "mobile_money" | "card";

/** Payload to initiate an STK push */
export interface InitiateMobileMoneyPayload {
  amount:        number;          // standard unit, e.g. 10.50
  currency:      Currency;
  reference:     string;          // your unique transaction reference
  phoneNumber:   string;          // local format, e.g. 0971234567
  operator:      MobileOperator;
  bearer:        FeeBearer;
  description?:  string;
  customerName?:  string;
  customerEmail?: string;
}

/** Payload to initiate a card payment */
export interface InitiateCardPayload {
  amount:         number;
  currency:       Currency;
  reference:      string;
  description?:   string;
  customerName?:  string;
  customerEmail?: string;
  callbackUrl?:   string;
}

/** Standard Lenco envelope */
export interface LencoResponse<T = unknown> {
  status:   boolean;
  message:  string;
  data?:    T;
}

/** Payment status record returned by the status endpoint */
export interface PaymentStatusData {
  reference:         string;
  status:            "pending" | "processing" | "successful" | "failed" | "cancelled" | "pay-offline";
  amount:            number;
  currency:          Currency;
  customerName?:     string;
  description?:      string;
  paidAt?:           string;
  reasonForFailure?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function devLog(...args: unknown[]) {
  if (IS_DEV) console.log("[Lenco]", ...args);
}

async function lencoFetch<T>(
  endpoint: string,
  method:   "GET" | "POST" = "GET",
  body?:    object
): Promise<LencoResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  devLog(`${method} ${url}`, body ?? "");

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${SECRET_KEY}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const text = await res.text();
    devLog(`Response (${res.status}):`, text);

    try {
      return JSON.parse(text) as LencoResponse<T>;
    } catch {
      console.error("[Lenco] Non-JSON response:", text);
      return { status: false, message: "Invalid response from payment provider" };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    console.error("[Lenco] Fetch error:", error);
    return { status: false, message: `Network error: ${message}` };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Initiate a Mobile Money STK push */
export async function initiateMobileMoneyPayment(
  payload: InitiateMobileMoneyPayload
): Promise<LencoResponse<PaymentStatusData>> {
  const { phoneNumber, ...rest } = payload;
  return lencoFetch<PaymentStatusData>("/collections/mobile-money", "POST", {
    ...rest,
    phone: phoneNumber,
  });
}

/**
 * Initiate a card payment via the Lenco Inline Widget.
 * Returns a widgetConfig object that the frontend passes to `LencoPay.getPaid()`.
 * Card data never touches your server — it is handled on Lenco's PCI-DSS servers.
 */
export function buildCardWidgetConfig(payload: InitiateCardPayload & { publicKey: string }) {
  return {
    publicKey:     payload.publicKey,
    amount:        payload.amount,
    currency:      payload.currency,
    reference:     payload.reference,
    customerName:  payload.customerName  ?? "",
    customerEmail: payload.customerEmail ?? "",
    description:   payload.description  ?? `Payment ${payload.reference}`,
    callbackUrl:   payload.callbackUrl   ?? "",
    bearer:        "merchant" as FeeBearer,
  };
}

/**
 * Initiate a hosted checkout (redirect-based).
 * Returns a `payment_url` to redirect the customer to.
 */
export async function initiateHostedCheckout(
  payload: InitiateCardPayload
): Promise<LencoResponse<{ payment_url: string; reference: string }>> {
  return lencoFetch("/payments", "POST", {
    amount:      payload.amount,
    currency:    payload.currency,
    reference:   payload.reference,
    description: payload.description,
    customer: {
      name:  payload.customerName,
      email: payload.customerEmail,
    },
    redirect_url: payload.callbackUrl,
  });
}

/** Poll payment status by reference */
export async function getPaymentStatus(
  reference: string
): Promise<LencoResponse<PaymentStatusData>> {
  return lencoFetch<PaymentStatusData>(`/collections/status/${reference}`);
}

/** Generate a unique, URL-safe payment reference */
export function generateReference(prefix = "PAY"): string {
  const ts     = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${ts}-${random}`;
}
