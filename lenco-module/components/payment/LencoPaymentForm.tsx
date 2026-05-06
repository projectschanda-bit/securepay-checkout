"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Currency      = "ZMW" | "MWK" | "USD";
export type PaymentMethod = "mobile_money" | "card";
export type Operator      = "airtel" | "mtn" | "zamtel";

const CURRENCIES: { value: Currency; symbol: string; label: string }[] = [
  { value: "ZMW", symbol: "K",  label: "ZMW" },
  { value: "MWK", symbol: "MK", label: "MWK" },
  { value: "USD", symbol: "$",  label: "USD" },
];

const OPERATORS: { value: Operator; label: string; color: string; bg: string }[] = [
  { value: "airtel", label: "Airtel",  color: "#fff", bg: "#e63946" },
  { value: "mtn",    label: "MTN",     color: "#000", bg: "#f9c007" },
  { value: "zamtel", label: "Zamtel",  color: "#fff", bg: "#16a34a" },
];

export interface LencoPaymentFormProps {
  fixedAmount?:     number;
  defaultCurrency?: Currency;
  onSuccess?:       (reference: string) => void;
}

export function LencoPaymentForm({
  fixedAmount,
  defaultCurrency = "ZMW",
  onSuccess,
}: LencoPaymentFormProps) {
  const router = useRouter();

  const [currency,      setCurrency]      = useState<Currency>(defaultCurrency);
  const [method,        setMethod]        = useState<PaymentMethod>("mobile_money");
  const [amount,        setAmount]        = useState(fixedAmount ? fixedAmount.toString() : "");
  const [operator,      setOperator]      = useState<Operator>("airtel");
  const [phoneNumber,   setPhoneNumber]   = useState("");
  const [customerName,  setCustomerName]  = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  const cur = CURRENCIES.find((c) => c.value === currency)!;

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount."); return; }
    if (method === "mobile_money" && !phoneNumber) { setError("Phone number is required."); return; }
    if (method === "card") {
      if (!customerName)  { setError("Full name is required for card payments."); return; }
      if (!customerEmail) { setError("Email is required for card payments."); return; }
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, amount, currency, phoneNumber, operator, bearer: "merchant", customerName, customerEmail }),
      });
      const data = await res.json();

      if (!res.ok || !data.status) {
        setError(data.detail?.message || data.message || "Payment initiation failed.");
        return;
      }

      /* Card → Lenco Inline Widget */
      if (method === "card" && data.widgetConfig) {
        const cfg = data.widgetConfig;
        try { await loadLencoScript("https://pay.lenco.co/js/v1/inline.js"); }
        catch { setError("Could not load checkout script. Check your connection."); return; }

        const lp = await waitForLencoPay();
        if (!lp) { setError("Card checkout widget failed to initialise. Refresh and try again."); return; }

        const parts = (cfg.customerName || "").trim().split(/\s+/);
        lp.getPaid({
          key: cfg.publicKey, amount: Number(cfg.amount), currency: cfg.currency,
          reference: cfg.reference, email: cfg.customerEmail, label: cfg.description,
          bearer: cfg.bearer,
          customer: { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" },
          onSuccess: (r: { reference: string }) => router.push(`/status/${r.reference || cfg.reference}`),
          onClose:   () => setLoading(false),
        });
        return;
      }

      /* Mobile Money → status page */
      if (onSuccess) onSuccess(data.reference);
      else router.push(`/status/${data.reference}`);

    } catch { setError("Network error. Check your connection and try again."); }
    finally  { setLoading(false); }
  }

  function loadLencoScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function waitForLencoPay(timeout = 3000): Promise<any | null> {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeout;
      function check() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lp = (window as any).LencoPay;
        if (lp && typeof lp.getPaid === "function") { resolve(lp); return; }
        Date.now() < deadline ? setTimeout(check, 100) : resolve(null);
      }
      check();
    });
  }

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-body-md font-semibold text-on-surface">
            {method === "card" ? "Opening secure checkout…" : "Sending payment prompt…"}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {method === "card" ? "Loading Lenco widget" : "Check your phone"}
          </p>
        </div>
      )}

      {/* Glass card */}
      <div className="glass-panel w-full max-w-4xl mx-auto rounded-xl ambient-shadow border border-white/60 overflow-hidden flex flex-col">

        {/* ── Body: two-column ── */}
        <div className="flex flex-col md:flex-row w-full">

          {/* ── LEFT: Form ── */}
          <div className="w-full md:w-3/5 px-12 py-10 bg-white/40">
            <h1 className="text-headline-lg text-on-surface mb-2">Make a Payment</h1>
            <p className="text-body-md text-on-surface-variant mb-10">
              Enter your details to complete the secure transaction.
            </p>

            <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-7">

              <div>
                <label className="text-label-caps text-on-surface-variant block mb-2">CURRENCY</label>
                <div className="flex bg-white/70 rounded-lg p-1 w-fit border border-outline-variant/30">
                  {CURRENCIES.map((c) => (
                    <button key={c.value} type="button"
                      onClick={() => setCurrency(c.value)}
                      className={[
                        "px-5 py-2 rounded-md text-body-sm font-medium transition-all",
                        currency === c.value
                          ? "bg-on-surface text-surface shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface",
                      ].join(" ")}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {!fixedAmount && (
                <div>
                  <label htmlFor="amount" className="text-label-caps text-on-surface-variant block mb-2">
                    AMOUNT TO PAY
                  </label>
                  <div className="relative flex items-center">
                    <span
                      id="currency-symbol-display"
                      className="absolute left-4 text-headline-md text-on-surface-variant pointer-events-none select-none whitespace-nowrap"
                    >
                      {cur.symbol}
                    </span>
                    <input
                      id="amount"
                      type="number" min="1" step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ paddingLeft: `${16 + cur.symbol.length * 17}px` }}
                      className="w-full pr-4 py-4 border border-outline-variant rounded-xl text-headline-md text-on-surface bg-white/90 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-label-caps text-on-surface-variant block mb-3">PAYMENT METHOD</label>
                <div className="grid grid-cols-2 gap-4">
                  <button id="method-mobile" type="button"
                    onClick={() => setMethod("mobile_money")}
                    className={[
                      "flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-body-md font-medium transition-all",
                      method === "mobile_money"
                        ? "border-2 border-primary bg-white/90 text-primary shadow-sm"
                        : "border border-outline-variant bg-white/70 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-white/90",
                    ].join(" ")}>
                    <span className="material-symbols-outlined text-base">smartphone</span>
                    Mobile Money
                  </button>
                  <button id="method-card" type="button"
                    onClick={() => setMethod("card")}
                    className={[
                      "flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-body-md font-medium transition-all",
                      method === "card"
                        ? "border-2 border-primary bg-white/90 text-primary shadow-sm"
                        : "border border-outline-variant bg-white/70 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-white/90",
                    ].join(" ")}>
                    <span className="material-symbols-outlined text-base">credit_card</span>
                    Card
                  </button>
                </div>
              </div>

              {method === "mobile_money" && (
                <>
                  <div>
                    <label className="text-label-caps text-on-surface-variant block mb-3">NETWORK OPERATOR</label>
                    <div className="grid grid-cols-3 gap-3">
                      {OPERATORS.map((op) => (
                        <button key={op.value} id={`op-${op.value}`} type="button"
                          onClick={() => setOperator(op.value)}
                          className={[
                            "flex flex-col items-center gap-3 py-5 rounded-xl border text-body-sm font-medium transition-all",
                            operator === op.value
                              ? "border-2 border-primary bg-white/90 shadow-sm"
                              : "border-outline-variant bg-white/70 text-on-surface-variant hover:border-primary",
                          ].join(" ")}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                            style={{ background: op.bg, color: op.color }}>
                            {op.label.slice(0, 3).toUpperCase()}
                          </div>
                          <span className="text-on-surface">{op.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-label-caps text-on-surface-variant block mb-2">
                      PHONE NUMBER
                    </label>
                    <input id="phone" type="tel" placeholder="+260 97 000 0000"
                      value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3.5 border border-outline-variant rounded-xl text-body-md text-on-surface bg-white/90 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      required
                    />
                  </div>
                </>
              )}

              {/* Card info banner */}
              {method === "card" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5">lock</span>
                  <p className="text-body-sm text-on-surface-variant">
                    You&apos;ll be redirected to a secure Lenco checkout. Card details are handled entirely by Lenco.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="customerName" className="text-label-caps text-on-surface-variant block mb-2">
                  FULL NAME {method === "card" && <span className="text-error">*</span>}
                </label>
                <input id="customerName" type="text" placeholder="John Doe"
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3.5 border border-outline-variant rounded-xl text-body-md text-on-surface bg-white/90 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="customerEmail" className="text-label-caps text-on-surface-variant block mb-2">
                  EMAIL ADDRESS {method === "card" && <span className="text-error">*</span>}
                </label>
                <input id="customerEmail" type="email" placeholder="john@example.com"
                  value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-outline-variant rounded-xl text-body-md text-on-surface bg-white/90 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>


              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-error-container border border-error/20">
                  <span className="material-symbols-outlined text-error text-base mt-0.5">warning</span>
                  <p className="text-body-sm text-on-error-container">{error}</p>
                </div>
              )}

              {/* Mobile submit */}
              <div className="md:hidden">
                <button id="submit-payment" type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-primary text-on-primary text-body-lg font-medium shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined text-xl">lock_clock</span>
                  {method === "card" ? "Open Secure Checkout" : `Pay ${cur.symbol}${amount || "0.00"}`}
                </button>
              </div>

            </form>
          </div>

          <div className="w-full md:w-2/5 px-10 py-10 bg-white/30 border-l border-white/50 flex flex-col justify-between backdrop-blur-sm">
            <div>
              <h2 className="text-headline-md text-on-surface mb-8">Summary</h2>

              <div className="flex flex-col gap-5 mb-8 pb-8 border-b border-outline-variant/30">
                <SummaryRow label="Currency"       value={currency} />
                <SummaryRow label="Payment Method" value={method === "mobile_money" ? "Mobile Money" : "Card"} />
                {method === "mobile_money" && (
                  <SummaryRow label="Operator" value={operator.charAt(0).toUpperCase() + operator.slice(1)} />
                )}
                <SummaryRow label="Processing Fee" value={`${cur.symbol} 0.00`} />
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-body-lg text-on-surface-variant">Total</span>
                <span className="text-headline-xl text-primary">
                  {cur.symbol}{amount || "0.00"}
                </span>
              </div>

              {/* ── Trust Badges ── */}
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/60 border border-white/80 shadow-inner">
                {/* PCI + SSL row */}
                <div className="flex items-center gap-2">
                  {/* PCI DSS Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold tracking-wide">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                    PCI DSS
                  </span>
                  {/* SSL Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold tracking-wide">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    SSL Secured
                  </span>
                  {/* 256-bit badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold tracking-wide">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                    </svg>
                    256-Bit
                  </span>
                </div>

                {/* Guarantee list */}
                <ul className="flex flex-col gap-1.5 mt-1">
                  {[
                    "Bank-level data encryption",
                    "Zero card data stored",
                    "Fraud detection enabled",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Accepted card icons */}
                <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                  <span className="text-[10px] text-on-surface-variant font-medium mr-1">Accepted:</span>
                  {/* Visa */}
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#1a1f71] text-white text-[9px] font-extrabold tracking-widest h-5">VISA</span>
                  {/* Mastercard */}
                  <span className="relative inline-flex items-center h-5 w-8">
                    <span className="absolute left-0 w-5 h-5 rounded-full bg-[#eb001b] opacity-90" />
                    <span className="absolute left-2.5 w-5 h-5 rounded-full bg-[#f79e1b] opacity-90" />
                  </span>
                  {/* Airtel Money */}
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold h-5">Airtel</span>
                  {/* MTN */}
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-yellow-400 text-black text-[9px] font-bold h-5">MTN</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {/* Desktop CTA */}
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="hidden md:flex w-full py-4 rounded-xl bg-primary text-on-primary text-body-lg font-medium shadow-md hover:opacity-90 hover:shadow-lg transition-all items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="material-symbols-outlined text-xl">lock_clock</span>
                {method === "card" ? "Open Secure Checkout" : `Pay ${cur.symbol}${amount || "0.00"}`}
              </button>

              <div className="mt-5 flex flex-col items-center gap-3">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-label-caps">Secured by Lenco BroadPay</span>
                </div>
                <a href="/" className="text-body-sm text-on-surface-variant hover:text-error underline transition-colors">
                  Cancel Payment
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <span className="text-body-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}
