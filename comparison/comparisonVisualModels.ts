/* =========================================================
   Phase 9 — Comparison Visual Models
   File: comparisonVisualModels.ts
   Purpose:
   Provide visual-ready data models for charts and cards
   without coupling UI components to analytics logic.
========================================================= */

import type {
  ComparisonResult,
  ComparisonTrendPoint,
} from "./comparisonTypes"

/* =========================================================
   Bar Chart Model
========================================================= */

export interface ComparisonBarChartItem {
  metric:

    | "mean"
    | "median"
    | "mastery"
    | "risk"
    | "excellence"

  base: number
  target: number
}

export function buildComparisonBarChartModel(
  result: ComparisonResult,
): ComparisonBarChartItem[] {

  const base = result.base
  const target = result.target

  return [

    {
      metric: "mean",
      base: base.numeric.mean,
      target: target.numeric.mean,
    },

    {
      metric: "median",
      base: base.numeric.median,
      target: target.numeric.median,
    },

    {
      metric: "mastery",
      base: base.mastery.masteryRate,
      target: target.mastery.masteryRate,
    },

    {
      metric: "risk",
      base: base.mastery.riskRate,
      target: target.mastery.riskRate,
    },

    {
      metric: "excellence",
      base: base.mastery.excellenceRate,
      target: target.mastery.excellenceRate,
    },
  ]
}

/* =========================================================
   Distribution Chart Model
========================================================= */

export interface ComparisonDistributionChartItem {

  label: string

  baseCount: number
  targetCount: number

  basePercentage: number
  targetPercentage: number
}

export function buildDistributionComparisonModel(
  result: ComparisonResult,
): ComparisonDistributionChartItem[] {

  const baseBuckets = result.base.distribution.buckets
  const targetBuckets = result.target.distribution.buckets

  const map = new Map<string, ComparisonDistributionChartItem>()

  baseBuckets.forEach(bucket => {

    map.set(bucket.label, {

      label: bucket.label,

      baseCount: bucket.count,
      targetCount: 0,

      basePercentage: bucket.percentage,
      targetPercentage: 0,
    })
  })

  targetBuckets.forEach(bucket => {

    const existing = map.get(bucket.label)

    if (existing) {

      existing.targetCount = bucket.count
      existing.targetPercentage = bucket.percentage

    } else {

      map.set(bucket.label, {

        label: bucket.label,

        baseCount: 0,
        targetCount: bucket.count,

        basePercentage: 0,
        targetPercentage: bucket.percentage,
      })
    }
  })

  return Array.from(map.values())
}

/* =========================================================
   Trend Model
========================================================= */

export interface ComparisonTrendVisualModel {

  points: ComparisonTrendPoint[]
}

export function buildTrendVisualModel(

  points: ComparisonTrendPoint[],

): ComparisonTrendVisualModel {

  return {

    points,
  }
}

/* =========================================================
   KPI Model
========================================================= */

export interface ComparisonKPICard {

  label: string

  baseValue: number
  targetValue: number

  delta: number
}

export function buildComparisonKPIModel(

  result: ComparisonResult,

): ComparisonKPICard[] {

  const delta = result.insights.delta

  return [

    {

      label: "متوسط الدرجات",

      baseValue: result.base.numeric.mean,
      targetValue: result.target.numeric.mean,

      delta: delta.meanDelta,
    },

    {

      label: "نسبة الإتقان",

      baseValue: result.base.mastery.masteryRate,
      targetValue: result.target.mastery.masteryRate,

      delta: delta.masteryDelta,
    },

    {

      label: "نسبة الخطر",

      baseValue: result.base.mastery.riskRate,
      targetValue: result.target.mastery.riskRate,

      delta: delta.riskDelta,
    },

    {

      label: "نسبة التميز",

      baseValue: result.base.mastery.excellenceRate,
      targetValue: result.target.mastery.excellenceRate,

      delta: delta.excellenceDelta,
    },
  ]
}

/* =========================================================
   Summary Card Adapter
========================================================= */

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

export function buildSummaryVisual(

  result: ComparisonResult,

): ComparisonSummaryVisual {

  const summary = result.insights

  let signal: ComparisonSummaryVisual["signal"] = "neutral"

  if (summary.prioritySignal === "improvement") {

    signal = "positive"

  } else if (summary.prioritySignal === "risk_increase") {

    signal = "negative"
  }

  return {

    title: "ملخص المقارنة",

    subtitle: summary.summaryText,

    signal,

    meanChange: summary.delta.meanDelta,
    masteryChange: summary.delta.masteryDelta,
    riskChange: summary.delta.riskDelta,
  }
}