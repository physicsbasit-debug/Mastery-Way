import type {
  ComparisonDataset,
  ComparisonDelta,
  ComparisonInsights,
  ComparisonResult,
  ComparisonSummaryCardModel,
  ComparisonTrendIndicator,
  ComparisonMode,
  ComparisonTrendPoint,
} from "./comparisonTypes";

export type ComparisonSourceType =
  | "benchmark_reference"
  | "saved_snapshot"
  | "class_comparison"
  | "grade_comparison"
  | "time_series_reference";

export interface ComparisonSourceOption {
  id: string;
  label: string;
  mode: ComparisonMode;
  sourceType: ComparisonSourceType;
  description?: string;
  disabled?: boolean;
}

export interface ComparisonSnapshotReference {
  id: string;
  label: string;
  dataset: ComparisonDataset;
  sourceType?: ComparisonSourceType;
  mode?: ComparisonMode;
  description?: string;
}

export interface ComparisonExecutionConfig {
  mode: ComparisonMode;
  sourceType: ComparisonSourceType;
  sourceId?: string | null;
  baseLabel?: string;
  targetLabel?: string;
  benchmarkLabel?: string;
  enabled: boolean;
}

export interface ComparisonExecutionResult {
  sourceConfig: ComparisonExecutionConfig;
  targetDataset: ComparisonDataset;
  result: ComparisonResult;
  summaryCard: ComparisonSummaryCardModel;
  trendPoints: ComparisonTrendPoint[];
  availableSources: ComparisonSourceOption[];
}

function roundTo(value: number, digits: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function safeNumber(value: number | null | undefined): number {
  return Number.isFinite(value as number) ? Number(value) : 0;
}

function formatSignedValue(value: number, digits: number = 2): string {
  const normalized = roundTo(value, digits);
  if (normalized > 0) return `+${normalized}`;
  return `${normalized}`;
}

function isNearlyEqual(value: number, threshold: number): boolean {
  return Math.abs(value) <= threshold;
}

function buildDefaultSourceDescription(mode: ComparisonMode): string {
  switch (mode) {
    case "benchmark_reference":
      return "مرجع معياري داخلي آمن للمقارنة.";
    case "time_series":
      return "مقارنة تحليل حالي مع لقطة محفوظة لنفس الشعبة.";
    case "class_vs_class":
      return "مقارنة شعبة بشعبة.";
    case "grade_vs_grade":
      return "مقارنة صف بصف.";
    default:
      return "مصدر مقارنة متاح.";
  }
}

function inferSourceTypeFromMode(mode: ComparisonMode): ComparisonSourceType {
  switch (mode) {
    case "class_vs_class":
      return "class_comparison";
    case "grade_vs_grade":
      return "grade_comparison";
    case "time_series":
      return "time_series_reference";
    case "benchmark_reference":
    default:
      return "benchmark_reference";
  }
}

export function calculateComparisonDelta(
  base: ComparisonDataset,
  target: ComparisonDataset
): ComparisonDelta {
  return {
    meanDelta: roundTo(
      safeNumber(target.numeric.mean) - safeNumber(base.numeric.mean)
    ),
    medianDelta: roundTo(
      safeNumber(target.numeric.median) - safeNumber(base.numeric.median)
    ),
    stdDevDelta: roundTo(
      safeNumber(target.numeric.stdDev) - safeNumber(base.numeric.stdDev)
    ),
    masteryDelta: roundTo(
      safeNumber(target.mastery.masteryRate) -
        safeNumber(base.mastery.masteryRate)
    ),
    riskDelta: roundTo(
      safeNumber(target.mastery.riskRate) - safeNumber(base.mastery.riskRate)
    ),
    excellenceDelta: roundTo(
      safeNumber(target.mastery.excellenceRate) -
        safeNumber(base.mastery.excellenceRate)
    ),
  };
}

export function buildComparisonTrendIndicators(
  delta: ComparisonDelta
): ComparisonTrendIndicator {
  const positiveAcademicShift =
    delta.meanDelta > 0 || delta.masteryDelta > 0 || delta.excellenceDelta > 0;

  const riskPressure = delta.riskDelta > 0;
  const instabilityPressure = delta.stdDevDelta > 0.75;

  const stable =
    isNearlyEqual(delta.meanDelta, 0.5) &&
    isNearlyEqual(delta.masteryDelta, 2) &&
    isNearlyEqual(delta.riskDelta, 2) &&
    isNearlyEqual(delta.stdDevDelta, 0.75);

  const improving = positiveAcademicShift && !riskPressure;
  const declining =
    !improving && (riskPressure || instabilityPressure || delta.meanDelta < 0);

  return {
    improving,
    stable: !improving && !declining && stable,
    declining,
  };
}

export function buildComparisonSummaryText(
  base: ComparisonDataset,
  target: ComparisonDataset,
  delta: ComparisonDelta
): string {
  const baseLabel = base.meta.label || "المرجع";
  const targetLabel = target.meta.label || "المقارنة";

  const parts: string[] = [];

  if (delta.meanDelta > 0) {
    parts.push(
      `ارتفع المتوسط من ${baseLabel} إلى ${targetLabel} بمقدار ${formatSignedValue(
        delta.meanDelta
      )}.`
    );
  } else if (delta.meanDelta < 0) {
    parts.push(
      `انخفض المتوسط من ${baseLabel} إلى ${targetLabel} بمقدار ${formatSignedValue(
        delta.meanDelta
      )}.`
    );
  } else {
    parts.push(`لم يتغير المتوسط بين ${baseLabel} و${targetLabel}.`);
  }

  if (delta.masteryDelta > 0) {
    parts.push(
      `تحسنت نسبة الإتقان بمقدار ${formatSignedValue(
        delta.masteryDelta
      )} نقطة مئوية.`
    );
  } else if (delta.masteryDelta < 0) {
    parts.push(
      `تراجعت نسبة الإتقان بمقدار ${formatSignedValue(
        delta.masteryDelta
      )} نقطة مئوية.`
    );
  } else {
    parts.push(`نسبة الإتقان مستقرة دون تغير ملحوظ.`);
  }

  if (delta.riskDelta > 0) {
    parts.push(
      `ارتفعت نسبة الخطر بمقدار ${formatSignedValue(
        delta.riskDelta
      )} نقطة مئوية.`
    );
  } else if (delta.riskDelta < 0) {
    parts.push(
      `انخفضت نسبة الخطر بمقدار ${formatSignedValue(
        delta.riskDelta
      )} نقطة مئوية.`
    );
  } else {
    parts.push(`نسبة الخطر مستقرة.`);
  }

  return parts.join(" ");
}

export function buildComparisonPrioritySignal(
  delta: ComparisonDelta,
  trend: ComparisonTrendIndicator
): ComparisonInsights["prioritySignal"] {
  if (trend.improving && delta.riskDelta <= 0) {
    return "improvement";
  }

  if (delta.riskDelta > 0 && (delta.meanDelta < 0 || delta.masteryDelta < 0)) {
    return "risk_increase";
  }

  if (trend.stable) {
    return "stability";
  }

  return "mixed";
}

export function buildComparisonInsights(
  base: ComparisonDataset,
  target: ComparisonDataset
): ComparisonInsights {
  const delta = calculateComparisonDelta(base, target);
  const trend = buildComparisonTrendIndicators(delta);
  const summaryText = buildComparisonSummaryText(base, target, delta);
  const prioritySignal = buildComparisonPrioritySignal(delta, trend);

  return {
    delta,
    trend,
    summaryText,
    prioritySignal,
  };
}

export function buildComparisonResult(
  mode: ComparisonMode,
  base: ComparisonDataset,
  target: ComparisonDataset
): ComparisonResult {
  return {
    mode,
    base,
    target,
    insights: buildComparisonInsights(base, target),
  };
}

export function buildComparisonSummaryCard(
  result: ComparisonResult
): ComparisonSummaryCardModel {
  const { base, target, insights } = result;

  let signal: ComparisonSummaryCardModel["signal"] = "neutral";

  if (insights.prioritySignal === "improvement") {
    signal = "positive";
  } else if (insights.prioritySignal === "risk_increase") {
    signal = "negative";
  }

  return {
    title: "ملخص المقارنة",
    subtitle: insights.summaryText,
    baseLabel: base.meta.label,
    targetLabel: target.meta.label,
    meanChange: roundTo(insights.delta.meanDelta),
    masteryChange: roundTo(insights.delta.masteryDelta),
    riskChange: roundTo(insights.delta.riskDelta),
    signal,
  };
}

export function buildComparisonDatasetFromRaw(params: {
  id: string;
  label: string;
  className?: string;
  sectionName?: string;
  academicYear?: string;
  timestamp?: number;

  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;

  masteryRate: number;
  nearMissRate: number;
  riskRate: number;
  excellenceRate: number;

  distributionBuckets?: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}): ComparisonDataset {
  return {
    meta: {
      id: params.id,
      label: params.label,
      className: params.className,
      sectionName: params.sectionName,
      academicYear: params.academicYear,
      timestamp: params.timestamp,
    },
    numeric: {
      mean: safeNumber(params.mean),
      median: safeNumber(params.median),
      stdDev: safeNumber(params.stdDev),
      q1: safeNumber(params.q1),
      q3: safeNumber(params.q3),
      iqr: safeNumber(params.iqr),
      min: safeNumber(params.min),
      max: safeNumber(params.max),
    },
    mastery: {
      masteryRate: clampPercentage(params.masteryRate),
      nearMissRate: clampPercentage(params.nearMissRate),
      riskRate: clampPercentage(params.riskRate),
      excellenceRate: clampPercentage(params.excellenceRate),
    },
    distribution: {
      buckets: (params.distributionBuckets ?? []).map((bucket) => ({
        label: bucket.label,
        count: safeNumber(bucket.count),
        percentage: clampPercentage(bucket.percentage),
      })),
    },
  };
}

export function buildComparisonTrendPoints(
  base: ComparisonDataset,
  target: ComparisonDataset
): ComparisonTrendPoint[] {
  return [
    {
      label: base.meta.label,
      mean: roundTo(base.numeric.mean),
      mastery: roundTo(base.mastery.masteryRate),
    },
    {
      label: target.meta.label,
      mean: roundTo(target.numeric.mean),
      mastery: roundTo(target.mastery.masteryRate),
    },
  ];
}

export function buildComparisonSourceOptions(args: {
  baseDataset: ComparisonDataset;
  benchmarkDataset?: ComparisonDataset | null;
  snapshots?: ComparisonSnapshotReference[];
}): ComparisonSourceOption[] {
  const options: ComparisonSourceOption[] = [];

  if (args.benchmarkDataset) {
    options.push({
      id: args.benchmarkDataset.meta.id || "benchmark-reference",
      label: args.benchmarkDataset.meta.label || "مرجع معياري داخلي",
      mode: "benchmark_reference",
      sourceType: "benchmark_reference",
      description: buildDefaultSourceDescription("benchmark_reference"),
    });
  }

  for (const snapshot of args.snapshots ?? []) {
    const snapshotMode = snapshot.mode ?? "time_series";
    options.push({
      id: snapshot.id,
      label: snapshot.label,
      mode: snapshotMode,
      sourceType:
        snapshot.sourceType ?? inferSourceTypeFromMode(snapshotMode),
      description:
        snapshot.description ?? buildDefaultSourceDescription(snapshotMode),
    });
  }

  return options;
}

export function resolveComparisonTargetDataset(args: {
  mode: ComparisonMode;
  sourceId?: string | null;
  benchmarkDataset?: ComparisonDataset | null;
  snapshots?: ComparisonSnapshotReference[];
}): {
  targetDataset: ComparisonDataset | null;
  sourceType: ComparisonSourceType;
} {
  if (args.sourceId) {
    const selectedSnapshot =
      args.snapshots?.find((item) => item.id === args.sourceId) ?? null;

    if (selectedSnapshot) {
      return {
        targetDataset: selectedSnapshot.dataset,
        sourceType:
          selectedSnapshot.sourceType ??
          inferSourceTypeFromMode(selectedSnapshot.mode ?? args.mode),
      };
    }
  }

  if (args.mode === "benchmark_reference" && args.benchmarkDataset) {
    return {
      targetDataset: args.benchmarkDataset,
      sourceType: "benchmark_reference",
    };
  }

  if (args.benchmarkDataset) {
    return {
      targetDataset: args.benchmarkDataset,
      sourceType: "benchmark_reference",
    };
  }

  return {
    targetDataset: null,
    sourceType: inferSourceTypeFromMode(args.mode),
  };
}

export function buildComparisonExecution(args: {
  mode: ComparisonMode;
  baseDataset: ComparisonDataset;
  benchmarkDataset?: ComparisonDataset | null;
  snapshots?: ComparisonSnapshotReference[];
  sourceId?: string | null;
}): ComparisonExecutionResult | null {
  const availableSources = buildComparisonSourceOptions({
    baseDataset: args.baseDataset,
    benchmarkDataset: args.benchmarkDataset,
    snapshots: args.snapshots,
  });

  const resolved = resolveComparisonTargetDataset({
    mode: args.mode,
    sourceId: args.sourceId,
    benchmarkDataset: args.benchmarkDataset,
    snapshots: args.snapshots,
  });

  if (!resolved.targetDataset) {
    return null;
  }

  const effectiveMode =
    resolved.sourceType === "benchmark_reference"
      ? "benchmark_reference"
      : args.mode;

  const result = buildComparisonResult(
    effectiveMode,
    args.baseDataset,
    resolved.targetDataset
  );

  return {
    sourceConfig: {
      mode: effectiveMode,
      sourceType: resolved.sourceType,
      sourceId: args.sourceId ?? resolved.targetDataset.meta.id ?? null,
      baseLabel: args.baseDataset.meta.label,
      targetLabel: resolved.targetDataset.meta.label,
      benchmarkLabel:
        resolved.sourceType === "benchmark_reference"
          ? resolved.targetDataset.meta.label
          : undefined,
      enabled: true,
    },
    targetDataset: resolved.targetDataset,
    result,
    summaryCard: buildComparisonSummaryCard(result),
    trendPoints: buildComparisonTrendPoints(
      args.baseDataset,
      resolved.targetDataset
    ),
    availableSources,
  };
}