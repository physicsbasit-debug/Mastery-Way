const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

const EASTERN_ARABIC_DIGITS: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function normalizeArabicNumerals(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => ARABIC_INDIC_DIGITS[digit] ?? digit)
    .replace(/[۰-۹]/g, (digit) => EASTERN_ARABIC_DIGITS[digit] ?? digit)
    .replace(/٫/g, '.')
    .replace(/٬/g, '')
    .replace(/،/g, ',')
    .replace(/؛/g, ';');
}

export function tokenizeScoresText(rawText: string): string[] {
  const normalized = normalizeArabicNumerals(rawText);
  return normalized
    .split(/[\s,;|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toFiniteNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const normalized = typeof value === 'string' ? normalizeArabicNumerals(value).trim() : value;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatStudentCount(count: number): string {
  if (count === 0) return 'لا يوجد طلاب';
  if (count === 1) return 'طالب واحد';
  if (count === 2) return 'طالبان';
  if (count >= 3 && count <= 10) return `${count} طلاب`;
  return `${count} طالبًا`;
}

export function formatAdditionalStudents(count: number): string {
  if (count === 1) return 'انتقال طالب واحد';
  if (count === 2) return 'انتقال طالبين';
  if (count >= 3 && count <= 10) return `انتقال ${count} طلاب`;
  return `انتقال ${count} طالبًا`;
}

export function formatScoreCount(count: number): string {
  if (count === 0) return 'لا توجد درجات';
  if (count === 1) return 'درجة واحدة';
  if (count === 2) return 'درجتان';
  if (count >= 3 && count <= 10) return `${count} درجات`;
  return `${count} درجة`;
}

export function formatPercentagePointAmount(value: number): string {
  if (value === 1) return 'نقطة مئوية واحدة';
  if (value === 2) return 'نقطتان مئويتان';
  if (Number.isInteger(value) && value >= 3 && value <= 10) return `${value} نقاط مئوية`;
  return `${value} نقطة مئوية`;
}

export function roundPercentagesToHundred(values: number[], decimals: number): number[] {
  if (values.length === 0) return [];
  const rounded = values.map((value) => roundTo(value, decimals));
  const total = roundTo(rounded.reduce((sum, value) => sum + value, 0), decimals);
  const difference = roundTo(100 - total, decimals);
  if (Math.abs(difference) < 10 ** -(decimals + 1)) return rounded;
  const largestIndex = values.reduce((best, value, index) => value > values[best] ? index : best, 0);
  rounded[largestIndex] = roundTo(rounded[largestIndex] + difference, decimals);
  return rounded;
}
