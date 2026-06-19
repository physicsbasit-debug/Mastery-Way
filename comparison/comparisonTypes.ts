export type ComparisonMode =
  | "class_vs_class"
  | "grade_vs_grade"
  | "time_series"
  | "benchmark_reference"

export interface ComparisonDatasetMeta {
  id: string
  label: string
  className?: string
  sectionName?: string
  academicYear?: string
  timestamp?: number
}

export interface ComparisonNumericSnapshot {
  mean: number
  median: number
  stdDev: number
  q1: number
  q3: number
  iqr: number
  min: number
  max: number
}

export interface ComparisonMasterySnapshot {
  masteryRate: number
  nearMissRate: number
  riskRate: number
  excellenceRate: number
}

export interface ComparisonDistributionBucket {
  label: string
  count: number
  percentage: number
}

export interface ComparisonDistribution {
  buckets: ComparisonDistributionBucket[]
}

export interface ComparisonDataset {
  meta: ComparisonDatasetMeta
  numeric: ComparisonNumericSnapshot
  mastery: ComparisonMasterySnapshot
  distribution: ComparisonDistribution
}

export interface ComparisonDelta {
  meanDelta: number
  medianDelta: number
  stdDevDelta: number
  masteryDelta: number
  riskDelta: number
  excellenceDelta: number
}

export interface ComparisonTrendIndicator {
  improving: boolean
  stable: boolean
  declining: boolean
}

export interface ComparisonInsights {
  delta: ComparisonDelta
  trend: ComparisonTrendIndicator

  summaryText: string

  prioritySignal:
    | "improvement"
    | "risk_increase"
    | "stability"
    | "mixed"
}

export interface ComparisonResult {
  mode: ComparisonMode

  base: ComparisonDataset
  target: ComparisonDataset

  insights: ComparisonInsights
}

export interface ComparisonSummaryCardModel {
  title: string
  subtitle?: string

  baseLabel: string
  targetLabel: string

  meanChange: number
  masteryChange: number
  riskChange: number

  signal:
    | "positive"
    | "negative"
    | "neutral"
}

export interface ComparisonTrendPoint {
  label: string
  mean: number
  mastery: number
}

export interface TimeSeriesComparison {
  points: ComparisonTrendPoint[]
}

export interface BenchmarkReference {
  benchmarkMean?: number
  benchmarkMastery?: number
  benchmarkRisk?: number
}