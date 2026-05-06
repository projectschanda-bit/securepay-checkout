"use client";

import { useState, useEffect } from "react";
import BackgroundSlash from "./BackgroundSlash";
import CurrencySelector, { Currency } from "./CurrencySelector";
import AmountInput from "./AmountInput";
import MethodSelector, { PaymentMethod } from "./MethodSelector";
import OperatorSelector, { Operator } from "./OperatorSelector";
import PhoneInput from "./PhoneInput";
import PayButton from "./PayButton";
import PaymentSummary from "./PaymentSummary";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ZMW: "K",
  MWK: "MK",
  USD: "$",
};

export default function CheckoutPage() {
  const [currency, setCurrency] = useState<Currency>("ZMW");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [operator, setOperator] = useState<Operator>("airtel");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [paymentRef, setPaymentRef] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (paymentStatus === "processing" && paymentRef) {
      const startTime = Date.now();
      const MAX_POLLING_TIME = 2 * 60 * 1000; // 2 minutes timeout

      intervalId = setInterval(async () => {
        try {
          if (Date.now() - startTime > MAX_POLLING_TIME) {
            setPaymentStatus("failed");
            setStatusMessage("Payment session expired. Please check your signal and try again.");
            clearInterval(intervalId);
            return;
          }

          const res = await fetch(`/api/status/${paymentRef}`);
          const data = await res.json();
          if (data.status === true && data.data) {
            const status = data.data.status;
            if (status === "successful") {
              setPaymentStatus("success");
              setStatusMessage("Payment received successfully!");
              clearInterval(intervalId);
            } else if (status === "failed" || status === "cancelled" || status === "pay-offline") {
              setPaymentStatus("failed");
              setStatusMessage(data.data.reasonForFailure || "Payment failed or was cancelled.");
              clearInterval(intervalId);
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    }

    return () => clearInterval(intervalId);
  }, [paymentStatus, paymentRef]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount to pay.");
      return;
    }
    if (method === "mobile_money" && !phoneNumber) {
      setError("Please enter your phone number.");
      return;
    }
    if (method === "card" && (!customerName || !customerEmail)) {
      setError("Please provide your name and email for the card receipt.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lenco/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          amount,
          currency,
          phoneNumber,
          operator,
          customerName,
          customerEmail,
        }),
      });

      const data = await res.json();

      if (!data.status) {
        setError(data.message || "Payment initiation failed.");
        return;
      }

      if (method === "mobile_money") {
        setPaymentRef(data.reference);
        setPaymentStatus("processing");
      } else if (method === "card") {
        if (typeof window !== "undefined" && (window as any).LencoPay) {
          (window as any).LencoPay.getPaid(data.widgetConfig);
        } else {
          setError("Lenco payment widget is not loaded.");
        }
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancelled");
  };

  return (
    <div className="sp-page-bg">
      <BackgroundSlash />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8 md:p-8">
        <div className="sp-card w-full max-w-[900px] flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT: Form Section */}
          <div className="flex-1 p-6 md:p-10 lg:p-12">
            {paymentStatus === "idle" ? (
              <>
                <h1 className="text-[22px] font-medium text-on-surface mb-2">Make a payment</h1>
                <p className="text-sm text-on-surface-variant mb-8">
                  Secure transaction powered by Lenco BroadPay
                </p>

                <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
                  <CurrencySelector value={currency} onChange={setCurrency} />
                  
                  <AmountInput
                    currency={currency}
                    value={amount}
                    onChange={setAmount}
                    disabled={loading}
                  />

                  <MethodSelector value={method} onChange={setMethod} />

                  {method === "mobile_money" ? (
                    <div className="sp-fade-in flex flex-col gap-8">
                      <OperatorSelector value={operator} onChange={setOperator} />
                      <PhoneInput value={phoneNumber} onChange={setPhoneNumber} disabled={loading} />
                    </div>
                  ) : (
                    <div className="sp-fade-in flex flex-col gap-6">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          You will be redirected to the secure Lenco checkout gateway. 
                          Your card details are never stored on our servers.
                        </p>
                      </div>
                      <div>
                        <label htmlFor="customerName" className="text-label-caps text-on-surface-variant block mb-2">
                          Full Name *
                        </label>
                        <input
                          id="customerName"
                          type="text"
                          placeholder="John Doe"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="sp-input w-full px-4 py-3.5 text-sm"
                          disabled={loading}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="customerEmail" className="text-label-caps text-on-surface-variant block mb-2">
                          Email Address *
                        </label>
                        <input
                          id="customerEmail"
                          type="email"
                          placeholder="john@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="sp-input w-full px-4 py-3.5 text-sm"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="sp-fade-in p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* Mobile CTA */}
                  <div className="block lg:hidden mt-4">
                    <PayButton
                      amount={amount}
                      currencySymbol={CURRENCY_SYMBOLS[currency]}
                      method={method}
                      loading={loading}
                      disabled={!amount || parseFloat(amount) <= 0}
                    />
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center sp-fade-in">
                {paymentStatus === "processing" && (
                  <>
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6"></div>
                    <h2 className="text-xl font-medium text-on-surface mb-2">Awaiting Payment</h2>
                    <p className="text-sm text-on-surface-variant max-w-[280px]">
                      Please check your mobile phone for an authorization prompt to complete the payment.
                    </p>
                  </>
                )}
                {paymentStatus === "success" && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-6">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-medium text-on-surface mb-2">Payment Successful</h2>
                    <p className="text-sm text-on-surface-variant mb-8">
                      {statusMessage}
                    </p>
                    <button onClick={() => setPaymentStatus("idle")} className="sp-button px-6 py-3">
                      Start New Payment
                    </button>
                  </>
                )}
                {paymentStatus === "failed" && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-medium text-on-surface mb-2">Payment Failed</h2>
                    <p className="text-sm text-on-surface-variant mb-8">
                      {statusMessage}
                    </p>
                    <button onClick={() => setPaymentStatus("idle")} className="sp-button px-6 py-3">
                      Try Again
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Summary Section */}
          <div className="sp-sidebar p-6 md:p-10 lg:p-12 lg:border-l border-primary/10">
            <PaymentSummary
              currency={currency}
              currencySymbol={CURRENCY_SYMBOLS[currency]}
              method={method}
              operator={operator}
              amount={amount}
              loading={loading}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
