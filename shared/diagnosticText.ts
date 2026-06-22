import type { DiagnosticConfidence, DiagnosticDecision, FishboneCategory, FishboneDiagnostic, ParetoEntry } from './diagnosticTypes';

function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
}

export function buildParetoEntries<T>(
  rows: T[],
  getLabel: (row: T) => string,
  getValue: (row: T) => number,
  options: { decimals?: number; includeZero?: boolean; note?: (row: T) => string | undefined } = {},
): ParetoEntry[] {
  const decimals = options.decimals ?? 1;
  const sorted = [...rows]
    .map((row) => ({ row, label: getLabel(row), value: Math.max(0, Number(getValue(row)) || 0) }))
    .filter((entry) => options.includeZero ? true : entry.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'ar'));
  const total = sorted.reduce((sum, entry) => sum + entry.value, 0);
  let cumulative = 0;
  return sorted.map((entry, index) => {
    const share = total > 0 ? (entry.value / total) * 100 : 0;
    cumulative += share;
    return {
      label: entry.label,
      value: round(entry.value, 2),
      sharePercent: round(share, decimals),
      cumulativePercent: round(Math.min(100, cumulative), decimals),
      rank: index + 1,
      note: options.note?.(entry.row),
    };
  });
}

export function getParetoTopSummary(entries: ParetoEntry[], valueLabel: string): string {
  if (!entries.length) return `لا توجد قيم ${valueLabel} تستدعي ترتيب أولويات.`;
  const first = entries[0];
  const second = entries[1];
  if (!second) return `أعلى مصدر هو ${first.label} بقيمة ${first.value} ويمثل ${first.sharePercent}% من الإجمالي.`;
  return `أعلى مصدرين هما ${first.label} و${second.label}، ويمثلان معًا ${second.cumulativePercent}% من إجمالي ${valueLabel}.`;
}

export function confidenceFromSignals(options: { lowReliability?: boolean; singleItemSkills?: boolean; completeData?: boolean; strongEvidence?: boolean }): DiagnosticConfidence {
  if (options.lowReliability || !options.completeData) return 'limited';
  if (options.singleItemSkills) return 'cautious';
  if (options.strongEvidence) return 'strong';
  return 'adequate';
}

export function confidenceLabel(confidence: DiagnosticConfidence): string {
  switch (confidence) {
    case 'strong': return 'ثقة قوية نسبيًا';
    case 'adequate': return 'ثقة مناسبة';
    case 'cautious': return 'ثقة مقبولة بحذر';
    default: return 'ثقة محدودة';
  }
}

export function buildFishboneDiagnostic(title: string, caution: string, categories: FishboneCategory[]): FishboneDiagnostic {
  return { title, caution, categories: categories.filter((category) => category.prompts.length > 0) };
}

export function buildDiagnosticDecision(params: DiagnosticDecision): DiagnosticDecision {
  return params;
}
