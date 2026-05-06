"use client";

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  return (
    <div>
      <label htmlFor="phone" className="text-label-caps text-on-surface-variant block mb-2">
        Phone Number
      </label>
      <input
        id="phone"
        type="tel"
        placeholder="+260 97 000 0000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="sp-input w-full px-4 py-3.5 text-sm disabled:opacity-50"
        required
      />
    </div>
  );
}
