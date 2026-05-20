"use client";

import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────
   Types
───────────────────────────────────────────────── */
interface StatusData {
  status: boolean;
  message?: string;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    customerName?: string;
    description?: string;
  };
}

interface LencoPaymentStatusProps {
  reference: string;
  onRestart?: () => void;
}

/* ─────────────────────────────────────────────────
   Status display config
───────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  icon: string; label: string;
  color: string; bg: string; border: string; glow: string;
}> = {
  successful: { icon: "check_circle", label: "Payment Successful", color: "#16a34a", bg: "#f0fdf4", border: "#86efac", glow: "rgba(22,163,74,0.18)" },
  failed:     { icon: "cancel",       label: "Payment Failed",     color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", glow: "rgba(220,38,38,0.15)" },
  cancelled:  { icon: "cancel",       label: "Payment Cancelled",  color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", glow: "rgba(220,38,38,0.15)" },
  pending:    { icon: "schedule",     label: "Processing Payment", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", glow: "rgba(217,119,6,0.15)" },
  processing: { icon: "autorenew",   label: "Verifying Payment",  color: "#4f46e5", bg: "#eef2ff", border: "#a5b4fc", glow: "rgba(79,70,229,0.15)" },
};

/* ─────────────────────────────────────────────────
   Adaptive poll schedule — used only as SSE fallback
   Fast at first, backs off gently if still pending
───────────────────────────────────────────────── */
const POLL_SCHEDULE = [800, 1200, 1500, 1800, 2000, 2500, 2500, 3000, 3000, 3000];
const MAX_POLLS = 24;
const TERMINAL = new Set(["successful", "failed", "cancelled"]);

/* ─────────────────────────────────────────────────
   Component
───────────────────────────────────────────────── */
export function LencoPaymentStatus({ reference, onRestart }: LencoPaymentStatusProps) {
  const [data, setData]       = useState<StatusData | null>(null);
  const [polls, setPolls]     = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [entered, setEntered] = useState(false);
  const [syncMode, setSyncMode] = useState<"sse" | "polling" | "idle">("idle");

  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef   = useRef(0);
  const doneRef        = useRef(false);
  const esRef          = useRef<EventSource | null>(null);

  /* ── Elapsed ticker ── */
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, []);

  /* ── Entrance animation: fires on ANY first data receipt ── */
  useEffect(() => {
    if (data !== null && !entered) {
      const t = setTimeout(() => setEntered(true), 60);
      return () => clearTimeout(t);
    }
  }, [data, entered]);

  /* ── SSE + Polling loop ── */
  useEffect(() => {
    if (!reference) return;

    /* ────────── Adaptive polling fallback ────────── */
    function startPolling() {
      setSyncMode("polling");

      async function poll() {
        if (doneRef.current) return;
        try {
          const res  = await fetch(`/api/status/${reference}`, { cache: "no-store" });
          const json: StatusData = await res.json();
          setData(json);

          const st   = json.data?.status?.toLowerCase() ?? "";
          if (TERMINAL.has(st)) {
            doneRef.current = true;
            if (elapsedRef.current) clearInterval(elapsedRef.current);
            return;
          }

          if (pollCountRef.current < MAX_POLLS) {
            const delay = POLL_SCHEDULE[Math.min(pollCountRef.current, POLL_SCHEDULE.length - 1)];
            pollCountRef.current += 1;
            setPolls(pollCountRef.current);
            timerRef.current = setTimeout(poll, delay);
          }
        } catch {
          if (pollCountRef.current < MAX_POLLS && !doneRef.current) {
            const delay = POLL_SCHEDULE[Math.min(pollCountRef.current, POLL_SCHEDULE.length - 1)];
            pollCountRef.current += 1;
            setPolls(pollCountRef.current);
            timerRef.current = setTimeout(poll, delay);
          } else if (!doneRef.current) {
            setData({ status: false, message: "Could not reach the payment server." });
          }
        }
      }

      poll();
    }

    /* ────────── SSE (primary path) ────────── */
    function startSSE() {
      if (!("EventSource" in window)) {
        // Browser doesn't support SSE — fall back immediately
        startPolling();
        return;
      }

      setSyncMode("sse");

      const es = new EventSource(`/api/status/${reference}/stream`);
      esRef.current = es;

      // Timeout: if we don't get a real status event in 8 s, switch to polling
      const sseTimeout = setTimeout(() => {
        es.close();
        if (!doneRef.current) startPolling();
      }, 8000);

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            reference: string;
            status: string;
            amount?: number;
            currency?: string;
            customerName?: string;
          };

          // Ignore the initial heartbeat "connected" event
          if (payload.status === "connected") return;

          // Clear the fallback timeout — SSE is alive and delivering data
          clearTimeout(sseTimeout);

          // Map SSE event into the same StatusData shape the UI expects
          setData({
            status: true,
            data: {
              status:       payload.status,
              amount:       payload.amount,
              currency:     payload.currency,
              reference:    payload.reference,
              customerName: payload.customerName,
            },
          });

          if (TERMINAL.has(payload.status.toLowerCase())) {
            doneRef.current = true;
            if (elapsedRef.current) clearInterval(elapsedRef.current);
            es.close();
          }
        } catch {
          // Malformed SSE event — ignore
        }
      };

      es.onerror = () => {
        clearTimeout(sseTimeout);
        es.close();
        esRef.current = null;
        // SSE connection dropped — activate polling fallback
        if (!doneRef.current) startPolling();
      };
    }

    // Kick-off: try SSE first
    startSSE();

    return () => {
      // Cleanup
      if (timerRef.current)   clearTimeout(timerRef.current);
      if (esRef.current)      { esRef.current.close(); esRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  /* ─────────────────────────────────────────────
     LOADING STATE  (no data yet)
  ───────────────────────────────────────────── */
  if (data === null) {
    return (
      <div className="glass-panel ambient-shadow rounded-2xl border border-white/60 px-10 py-12 flex flex-col items-center gap-7">

        {/* ── Triple-ring loader ── */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outermost: slow opacity pulse */}
          <div
            className="absolute inset-0 rounded-full border border-primary/25 animate-ping"
            style={{ animationDuration: "2.2s" }}
          />
          {/* Mid: CW spin */}
          <div
            className="absolute inset-3 rounded-full border-[3px] border-primary/15 border-t-primary/70 animate-spin"
            style={{ animationDuration: "1.3s" }}
          />
          {/* Inner: CCW spin */}
          <div
            className="absolute inset-7 rounded-full border-2 border-indigo-300/30 border-b-indigo-400/80 animate-spin"
            style={{ animationDuration: "0.85s", animationDirection: "reverse" }}
          />
          {/* Core icon */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
          </div>
        </div>

        {/* ── Text ── */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-headline-sm font-semibold text-on-surface tracking-tight">
            Verifying with your bank…
          </p>
          <p className="text-body-sm text-on-surface-variant">
            Checking payment status&nbsp;&middot;&nbsp;
            <span className="font-mono font-medium">{elapsed}s</span>
          </p>
          {/* Sync mode badge */}
          <span className={[
            "mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            syncMode === "sse"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200",
          ].join(" ")}>
            <span className={[
              "w-1.5 h-1.5 rounded-full",
              syncMode === "sse" ? "bg-emerald-500" : "bg-amber-400",
            ].join(" ")} />
            {syncMode === "sse" ? "Live stream" : "Polling"}
          </span>
        </div>

        {/* ── Bouncing dots ── */}
        <div className="flex gap-2.5 items-end h-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/70"
              style={{
                animation: `dot-bounce 1.3s ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>

        {/* ── Reference ── */}
        <p className="font-mono text-[10px] tracking-widest text-on-surface-variant/50 bg-surface-container/60 px-3 py-1 rounded-full">
          {reference}
        </p>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     RESULT STATE
  ───────────────────────────────────────────── */
  const txStatus = data?.data?.status?.toLowerCase() ?? "pending";
  const cfg      = STATUS_CONFIG[txStatus] ?? STATUS_CONFIG.pending;
  const isSuccess = txStatus === "successful";
  const isFailed  = txStatus === "failed" || txStatus === "cancelled";
  const isPending = !isSuccess && !isFailed;

  return (
    <div
      className="glass-panel ambient-shadow rounded-2xl border border-white/60 overflow-hidden"
      style={{
        animation: entered
          ? "result-slide-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards"
          : undefined,
        opacity: entered ? undefined : 0,
      }}
    >
      {/* ── Status header ── */}
      <div
        className="flex flex-col items-center gap-5 py-12 px-10 border-b border-white/40"
        style={{ background: `linear-gradient(150deg, ${cfg.bg} 0%, rgba(255,255,255,0.85) 100%)` }}
      >
        {/* Icon circle */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background:  `${cfg.color}18`,
            border:      `2px solid ${cfg.border}`,
            boxShadow:   `0 0 40px ${cfg.glow}, 0 0 0 8px ${cfg.color}08`,
          }}>
          {/* Ping ring for success */}
          {isSuccess && (
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: `${cfg.color}12`, animationDuration: "2s" }}
            />
          )}
          <span
            className="material-symbols-outlined relative z-10"
            style={{
              fontSize: 46,
              color:    cfg.color,
              fontVariationSettings: "'FILL' 1",
              animation: isSuccess
                ? "icon-bounce-in 0.55s cubic-bezier(0.34,1.56,0.64,1)"
                : isPending
                  ? "spin 1.4s linear infinite"
                  : undefined,
            }}>
            {cfg.icon}
          </span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-headline-md font-bold" style={{ color: cfg.color }}>
            {cfg.label}
          </h1>
          {data?.message && (
            <p className="text-body-sm text-on-surface-variant max-w-xs">{data.message}</p>
          )}
        </div>
      </div>

      {/* ── Details ── */}
      <div className="px-8 py-6 flex flex-col gap-0">
        {data?.data && (
          <>
            {data.data.reference && (
              <DetailRow label="Reference" value={data.data.reference} mono />
            )}
            {data.data.amount != null && (
              <DetailRow label="Amount" value={`${data.data.currency ?? ""} ${data.data.amount}`} />
            )}
            {data.data.customerName && (
              <DetailRow label="Customer" value={data.data.customerName} />
            )}
          </>
        )}

        {/* Pending inline status */}
        {isPending && (
          <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60">
            <div className="w-7 h-7 rounded-full border-2 border-amber-300 border-t-amber-500 animate-spin shrink-0"
              style={{ animationDuration: "0.9s" }} />
            <div>
              <p className="text-body-sm font-semibold text-amber-800">Still processing…</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                {syncMode === "sse"
                  ? "Listening for live update"
                  : `Attempt ${polls} of ${MAX_POLLS}`}
                &nbsp;&middot;&nbsp;{elapsed}s elapsed
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="px-8 pb-8 flex flex-col gap-3">
        {(isSuccess || isFailed) && (
          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-xl bg-primary text-on-primary text-body-md font-medium shadow-md hover:opacity-90 hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">
              {isSuccess ? "add_circle" : "refresh"}
            </span>
            {isSuccess ? "Make Another Payment" : "Try Again"}
          </button>
        )}
        <a
          href="/"
          className="w-full py-3 rounded-xl border border-outline-variant text-on-surface-variant text-body-md font-medium text-center hover:border-primary hover:text-primary transition-all">
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-component
───────────────────────────────────────────── */
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-3.5 border-b border-outline-variant/20 last:border-0">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <span className={`text-body-sm font-medium text-on-surface ${mono ? "font-mono text-xs bg-surface-container/80 px-2.5 py-1 rounded-lg" : ""
        }`}>
        {value}
      </span>
    </div>
  );
}
