const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

const EASTERN_ARABIC_DIGITS: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function toLatinDigits(value: string | number): string {
  return String(value)
    .replace(/[٠-٩]/g, (digit) => ARABIC_INDIC_DIGITS[digit] ?? digit)
    .replace(/[۰-۹]/g, (digit) => EASTERN_ARABIC_DIGITS[digit] ?? digit);
}

export function formatLatinNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US-u-nu-latn', {
    useGrouping: false,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatLatinDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return toLatinDigits(value);
  return new Intl.DateTimeFormat('ar-OM-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

export function normalizeDigitsInElement(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeValue) current.nodeValue = toLatinDigits(current.nodeValue);
    current = walker.nextNode();
  }
}
