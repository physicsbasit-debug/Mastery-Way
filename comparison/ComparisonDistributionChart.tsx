import { useMemo } from "react";
import type { ComparisonResult } from "./comparisonTypes";
import { buildDistributionComparisonModel } from "./comparisonVisualModels";

interface ComparisonDistributionChartProps {
  result: ComparisonResult;
  baseLabel?: string;
  targetLabel?: string;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function formatPercent(value: number): string {
  return `${round2(value)}%`;
}

export default function ComparisonDistributionChart({
  result,
  baseLabel,
  targetLabel,
}: ComparisonDistributionChartProps) {
  const items = useMemo(() => buildDistributionComparisonModel(result), [result]);

  const currentBaseLabel = baseLabel ?? result.base.meta.label;
  const currentTargetLabel = targetLabel ?? result.target.meta.label;

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const baseWidth = `${Math.max(0, Math.min(100, item.basePercentage))}%`;
        const targetWidth = `${Math.max(
          0,
          Math.min(100, item.targetPercentage)
        )}%`;

        return (
          <div
            key={item.label}
            className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 text-sm font-extrabold text-slate-900">
              {item.label}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500">
                    {currentBaseLabel}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {item.baseCount} طالب | {formatPercent(item.basePercentage)}
                  </span>
                </div>
                <div className="h-3.5 rounded-full bg-slate-100">
                  <div
                    className="h-3.5 rounded-full bg-slate-900 transition-all"
                    style={{ width: baseWidth }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500">
                    {currentTargetLabel}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {item.targetCount} طالب |{" "}
                    {formatPercent(item.targetPercentage)}
                  </span>
                </div>
                <div className="h-3.5 rounded-full bg-slate-100">
                  <div
                    className="h-3.5 rounded-full bg-sky-600 transition-all"
                    style={{ width: targetWidth }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
