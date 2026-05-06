"use client";

export type Operator = "airtel" | "mtn" | "zamtel";

const OPERATORS: { value: Operator; label: string; color: string; bg: string }[] = [
  { value: "airtel", label: "Airtel", color: "#ffffff", bg: "var(--airtel)" },
  { value: "mtn", label: "MTN", color: "#000000", bg: "var(--mtn)" },
  { value: "zamtel", label: "Zamtel", color: "#ffffff", bg: "var(--zamtel)" },
];

interface OperatorSelectorProps {
  value: Operator;
  onChange: (op: Operator) => void;
}

export default function OperatorSelector({ value, onChange }: OperatorSelectorProps) {
  return (
    <div>
      <p className="text-label-caps text-on-surface-variant mb-3">Network Operator</p>
      <div className="grid grid-cols-3 gap-3">
        {OPERATORS.map((op) => (
          <button
            key={op.value}
            id={`op-${op.value}`}
            type="button"
            onClick={() => onChange(op.value)}
            className={[
              "flex flex-col items-center gap-3 py-4 rounded-xl border transition-all text-sm font-medium",
              value === op.value
                ? "border-2 border-primary bg-white/90 shadow-sm text-primary"
                : "border-outline-variant bg-white/70 text-on-surface-variant hover:border-primary hover:text-primary",
            ].join(" ")}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
              style={{ background: op.bg, color: op.color }}
            >
              {op.label.slice(0, 3).toUpperCase()}
            </div>
            <span>{op.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
