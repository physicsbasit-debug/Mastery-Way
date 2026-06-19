export type UnifiedThresholdKind = "pass" | "mastery" | "custom";

export interface HistogramPoint {
  label: string;
  count: number;
}

export interface CumulativePoint {
  label: string;
  count: number;
  cumulativeCount: number;
  cumulativePercent: number;
}

export interface ThresholdGapPoint {
  label: string;
  actualValue: number;
  thresholdValue: number;
  gapValue: number;
  side: "above" | "below" | "equal";
}

export interface ParetoPoint {
  label: string;
  value: number;
  cumulativePercent: number;
}

export interface UnifiedBoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  range: number;
  stdDev?: number;
  outliers?: number[];
}

export interface QualityMetricItem {
  key: string;
  label: string;
  value: string;
  status: "good" | "watch" | "risk" | "neutral";
  description: string;
}

export interface UnifiedInsightModel {
  meaning: string;
  importance: string;
  action: string;
}
export interface ComparisonChartModel {

  mean:

    {

      base: number
      target: number

    }

  mastery:

    {

      base: number
      target: number

    }

  risk:

    {

      base: number
      target: number

    }

  excellence:

    {

      base: number
      target: number

    }
}

export interface ComparisonKPICard {

  label: string

  baseValue: number
  targetValue: number

  delta: number
}

export interface ComparisonSummaryVisual {

  title: string
  subtitle?: string

  signal:

    | "positive"
    | "negative"
    | "neutral"

  meanChange: number
  masteryChange: number
  riskChange: number
}