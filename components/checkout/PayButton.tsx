"use client";

interface PayButtonProps {
  amount: string;
  currencySymbol: string;
  method: "mobile_money" | "card";
  loading: boolean;
  disabled?: boolean;
}

export default function PayButton({ amount, currencySymbol, method, loading, disabled }: PayButtonProps) {
  const displayText = method === "card" ? "Open Secure Checkout" : `Pay ${currencySymbol}${amount || "0.00"}`;

  return (
    <button
      id="submit-payment"
      type="submit"
      disabled={loading || disabled}
      className="sp-pay-btn w-full py-4 rounded-xl text-lg font-medium flex items-center justify-center gap-2 relative overflow-hidden group"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {loading ? (
        <>
          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>{displayText}</span>
        </>
      )}
    </button>
  );
}
