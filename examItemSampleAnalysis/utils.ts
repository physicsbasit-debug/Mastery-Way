export function roundTo(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
}

export function safePercent(numerator: number, denominator: number, digits = 1): number {
  if (!denominator || !Number.isFinite(denominator)) return 0;
  return roundTo((numerator / denominator) * 100, digits);
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function getCurrentAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const start = month >= 9 ? year : year - 1;
  return `${start}/${start + 1} م`;
}

export function getTodayISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
