/**
 * /api/status/[reference]/stream
 *
 * Server-Sent Events (SSE) streaming endpoint.
 *
 * When a client subscribes, the server holds the connection open and pushes
 * real-time payment status updates as `data:` events.  When the payment
 * reaches a terminal state (successful | failed | cancelled) the stream is
 * closed automatically.
 *
 * Fallback: if the client cannot reach this endpoint it should degrade
 * gracefully to the existing adaptive-polling mechanism.
 */

import { NextRequest } from "next/server";
import { paymentEmitter, PaymentStatusEvent } from "@/lib/payment-emitter";

/** Terminal statuses that close the stream */
const TERMINAL = new Set(["successful", "failed", "cancelled"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;

  if (!reference) {
    return new Response("Missing reference", { status: 400 });
  }

  const encoder = new TextEncoder();

  /**
   * ReadableStream that holds the SSE connection open.
   * The stream controller is passed to the event emitter so incoming webhook
   * updates can push data to the connected client.
   */
  const stream = new ReadableStream({
    start(controller) {
      /** Helper — format a payload as an SSE data line */
      const send = (event: PaymentStatusEvent) => {
        const chunk = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(chunk));

        // Close the stream if we have reached a terminal status
        if (TERMINAL.has(event.status.toLowerCase())) {
          try {
            controller.close();
          } catch {
            // Already closed — ignore
          }
          unsubscribe();
        }
      };

      // Send an initial heartbeat so the client knows the connection is live
      const heartbeat = `data: ${JSON.stringify({ reference, status: "connected" })}\n\n`;
      controller.enqueue(encoder.encode(heartbeat));

      // Register with the shared emitter
      const unsubscribe = paymentEmitter.subscribe(reference, send);

      // Clean up if the client disconnects before a terminal event
      _req.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering for SSE
    },
  });
}
