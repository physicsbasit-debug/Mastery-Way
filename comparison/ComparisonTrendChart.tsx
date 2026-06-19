import React, { useMemo } from "react";
import type { ComparisonTrendPoint } from "./comparisonTypes";
import { buildTrendVisualModel } from "./comparisonVisualModels";

interface ComparisonTrendChartProps {
  points: ComparisonTrendPoint[];
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function formatPercent(value: number): string {
  return `${round2(value)}%`;
}

function getPointPosition(value: number): string {
  const bounded = Math.max(0, Math.min(100, value));
  return `${bounded}%`;
}

export default function ComparisonTrendChart({
  points,
}: ComparisonTrendChartProps) {
  const model = useMemo(() => buildTrendVisualModel(points), [points]);

  if (!model.points.length) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 text-sm font-extrabold text-slate-900">
          اتجاه المتوسط
        </div>

        <div className="relative h-20 rounded-2xl border border-slate-100 bg-slate-50 px-4">
          <div className="absolute inset-x-4 top-1/2 h-[2px] -translate-y-1/2 bg-slate-200" />

          {model.points.map((point, index) => (
            <div
              key={`${point.label}_${index}_mean`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: getPointPosition(point.mean) }}
            >
              <div className="h-4 w-4 rounded-full border-2 border-white bg-slate-900 shadow" />
              <div className="mt-2 min-w-[120px] -translate-x-1/2 text-center text-xs font-bold text-slate-700">
                {point.label}
              </div>
              <div className="mt-1 -translate-x-1/2 text-center text-xs text-slate-500">
                {formatPercent(point.mean)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 text-sm font-extrabold text-slate-900">
          اتجاه الإتقان
        </div>

        <div className="relative h-20 rounded-2xl border border-slate-100 bg-slate-50 px-4">
          <div className="absolute inset-x-4 top-1/2 h-[2px] -translate-y-1/2 bg-slate-200" />

          {model.points.map((point, index) => (
            <div
              key={`${point.label}_${index}_mastery`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: getPointPosition(point.mastery) }}
            >
              <div className="h-4 w-4 rounded-full border-2 border-white bg-sky-600 shadow" />
              <div className="mt-2 min-w-[120px] -translate-x-1/2 text-center text-xs font-bold text-slate-700">
                {point.label}
              </div>
              <div className="mt-1 -translate-x-1/2 text-center text-xs text-slate-500">
                {formatPercent(point.mastery)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}