export type StudentInsightLevel = 'low' | 'medium' | 'mastery' | 'high';

export type StudentInsightInput = {
  percent?: number;
  masteryPercent?: number;
  riskLevel?: string;
  recommendationTag?: string;
  weakestSkill?: string;
  strongestSkill?: string;
};

export type StudentInsight = {
  level: StudentInsightLevel;
  title: string;
  summary: string;
  recommendation: string;
  /** Backward-compatible field used by the legacy StudentInsightCard component. */
  meaning: string;
  /** Backward-compatible field used by the legacy StudentInsightCard component. */
  importance: string;
  /** Backward-compatible field used by the legacy StudentInsightCard component. */
  action: string;
};

function toNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeInsight(params: {
  level: StudentInsightLevel;
  title: string;
  summary: string;
  importance: string;
  recommendation: string;
}): StudentInsight {
  return {
    level: params.level,
    title: params.title,
    summary: params.summary,
    recommendation: params.recommendation,
    meaning: params.summary,
    importance: params.importance,
    action: params.recommendation,
  };
}

export function buildStudentInsight(input: StudentInsightInput = {}): StudentInsight {
  const percent = toNumber(input.percent);
  const masteryPercent = toNumber(input.masteryPercent, 75);
  const weakestSkill = input.weakestSkill || 'المهارة ذات الأولوية';
  const strongestSkill = input.strongestSkill || 'نقاط القوة الظاهرة';

  if (percent < 50) {
    return makeInsight({
      level: 'low',
      title: 'يحتاج تدخلًا علاجيًا',
      summary: `بلغ أداء الطالب ${percent}%، وهو دون حد الإتقان المعتمد (${masteryPercent}%).`,
      importance: 'تشير النتيجة إلى حاجة واضحة لدعم منظم يبدأ من الأساسيات المرتبطة بموضع التعثر.',
      recommendation: `تبدأ المتابعة بخطة علاجية قصيرة تركز على ${weakestSkill} مع إعادة قياس لاحقة.`,
    });
  }

  if (percent < masteryPercent) {
    return makeInsight({
      level: 'medium',
      title: 'يحتاج دعمًا للوصول إلى الإتقان',
      summary: `بلغ أداء الطالب ${percent}%، وهو قريب من حد الإتقان المعتمد (${masteryPercent}%).`,
      importance: 'تشير النتيجة إلى وجود فرصة لتحسين الأداء بخطة دعم مركزة وقصيرة.',
      recommendation: `يوصى بخطة دعم ورفع تركز على ${weakestSkill} وتستثمر ${strongestSkill}.`,
    });
  }

  if (percent < 90) {
    return makeInsight({
      level: 'mastery',
      title: 'حقق حد الإتقان',
      summary: `بلغ أداء الطالب ${percent}% وحقق حد الإتقان المعتمد.`,
      importance: 'تشير النتيجة إلى تحقق المستوى المطلوب في هذه الورقة مع الحاجة إلى تثبيت الأداء.',
      recommendation: 'يوصى بخطة تثبيت قصيرة للمحافظة على مستوى الأداء وتوسيع التطبيق.',
    });
  }

  return makeInsight({
    level: 'high',
    title: 'أداء متميز',
    summary: `بلغ أداء الطالب ${percent}%، ويظهر أداءً مرتفعًا في هذه الورقة.`,
    importance: 'تشير النتيجة إلى قدرة مناسبة للانتقال إلى أنشطة إثرائية أكثر عمقًا وتحديًا.',
    recommendation: 'يوصى بخطة إثرائية تتضمن أسئلة أعمق ومهام مفتوحة.',
  });
}

export default buildStudentInsight;
