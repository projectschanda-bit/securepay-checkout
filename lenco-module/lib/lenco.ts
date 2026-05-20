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

// ─── Types & Interfaces ────────────────────────────────────────────────────────

/**
 * Mobile money network operators supported by Lenco.
 */
export type MobileOperator = "airtel" | "mtn" | "zamtel";

/**
 * Currencies supported by the Lenco integration.
 * - ZMW: Zambian Kwacha
 * - MWK: Malawian Kwacha
 * - USD: United States Dollar
 */
export type Currency = "ZMW" | "MWK" | "USD";

/**
 * Indicates which party absorbs the Lenco transaction fee.
 * - 'merchant': The merchant pays the fee (customer pays face value).
 * - 'customer': The customer pays the fee (fee is added to customer's total).
 */
export type FeeBearer = "merchant" | "customer";

/**
 * Supported payment methods for transaction initiation.
 * - 'mobile_money': Collection via mobile money STK push.
 * - 'card': Collection via credit/debit card.
 */
export type PaymentMethod = "mobile_money" | "card";

/**
 * Payload interface for initiating a Mobile Money STK push collection.
 */
export interface InitiateMobileMoneyPayload {
  /** The payment amount in standard currency units (e.g. 10.50) */
  amount: number;
  
  /** The currency of the transaction (ZMW, MWK, USD) */
  currency: Currency;
  
  /** Unique merchant transaction reference used to track the payment status */
  reference: string;
  
  /** Customer mobile phone number in local or international format */
  phoneNumber: string;
  
  /** The mobile network operator facilitating the payment */
  operator: MobileOperator;
  
  /** Which party bears the Lenco transaction fee */
  bearer: FeeBearer;
  
  /** Optional transaction description to show on the receipt or portal */
  description?: string;
  
  /** Optional customer full name */
  customerName?: string;
  
  /** Optional customer email address */
  customerEmail?: string;
  
  /** Optional country code ('zm' or 'mw'). If omitted, will be derived automatically. */
  country?: "zm" | "mw";
}

/**
 * Payload interface for initiating a card payment flow.
 */
export interface InitiateCardPayload {
  /** The payment amount in standard currency units */
  amount: number;
  
  /** The currency of the transaction (ZMW, MWK, USD) */
  currency: Currency;
  
  /** Unique merchant transaction reference */
  reference: string;
  
  /** Optional transaction description */
  description?: string;
  
  /** Optional customer full name */
  customerName?: string;
  
  /** Optional customer email address */
  customerEmail?: string;
  
  /** Optional URL redirect callback after card payment completes */
  callbackUrl?: string;
}

/**
 * Standard envelope structure for all Lenco API responses.
 * 
 * @template T The type of the inner data payload.
 */
export interface LencoResponse<T = unknown> {
  /** Indicates whether the operation was successful */
  status: boolean;
  
  /** Explanatory message or error detail from the API */
  message: string;
  
  /** Response payload returned by Lenco's API when successful */
  data?: T;
}

/**
 * Detailed transaction status representation returned by Lenco's status endpoints.
 */
export interface PaymentStatusData {
  /** The unique merchant transaction reference */
  reference: string;
  
  /** The current status of the payment transaction */
  status: "pending" | "processing" | "successful" | "failed" | "cancelled" | "pay-offline";
  
  /** The payment amount in standard units */
  amount: number;
  
  /** The currency of the payment */
  currency: Currency;
  
  /** Customer's name, if provided */
  customerName?: string;
  
  /** Transaction description */
  description?: string;
  
  /** ISO date string representing when the transaction was completed */
  paidAt?: string;
  
  /** Reason for the transaction failure, if applicable */
  reasonForFailure?: string;
}

// ─── Internal Helpers & Formatting ───────────────────────────────────────────

/**
 * Prints debug information to the console when in development mode.
 * 
 * @param args Arbitrary arguments to log.
 */
function devLog(...args: unknown[]): void {
  if (IS_DEV) console.log("[Lenco]", ...args);
}

/**
 * Derives the two-letter ISO country code from the currency or phone number.
 * 
 * - If the phone number starts with '+265' or '265', country is derived as 'mw'.
 * - If the phone number starts with '+260' or '260', country is derived as 'zm'.
 * - Otherwise, falls back to currency mapping:
 *   - 'MWK' -> 'mw'
 *   - 'ZMW' -> 'zm'
 *   - 'USD' -> 'zm'
 * 
 * @param currency The transaction currency.
 * @param phoneNumber Optional customer's phone number.
 * @returns The derived country code ('zm' or 'mw').
 */
export function deriveCountry(currency: Currency, phoneNumber?: string): "zm" | "mw" {
  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith("265")) {
      return "mw";
    }
    if (cleanPhone.startsWith("260")) {
      return "zm";
    }
  }

  switch (currency) {
    case "MWK":
      return "mw";
    case "ZMW":
    case "USD":
    default:
      return "zm";
  }
}

/**
 * Normalizes and formats a phone number based on the target country rules.
 * 
 * Zambia ('zm'):
 * - Local formats (09xxxxxxxx, 07xxxxxxxx) are formatted to 2609xxxxxxxx / 2607xxxxxxxx.
 * - Nine-digit numbers (9xxxxxxxx, 7xxxxxxxx) are formatted to 2609xxxxxxxx / 2607xxxxxxxx.
 * - International formats (already starting with 260) are preserved (removing leading '+' if present).
 * 
 * Malawi ('mw'):
 * - Local formats (08xxxxxxxx, 09xxxxxxxx) are formatted to 2658xxxxxxxx / 2659xxxxxxxx.
 * - Nine-digit numbers (8xxxxxxxx, 9xxxxxxxx) are formatted to 2658xxxxxxxx / 2659xxxxxxxx.
 * - International formats (already starting with 265) are preserved (removing leading '+' if present).
 * 
 * @param phoneNumber The raw phone number input.
 * @param country The target country code ('zm' or 'mw').
 * @returns The normalized phone number string consisting of digits only.
 */
export function formatPhoneNumber(phoneNumber: string, country: "zm" | "mw"): string {
  const digits = phoneNumber.replace(/\D/g, "");

  if (country === "mw") {
    if (digits.startsWith("265") && digits.length === 12) {
      return digits;
    }
    if (digits.startsWith("0") && digits.length === 10) {
      return `265${digits.substring(1)}`;
    }
    if ((digits.startsWith("8") || digits.startsWith("9")) && digits.length === 9) {
      return `265${digits}`;
    }
    if (digits.length === 9) {
      return `265${digits}`;
    }
    return digits;
  } else {
    // Default country is Zambia (zm)
    if (digits.startsWith("260") && digits.length === 12) {
      return digits;
    }
    if (digits.startsWith("0") && digits.length === 10) {
      return `260${digits.substring(1)}`;
    }
    if ((digits.startsWith("7") || digits.startsWith("9")) && digits.length === 9) {
      return `260${digits}`;
    }
    if (digits.length === 9) {
      return `260${digits}`;
    }
    return digits;
  }
}

/**
 * Sends a signed request to the Lenco API.
 * Handles parsing, HTTP status checks, non-JSON response types, and network exceptions.
 * 
 * @template T The expected type of the response payload.
 * @param endpoint The Lenco API path relative to the base URL.
 * @param method The HTTP method (GET or POST).
 * @param body Optional request body object.
 * @returns A promise resolving to a structured LencoResponse envelope.
 */
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

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("[Lenco] Non-JSON response:", text);
      const errMessage = text.trim() || res.statusText || `HTTP ${res.status}`;
      return {
        status: false,
        message: res.ok 
          ? "Invalid JSON response from payment provider" 
          : `HTTP error ${res.status}: ${errMessage}`,
      };
    }

    if (!res.ok) {
      const errObj = json as Record<string, unknown> | null;
      const errMessage = String(errObj?.message || errObj?.error || `HTTP error ${res.status}`);
      return {
        status: false,
        message: errMessage,
        data: errObj?.data || json,
      } as LencoResponse<T>;
    }

    return json as LencoResponse<T>;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Lenco] Fetch error:", error);
    return {
      status: false,
      message: `Network error: ${message}`,
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initiates a Mobile Money STK push collection request via Lenco.
 * 
 * The function derives the correct destination country, formats the recipient
 * phone number to the correct regional international format, and posts to Lenco's
 * mobile money endpoint.
 * 
 * @param payload The Mobile Money transaction details.
 * @returns A promise resolving to a LencoResponse containing payment status details.
 */
export async function initiateMobileMoneyPayment(
  payload: InitiateMobileMoneyPayload
): Promise<LencoResponse<PaymentStatusData>> {
  const { phoneNumber, country: explicitCountry, ...rest } = payload;
  const country = explicitCountry || deriveCountry(payload.currency, phoneNumber);
  const formattedPhone = formatPhoneNumber(phoneNumber, country);

  return lencoFetch<PaymentStatusData>("/collections/mobile-money", "POST", {
    ...rest,
    phone: formattedPhone,
    country,
  });
}

/**
 * Standardizes and builds the configuration object for the Lenco Inline Widget.
 * 
 * Card details are processed directly on PCI-DSS servers via Lenco's SDK on the client side,
 * maintaining security and compliance.
 * 
 * @param payload The card payment details, plus the merchant's public API key.
 * @returns A configuration object suitable for passing to `LencoPay.getPaid()`.
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
 * Initiates a hosted checkout (redirect-based) payment link.
 * 
 * This redirects the customer to a secure checkout portal hosted by Lenco.
 * 
 * @param payload The checkout payload containing amounts and customer info.
 * @returns A promise resolving to the payment URL and reference details.
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

/**
 * Queries the current payment status of a transaction by its reference code.
 * 
 * @param reference The unique merchant reference code of the transaction.
 * @returns A promise resolving to the transaction's current status information.
 */
export async function getPaymentStatus(
  reference: string
): Promise<LencoResponse<PaymentStatusData>> {
  return lencoFetch<PaymentStatusData>(`/collections/status/${reference}`);
}

/**
 * Generates a unique, URL-safe and collision-resistant payment reference string.
 * 
 * @param prefix Optional prefix to prepend to the reference (defaults to 'PAY').
 * @returns A unique reference string.
 */
export function generateReference(prefix = "PAY"): string {
  const ts     = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${ts}-${random}`;
}
