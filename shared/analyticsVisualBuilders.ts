import type {
  CumulativePoint,
  HistogramPoint,
  ParetoPoint,
  QualityMetricItem,
  ThresholdGapPoint,
  UnifiedBoxPlotStats,
} from "./analyticsVisualTypes";

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function buildHistogramPoints(
  items: Array<{ label: string; count: number }>
): HistogramPoint[] {
  return items.map((item) => ({
    label: item.label,
    count: item.count,
  }));
}

export function buildCumulativePoints(
  items: Array<{ label: string; count: number }>
): CumulativePoint[] {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  let cumulativeCount = 0;

  return items.map((item) => {
    cumulativeCount += item.count;

    return {
      label: item.label,
      count: item.count,
      cumulativeCount,
      cumulativePercent: total > 0 ? round2((cumulativeCount / total) * 100) : 0,
    };
  });
}

export function buildThresholdGapPoints(
  items: Array<{ label: string; actualValue: number }>,
  thresholdValue: number
): ThresholdGapPoint[] {
  return items.map((item) => {
    const gapValue = round2(item.actualValue - thresholdValue);

    return {
      label: item.label,
      actualValue: round2(item.actualValue),
      thresholdValue: round2(thresholdValue),
      gapValue,
      side: gapValue > 0 ? "above" : gapValue < 0 ? "below" : "equal",
    };
  });
}

export function buildParetoPoints(
  items: Array<{ label: string; value: number }>
): ParetoPoint[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  let cumulativeValue = 0;

  return sorted.map((item) => {
    cumulativeValue += item.value;

    return {
      label: item.label,
      value: item.value,
      cumulativePercent: total > 0 ? round2((cumulativeValue / total) * 100) : 0,
    };
  });
}

export function buildUnifiedBoxPlotStats(args: {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  stdDev?: number;
  outliers?: number[];
}): UnifiedBoxPlotStats {
  const range = round2(args.max - args.min);
  const iqr = round2(args.q3 - args.q1);

  return {
    min: round2(args.min),
    q1: round2(args.q1),
    median: round2(args.median),
    q3: round2(args.q3),
    max: round2(args.max),
    iqr,
    range,
    stdDev: args.stdDev !== undefined ? round2(args.stdDev) : undefined,
    outliers: args.outliers ?? [],
  };
}

export function buildQualityMetricItems(args: {
  stabilityIndex?: number;
  improvementPotentialIndex?: number;
  spreadIndicator?: number;
  balanceIndicator?: number;
}): QualityMetricItem[] {
  const items: QualityMetricItem[] = [];

  if (typeof args.stabilityIndex === "number") {
    items.push({
      key: "stability",
      label: "مؤشر الاستقرار",
      value: `${round2(args.stabilityIndex)}`,
      status:
        args.stabilityIndex >= 75
          ? "good"
          : args.stabilityIndex >= 50
          ? "watch"
          : "risk",
      description:
        "كلما ارتفع هذا المؤشر دلّ على أن التوزيع أكثر استقرارًا وأقل اضطرابًا.",
    });
  }

  if (typeof args.improvementPotentialIndex === "number") {
    items.push({
      key: "improvement_potential",
      label: "قابلية التحسين",
      value: `${round2(args.improvementPotentialIndex)}%`,
      status:
        args.improvementPotentialIndex >= 35
          ? "good"
          : args.improvementPotentialIndex >= 15
          ? "watch"
          : "neutral",
      description:
        "يقيس نسبة الطلبة الذين يمكن رفعهم بسرعة عبر تدخلات قصيرة ومركزة.",
    });
  }

  if (typeof args.spreadIndicator === "number") {
    items.push({
      key: "spread",
      label: "مؤشر التشتت",
      value: `${round2(args.spreadIndicator)}`,
      status:
        args.spreadIndicator <= 15
          ? "good"
          : args.spreadIndicator <= 25
          ? "watch"
          : "risk",
      description:
        "كلما انخفض هذا المؤشر كان التوزيع أكثر تجانسًا بين الطلبة.",
    });
  }

  if (typeof args.balanceIndicator === "number") {
    items.push({
      key: "balance",
      label: "مؤشر الاتزان",
      value: `${round2(args.balanceIndicator)}`,
      status:
        args.balanceIndicator >= 75
          ? "good"
          : args.balanceIndicator >= 50
          ? "watch"
          : "risk",
      description:
        "يقيس مدى اتزان التوزيع العام وعدم انحرافه الحاد نحو طرف واحد.",
    });
  }

  return items;
}