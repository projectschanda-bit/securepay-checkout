/**
 * payment-emitter.ts
 *
 * A globalThis-scoped EventEmitter singleton for broadcasting real-time
 * payment status updates across Next.js route handlers.
 *
 * We attach the instance to `globalThis` so that it survives hot-module
 * reloads during development without creating multiple emitters.
 *
 * Usage:
 *   import { paymentEmitter } from "@/lib/payment-emitter";
 *   paymentEmitter.emit(reference, update);   // webhook side
 *   paymentEmitter.subscribe(reference, cb);  // SSE stream side
 */

import { EventEmitter } from "events";

/** Shape of a payment status event pushed through the emitter */
export interface PaymentStatusEvent {
  reference: string;
  status: string;
  amount?: number;
  currency?: string;
  customerName?: string;
  reasonForFailure?: string;
  paidAt?: string;
}

// ── Singleton ──────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __paymentEmitter: PaymentEmitter | undefined;
}

class PaymentEmitter {
  private readonly emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Allow many concurrent listeners (one per active SSE connection)
    this.emitter.setMaxListeners(200);
  }

  /**
   * Publish a payment status update for a given reference.
   * All active SSE streams subscribed to this reference will receive it.
   */
  emit(reference: string, event: PaymentStatusEvent): void {
    this.emitter.emit(`payment:${reference}`, event);
  }

  /**
   * Subscribe to status updates for a given reference.
   * Returns an unsubscribe function — call it when the SSE connection closes.
   */
  subscribe(
    reference: string,
    listener: (event: PaymentStatusEvent) => void
  ): () => void {
    const eventName = `payment:${reference}`;
    this.emitter.on(eventName, listener);
    return () => this.emitter.off(eventName, listener);
  }
}

// Attach to globalThis so the same instance survives HMR in dev
if (!globalThis.__paymentEmitter) {
  globalThis.__paymentEmitter = new PaymentEmitter();
}

export const paymentEmitter = globalThis.__paymentEmitter;
