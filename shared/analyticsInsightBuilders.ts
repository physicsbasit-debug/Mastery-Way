import type {
  ParetoPoint,
  QualityMetricItem,
  ThresholdGapPoint,
  UnifiedBoxPlotStats,
  UnifiedInsightModel,
} from "./analyticsVisualTypes";

export function buildCumulativeInsight(total: number): UnifiedInsightModel {
  return {
    meaning:
      total > 0
        ? "يعرض المنحنى التراكمي كيف تتجمع أعداد الطلبة تدريجيًا عبر المستويات أو النطاقات."
        : "لا توجد بيانات كافية لقراءة المنحنى التراكمي.",
    importance:
      "هذه القراءة تساعد على معرفة حجم الفئات الدنيا أو الوسطى أو العليا دون الاعتماد على رقم منفرد.",
    action:
      total > 0
        ? "استخدم هذا المنحنى لتحديد أين يتراكم معظم الطلبة، ثم وجّه التدخل نحو النقطة التي تحقق أكبر أثر."
        : "أدخل بيانات كافية أولًا حتى يصبح المنحنى التراكمي ذا معنى.",
  };
}

export function buildThresholdGapInsight(
  points: ThresholdGapPoint[],
  thresholdLabel: string
): UnifiedInsightModel {
  const belowCount = points.filter((item) => item.side === "below").length;
  const aboveCount = points.filter((item) => item.side === "above").length;

  return {
    meaning: `يوضح هذا الرسم مقدار ابتعاد كل عنصر عن ${thresholdLabel}. يوجد حاليًا ${belowCount} عناصر تحت الحد و${aboveCount} فوقه.`,
    importance:
      "يساعد هذا المؤشر على ترتيب الأولويات بسرعة، لأنه لا يكتفي ببيان النجاح أو الإخفاق بل يكشف حجم الفجوة نفسها.",
    action:
      "ابدأ بالعناصر الأقرب إلى الحد إذا كان الهدف رفع النتائج بسرعة، ثم انتقل إلى الحالات الأبعد التي تحتاج معالجة أعمق.",
  };
}

export function buildParetoInsight(
  points: ParetoPoint[],
  labelName: string
): UnifiedInsightModel {
  const topLabels = points.slice(0, 3).map((item) => item.label).join("، ");

  return {
    meaning:
      points.length > 0
        ? `يرتب هذا الرسم أكبر مصادر الأثر بحسب ${labelName}. أكثرها تأثيرًا حاليًا: ${topLabels || "—"}.`
        : "لا توجد بيانات كافية لبناء تحليل Pareto.",
    importance:
      "يساعد Pareto على تركيز الجهد على العوامل الأعلى أثرًا بدل توزيعه بالتساوي على جميع العناصر.",
    action:
      points.length > 0
        ? "ابدأ بأعلى عنصرين أو ثلاثة في الرسم، ثم قِس التحسن قبل التوسع إلى بقية العناصر."
        : "أدخل بيانات أو مؤشرات كافية لبناء أولويات ذات معنى.",
  };
}

export function buildBoxPlotUnifiedInsight(
  stats: UnifiedBoxPlotStats
): UnifiedInsightModel {
  const hasWideSpread = stats.range >= 60 || stats.iqr >= 20 || (stats.stdDev ?? 0) >= 20;

  return {
    meaning: hasWideSpread
      ? "توضح قراءات الصندوق الإحصائي أن الفروق بين القيم واسعة نسبيًا، وأن التوزيع لا يتحرك كمجموعة متقاربة."
      : "تشير قراءات الصندوق الإحصائي إلى أن التوزيع أكثر تقاربًا واستقرارًا نسبيًا.",
    importance:
      "هذه القراءة مهمة لأنها تكشف ما إذا كان المتوسط وحده كافيًا لوصف الأداء، أم أن الفروق الداخلية كبيرة وتحتاج تدخلًا تفاضليًا.",
    action: hasWideSpread
      ? "وازن بين التدخل العام والمتابعة التفاضلية، وامنح أولوية للحالات الطرفية أو القيم الشاذة."
      : "يمكن البناء على تدخل عام أكثر اتساقًا مع متابعة الحالات الفردية عند الحاجة.",
  };
}

export function buildQualityMetricsInsight(
  items: QualityMetricItem[]
): UnifiedInsightModel {
  const riskCount = items.filter((item) => item.status === "risk").length;
  const goodCount = items.filter((item) => item.status === "good").length;

  return {
    meaning: `تعرض بطاقات الجودة صورة مكثفة عن الاستقرار، والتشتت، والاتزان، وقابلية التحسين. توجد ${goodCount} مؤشرات مطمئنة و${riskCount} مؤشرات تحتاج انتباهًا.`,
    importance:
      "هذه البطاقات تختصر قراءات متعددة في لوحة واحدة تساعد على اتخاذ قرار تربوي سريع ومدروس.",
    action:
      "ابدأ بالمؤشرات الحمراء أولًا، ثم راقب تحسنها بعد التدخل قبل إعادة تقييم الصورة الكاملة.",
  };
}