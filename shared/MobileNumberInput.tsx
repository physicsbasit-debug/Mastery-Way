import React, { useEffect, useMemo, useState } from 'react';
import { toLatinDigits } from './numberFormat';

export type MobileNumericValue = number | '';

export function normalizeNumericText(value: string): string {
  return toLatinDigits(value)
    .replace(/[٫٬]/g, '.')
    .replace(/,/g, '.')
    .replace(/[^0-9.\-]/g, '')
    .replace(/(?!^)-/g, '')
    .replace(/(\..*)\./g, '$1');
}

export function parseMobileNumericInput(value: string): MobileNumericValue | null {
  const normalized = normalizeNumericText(value).trim();
  if (normalized === '') return '';
  if (normalized === '-' || normalized === '.' || normalized === '-.') return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function toInputValue(value: MobileNumericValue): string {
  return value === '' ? '' : toLatinDigits(value);
}

export function isHalfStep(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value * 2 - Math.round(value * 2)) < 0.000001;
}

export function isValidStepValue(value: number, step?: number | 'any'): boolean {
  if (!step || step === 0 || step === 'any') return true;
  const divided = value / Number(step);
  return Math.abs(divided - Math.round(divided)) < 0.000001;
}

export interface MobileNumberInputProps {
  value: MobileNumericValue;
  onChange: (value: MobileNumericValue) => void;
  label?: string;
  compact?: boolean;
  min?: number;
  max?: number;
  step?: number | 'any';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaInvalid?: boolean;
  title?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
}

export function MobileNumberInput({
  value,
  onChange,
  label,
  compact,
  min,
  max,
  step,
  placeholder,
  className = 'block text-sm',
  inputClassName = 'w-full rounded-xl border border-slate-200 px-3 py-2',
  ariaInvalid,
  title,
  disabled,
  align = 'start',
}: MobileNumberInputProps) {
  const [draft, setDraft] = useState(() => toInputValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(toInputValue(value));
  }, [focused, value]);

  const textAlignClass = useMemo(() => {
    if (align === 'center') return 'text-center';
    if (align === 'end') return 'text-left';
    return 'text-right';
  }, [align]);

  const handleChange = (rawValue: string) => {
    const normalized = normalizeNumericText(rawValue);
    setDraft(normalized);
    const parsed = parseMobileNumericInput(normalized);
    if (parsed === null) return;
    if (typeof parsed === 'number') {
      if (typeof min === 'number' && parsed < min) {
        onChange(parsed);
        return;
      }
      if (typeof max === 'number' && parsed > max) {
        onChange(parsed);
        return;
      }
    }
    onChange(parsed);
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseMobileNumericInput(draft);
    if (parsed === null) {
      setDraft(toInputValue(value));
      return;
    }
    setDraft(toInputValue(parsed));
  };

  const input = (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      enterKeyHint="done"
      dir="ltr"
      value={draft}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      title={title}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onChange={(event) => handleChange(event.target.value)}
      className={`${inputClassName} ${textAlignClass}`}
    />
  );

  if (!label && compact) return input;

  return (
    <label className={className}>
      {label ? <span className={compact ? 'sr-only' : 'mb-1 block font-bold text-slate-600'}>{label}</span> : null}
      {input}
    </label>
  );
}
