import { useMemo } from "react";
import type { ComparisonResult } from "./comparisonTypes";
import { buildComparisonKPIModel } from "./comparisonVisualModels";

type Tone = "neutral" | "success" | "warning" | "danger";

interface ComparisonKPICardsProps {
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

function formatSignedPercent(value: number): string {
  const rounded = round2(value);
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}

function getDeltaTone(
  metric: "mean" | "median" | "mastery" | "risk" | "excellence",
  delta: number
): Tone {
  if (delta === 0) return "neutral";

  if (metric === "risk") {
    return delta < 0 ? "success" : "danger";
  }

  return delta > 0 ? "success" : "warning";
}

function getToneClasses(tone: Tone): string {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50/90";
    case "warning":
      return "border-amber-200 bg-amber-50/90";
    case "danger":
      return "border-red-200 bg-red-50/90";
    default:
      return "border-slate-200 bg-slate-50/90";
  }
}

function getMetricDirectionText(
  metric: "mean" | "median" | "mastery" | "risk" | "excellence",
  delta: number
): string {
  if (delta === 0) {
    return "لا يظهر تغير يُذكر مقارنة بالمرجع.";
  }

  if (metric === "risk") {
    return delta < 0
      ? "انخفضت نسبة الخطر مقارنة بالمرجع، وهذه إشارة إيجابية."
      : "ارتفعت نسبة الخطر مقارنة بالمرجع، وتحتاج إلى متابعة.";
  }

  return delta > 0
    ? "تحسن المؤشر مقارنة بالمرجع."
    : "المؤشر أدنى من المرجع ويحتاج إلى رفع.";
}

function getMetricLabel(
  metric: "mean" | "median" | "mastery" | "risk" | "excellence"
): string {
  switch (metric) {
    case "mean":
      return "متوسط الدرجات";
    case "median":
      return "الوسيط";
    case "mastery":
      return "نسبة الإتقان";
    case "risk":
      return "نسبة الخطر";
    case "excellence":
      return "نسبة التميز";
    default:
      return "مؤشر";
  }
}

export default function ComparisonKPICards({
  result,
  baseLabel,
  targetLabel,
}: ComparisonKPICardsProps) {
  const items = useMemo(() => buildComparisonKPIModel(result), [result]);

  const currentBaseLabel = baseLabel ?? result.base.meta.label;
  const currentTargetLabel = targetLabel ?? result.target.meta.label;

  if (items.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const tone = getDeltaTone(
          item.label === "نسبة الخطر"
            ? "risk"
            : item.label === "نسبة الإتقان"
            ? "mastery"
            : item.label === "نسبة التميز"
            ? "excellence"
            : item.label === "الوسيط"
            ? "median"
            : "mean",
          item.delta
        );

        return (
          <div
            key={`${item.label}_${index}`}
            className={`rounded-[22px] border p-4 shadow-sm ${getToneClasses(
              tone
            )}`}
          >
            <div className="text-sm font-extrabold text-slate-900">
              {getMetricLabel(
                item.label === "نسبة الخطر"
                  ? "risk"
                  : item.label === "نسبة الإتقان"
                  ? "mastery"
                  : item.label === "نسبة التميز"
                  ? "excellence"
                  : item.label === "الوسيط"
                  ? "median"
                  : "mean"
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/40 bg-white/70 p-3">
                <div className="text-xs font-bold text-slate-500">
                  {currentBaseLabel}
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  {formatPercent(item.baseValue)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/40 bg-white/70 p-3">
                <div className="text-xs font-bold text-slate-500">
                  {currentTargetLabel}
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  {formatPercent(item.targetValue)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/40 bg-white/70 p-3">
              <div className="text-xs font-bold text-slate-500">
                الفارق بينهما
              </div>
              <div className="mt-2 text-lg font-black text-slate-900">
                {formatSignedPercent(item.delta)}
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                {getMetricDirectionText(
                  item.label === "نسبة الخطر"
                    ? "risk"
                    : item.label === "نسبة الإتقان"
                    ? "mastery"
                    : item.label === "نسبة التميز"
                    ? "excellence"
                    : item.label === "الوسيط"
                    ? "median"
                    : "mean",
                  item.delta
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
