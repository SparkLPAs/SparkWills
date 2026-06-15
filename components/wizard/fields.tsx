"use client";

import { useId, useState, type ReactNode } from "react";

const inputClass =
  "mt-1 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-navy-900 placeholder:text-navy-300 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-navy-800">
        {label}
        {optional && <span className="ml-1 text-navy-400">(optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-navy-500">{hint}</span>}
      {error && (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      )}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      {...rest}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={inputClass}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-navy-300 text-navy-800 focus:ring-navy-500"
      />
      <label htmlFor={id} className="text-sm text-navy-800">
        {label}
        {hint && <span className="mt-0.5 block text-xs text-navy-500">{hint}</span>}
      </label>
    </div>
  );
}

/** Expandable inline explanation of a legal term. */
export function InfoBox({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-cream-300 bg-cream-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-navy-700"
        aria-expanded={open}
      >
        <span>
          <span className="mr-2 text-navy-400">ⓘ</span>
          {term}
        </span>
        <span className="text-navy-400">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-cream-300 px-3 py-2 text-sm leading-relaxed text-navy-700">
          {children}
        </div>
      )}
    </div>
  );
}
