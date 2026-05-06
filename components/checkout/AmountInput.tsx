"use client";

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZMW: "K",
  MWK: "MK",
  USD: "$",
};

interface AmountInputProps {
  currency: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function AmountInput({ currency, value, onChange, disabled }: AmountInputProps) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "K";

  return (
    <div>
      <label htmlFor="amount" className="text-label-caps text-on-surface-variant block mb-2">
        Amount to Pay
      </label>
      <div className="relative flex items-center">
        <span
          aria-hidden="true"
          className="absolute left-4 pointer-events-none select-none text-on-surface-variant font-medium"
          style={{ fontSize: "22px", lineHeight: 1 }}
        >
          {symbol}
        </span>
        <input
          id="amount"
          type="number"
          min="1"
          step="0.01"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            paddingLeft: `${28 + symbol.length * 12}px`,
            fontSize: "28px",
            fontWeight: 500,
          }}
          className="sp-input w-full pr-4 py-4 disabled:opacity-50"
          required
        />
      </div>
    </div>
  );
}
