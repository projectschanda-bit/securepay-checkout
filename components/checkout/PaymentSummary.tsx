"use client";

import { ReactNode } from "react";
import PayButton from "./PayButton";

interface PaymentSummaryProps {
  currency: string;
  currencySymbol: string;
  method: "mobile_money" | "card";
  operator?: string;
  amount: string;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function PaymentSummary({
  currency,
  currencySymbol,
  method,
  operator,
  amount,
  loading,
  onSubmit,
  onCancel,
}: PaymentSummaryProps) {
  return (
    <div className="w-full lg:w-[280px] shrink-0 flex flex-col justify-between h-full">
      <div>
        <h2 className="text-xl font-semibold text-on-surface mb-6 hidden lg:block">Summary</h2>

        {/* Breakdown */}
        <div className="flex flex-col gap-4 mb-6 pb-6 sp-divider">
          <SummaryRow label="Currency" value={currency} />
          <SummaryRow
            label="Payment Method"
            value={method === "mobile_money" ? "Mobile Money" : "Card"}
          />
          {method === "mobile_money" && operator && (
            <SummaryRow label="Operator" value={operator.charAt(0).toUpperCase() + operator.slice(1)} />
          )}
          <SummaryRow label="Processing Fee" value={`${currencySymbol} 0.00`} />
        </div>

        {/* Total */}
        <div className="flex justify-between items-end mb-8">
          <span className="text-sm text-on-surface-variant font-medium">Total</span>
          <span className="text-[28px] leading-none font-medium text-primary">
            {currencySymbol}{amount || "0.00"}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="sp-badge">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
              PCI DSS
            </span>
            <span className="sp-badge">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL
            </span>
            <span className="sp-badge">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
              256-bit
            </span>
          </div>

          <div className="flex items-center gap-2 pt-4 sp-divider">
            <span className="text-[10px] text-on-surface-variant font-medium mr-1 uppercase">Accepted</span>
            {/* Visa */}
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#1a1f71] text-white text-[9px] font-extrabold tracking-widest h-4">VISA</span>
            {/* Mastercard */}
            <span className="relative inline-flex items-center h-4 w-7">
              <span className="absolute left-0 w-4 h-4 rounded-full bg-[#eb001b] opacity-90" />
              <span className="absolute left-2 w-4 h-4 rounded-full bg-[#f79e1b] opacity-90" />
            </span>
            {/* Airtel Money */}
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#E40000] text-white text-[9px] font-bold h-4">Airtel</span>
            {/* MTN */}
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#F5A623] text-black text-[9px] font-bold h-4">MTN</span>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="hidden lg:block">
          <PayButton
            amount={amount}
            currencySymbol={currencySymbol}
            method={method}
            loading={loading}
            disabled={!amount || parseFloat(amount) <= 0}
          />
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            <span className="text-[11px] font-medium uppercase tracking-wide">Secured by Lenco</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-on-surface-variant hover:text-error transition-colors"
          >
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}
