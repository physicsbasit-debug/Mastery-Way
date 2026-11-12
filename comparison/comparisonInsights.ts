import type {
  ComparisonResult,
} from "./comparisonTypes"

/* =========================================================
   Types
========================================================= */

export type ComparisonInterventionType =
  | "remedial"
  | "preventive"
  | "stabilization"
  | "enrichment"

export interface ComparisonRecommendation {
  type: ComparisonInterventionType
  priority: "high" | "medium" | "low"
  message: string
}

export interface ComparisonEducationalSummary {
  headline: string
  interpretation: string
  decisionHint: string
}

export interface ComparisonDecisionPackage {
  summary: ComparisonEducationalSummary
  recommendations: ComparisonRecommendation[]
}

/* =========================================================
   Helpers
========================================================= */

function abs(value: number): number {
  return Math.abs(value)
}

function isSignificantChange(value: number, threshold: number): boolean {
  return abs(value) >= threshold
}

function positive(value: number): boolean {
  return value > 0
}

function negative(value: number): boolean {
  return value < 0
}

/* =========================================================
   Educational Interpretation
========================================================= */

export function buildEducationalSummary(
  result: ComparisonResult,
): ComparisonEducationalSummary {

  const { delta } = result.insights

  let headline = ""
  let interpretation = ""
  let decisionHint = ""

  const meanChange = delta.meanDelta
  const masteryChange = delta.masteryDelta
  const riskChange = delta.riskDelta
  const stdChange = delta.stdDevDelta

  /* =========================
     headline logic
  ========================= */

  if (positive(meanChange) && positive(masteryChange) && !positive(riskChange)) {

    headline = "تحسن واضح في مستوى الإتقان"

  } else if (negative(meanChange) && positive(riskChange)) {

    headline = "إشارة تراجع تحتاج متابعة"

  } else if (!isSignificantChange(meanChange, 0.5) && !isSignificantChange(masteryChange, 2)) {

    headline = "استقرار عام في الأداء"

  } else {

    headline = "تغير متوسط في الأداء"
  }

  /* =========================
     interpretation logic
  ========================= */

  if (positive(meanChange)) {

    interpretation += "المتوسط العام تحسن مقارنة بالمرجع. "

  } else if (negative(meanChange)) {

    interpretation += "المتوسط العام انخفض مقارنة بالمرجع. "
  }

  if (positive(masteryChange)) {

    interpretation += "نسبة الطلبة ضمن مستوى الإتقان ارتفعت. "

  } else if (negative(masteryChange)) {

    interpretation += "نسبة الطلبة ضمن مستوى الإتقان انخفضت. "
  }

  if (positive(riskChange)) {

    interpretation += "هناك زيادة في نسبة الطلبة ضمن منطقة الخطر. "

  } else if (negative(riskChange)) {

    interpretation += "نسبة الطلبة ضمن منطقة الخطر انخفضت. "
  }

  if (positive(stdChange)) {

    interpretation += "درجة التشتت ارتفعت مما يشير إلى تفاوت أكبر في مستويات الطلبة. "

  } else if (negative(stdChange)) {

    interpretation += "درجة التشتت انخفضت مما يشير إلى تقارب أكبر في مستويات الطلبة. "
  }

  /* =========================
     decision hint
  ========================= */

  if (positive(riskChange)) {

    decisionHint = "يُفضل إعطاء أولوية لمعالجة الفجوات لدى الطلبة ذوي الأداء المنخفض."

  } else if (positive(masteryChange) && negative(stdChange)) {

    decisionHint = "يمكن التركيز على تثبيت المكتسبات الحالية وتعزيز الاستقرار."

  } else if (positive(meanChange)) {

    decisionHint = "يوصى بالاستمرار في نفس النهج التعليمي مع تعزيز جوانب القوة."

  } else {

    decisionHint = "يفضل إجراء مراجعة نوعية لأسباب التغير في الأداء."
  }

  return {

    headline,
    interpretation: interpretation.trim(),
    decisionHint,
  }
}

/* =========================================================
   Recommendations
========================================================= */

export function buildComparisonRecommendations(
  result: ComparisonResult,
): ComparisonRecommendation[] {

  const { delta } = result.insights

  const recommendations: ComparisonRecommendation[] = []

  if (delta.riskDelta > 3) {

    recommendations.push({

      type: "remedial",

      priority: "high",

      message: "تنفيذ تدخل علاجي موجه للطلبة ضمن منطقة الخطر."
    })
  }

  if (delta.masteryDelta < -3) {

    recommendations.push({

      type: "preventive",

      priority: "high",

      message: "تحليل أسباب انخفاض الإتقان وإعادة تنظيم أنشطة التعلم."
    })
  }

  if (delta.stdDevDelta > 1) {

    recommendations.push({

      type: "stabilization",

      priority: "medium",

      message: "استخدام استراتيجيات تدريس متمايز لتقليل الفجوة بين مستويات الطلبة."
    })
  }

  if (delta.excellenceDelta > 4) {

    recommendations.push({

      type: "enrichment",

      priority: "low",

      message: "توفير أنشطة إثرائية للحفاظ على مستوى الطلبة المتفوقين."
    })
  }

  if (recommendations.length === 0) {

    recommendations.push({

      type: "stabilization",

      priority: "low",

      message: "الاستمرار في نفس النهج التعليمي مع متابعة دورية للمؤشرات."
    })
  }

  return recommendations
}

/* =========================================================
   Decision Package
========================================================= */

export function buildComparisonDecisionPackage(
  result: ComparisonResult,
): ComparisonDecisionPackage {

  return {

    summary: buildEducationalSummary(result),

    recommendations: buildComparisonRecommendations(result),
  }
}
