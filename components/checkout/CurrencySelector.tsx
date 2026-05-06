"use client";

export type Currency = "ZMW" | "MWK" | "USD";

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "ZMW", label: "ZMW" },
  { value: "MWK", label: "MWK" },
  { value: "USD", label: "USD" },
];

interface CurrencySelectorProps {
  value: Currency;
  onChange: (c: Currency) => void;
}

export default function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <div>
      <p className="text-label-caps text-on-surface-variant mb-2">Currency</p>
      <div className="flex gap-2">
        {CURRENCIES.map((c) => (
          <button
            key={c.value}
            type="button"
            id={`currency-${c.value.toLowerCase()}`}
            onClick={() => onChange(c.value)}
            className={[
              "sp-chip px-4 py-2 rounded-lg text-sm font-medium",
              value === c.value ? "active" : "",
            ].join(" ")}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
