"use client";

export type PaymentMethod = "mobile_money" | "card";

interface MethodSelectorProps {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}

export default function MethodSelector({ value, onChange }: MethodSelectorProps) {
  return (
    <div>
      <p className="text-label-caps text-on-surface-variant mb-3">Payment Method</p>
      <div className="grid grid-cols-2 gap-3">

        {/* Mobile Money */}
        <button
          id="method-mobile-money"
          type="button"
          onClick={() => onChange("mobile_money")}
          className={[
            "sp-chip-method flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-medium",
            value === "mobile_money" ? "active" : "text-on-surface-variant",
          ].join(" ")}
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 shrink-0"
          >
            <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
            <path
              fillRule="evenodd"
              d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z"
              clipRule="evenodd"
            />
          </svg>
          Mobile Money
        </button>

        {/* Card */}
        <button
          id="method-card"
          type="button"
          onClick={() => onChange("card")}
          className={[
            "sp-chip-method flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-medium",
            value === "card" ? "active" : "text-on-surface-variant",
          ].join(" ")}
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 shrink-0"
          >
            <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
            <path
              fillRule="evenodd"
              d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z"
              clipRule="evenodd"
            />
          </svg>
          Card
        </button>
      </div>
    </div>
  );
}
