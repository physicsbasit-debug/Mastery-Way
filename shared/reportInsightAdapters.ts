import {
  UnifiedBoxPlotStats,
  ParetoPoint,
  QualityMetricItem,
  CumulativePoint,
  ThresholdGapPoint,
} from "./analyticsVisualTypes";

import {
  buildParetoInsight,
  buildQualityMetricsInsight,
  buildCumulativeInsight,
  buildThresholdGapInsight,
  buildBoxPlotUnifiedInsight,
} from "./analyticsInsightBuilders";

export function buildReportBoxPlotSection(stats: UnifiedBoxPlotStats | null) {
  if (!stats) return null;

  return {
    title: "مؤشر التشتت",
    description: buildBoxPlotUnifiedInsight(stats),
    stats,
  };
}

export function buildReportParetoSection(points: ParetoPoint[]) {
  if (!points?.length) return null;

  return {
    title: "أكبر الفجوات",
    description: buildParetoInsight(points, "العنصر"),
    points,
  };
}

export function buildReportQualitySection(metrics: QualityMetricItem[]) {
  if (!metrics?.length) return null;

  return {
    title: "مؤشرات الجودة",
    description: buildQualityMetricsInsight(metrics),
    metrics,
  };
}

export function buildReportCumulativeSection(points: CumulativePoint[]) {
  if (!points?.length) return null;

  return {
    title: "التقدم التراكمي",
    description: buildCumulativeInsight(points.length),
    points,
  };
}

export function buildReportThresholdGapSection(points: ThresholdGapPoint[]) {
  if (!points?.length) return null;

  return {
    title: "الفجوة عن الحد",
    description: buildThresholdGapInsight(points, "الحد المعياري"),
    points,
  };
}