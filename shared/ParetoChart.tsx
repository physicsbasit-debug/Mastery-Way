import React from 'react';
import { ChartCard, EmptyChartMessage } from './UnifiedVisuals';
import type { ParetoEntry } from './diagnosticTypes';

export function ParetoChart({
  title,
  description,
  entries,
  valueLabel = 'الفقد',
  compact = false,
}: {
  title: string;
  description?: string;
  entries: ParetoEntry[];
  valueLabel?: string;
  compact?: boolean;
}) {
  const topEntries = entries.slice(0, compact ? 5 : 8);
  const maxValue = Math.max(...topEntries.map((entry) => entry.value), 0);
  return (
    <ChartCard title={title} description={description} compact={compact}>
      {topEntries.length === 0 ? (
        <EmptyChartMessage>لا توجد قيم كافية لبناء مخطط باريتو.</EmptyChartMessage>
      ) : (
        <div className="space-y-3">
          {topEntries.map((entry) => {
            const width = maxValue > 0 ? Math.max(4, (entry.value / maxValue) * 100) : 0;
            return (
              <div key={`${entry.rank}-${entry.label}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                  <span className="text-right text-slate-900">{entry.rank}. {entry.label}</span>
                  <span className="shrink-0">{valueLabel}: {entry.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${width}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
                  <span>النسبة من الإجمالي: <b className="text-slate-800">{entry.sharePercent}%</b></span>
                  <span>التراكمي: <b className="text-slate-800">{entry.cumulativePercent}%</b></span>
                </div>
                {entry.note ? <p className="mt-2 text-xs leading-6 text-slate-600">{entry.note}</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
