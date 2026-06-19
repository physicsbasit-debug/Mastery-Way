import {
  DECISION_TYPE_LABELS,
  IMPROVEMENT_OPPORTUNITY_LABELS,
  PRIORITY_LABELS,
} from './constants';
import type {
  EducationalDecision,
  GapToNextLevel,
  GroupShapeAnalysis,
  MasteryJudgement,
  MasterySpreadReport,
  MasterySpreadSummary,
  ProposedGroupPlan,
} from './types';
import { formatStudentCount } from './utils';

export function buildJudgementInterpretation(
  judgement: MasteryJudgement,
  summary: MasterySpreadSummary,
  gapToNextLevel: GapToNextLevel,
): string {
  const base = `بلغت نسبة انتشار الإتقان ${summary.masterySpreadPercent}%، ووقع الحكم ضمن مستوى «${judgement.label}» وفق السلم المعتمد.`;
  switch (judgement.code) {
    case 'distinguished':
      return `${base} يدل ذلك على انتشار قوي للإتقان. تركز المتابعة على تثبيت النتيجة، وإثراء المتقنين، ودعم غير المتقنين بصورة نوعية.`;
    case 'good':
      return `${base} يدل ذلك على انتشار جيد للإتقان مع فرصة واضحة للانتقال إلى مستوى متميز. ${gapToNextLevel.message}`;
    case 'adequate':
      return `${base} يشير ذلك إلى انتشار متوسط يحتاج دعمًا جماعيًا موجهًا لرفع عدد من يبلغون حد الإتقان. ${gapToNextLevel.message}`;
    case 'not_adequate':
      return `${base} يشير ذلك إلى انتشار محدود للإتقان، ويستدعي خطة علاجية منظمة وإعادة قياس قريبة. ${gapToNextLevel.message}`;
    case 'rapid_intervention':
      return `${base} يشير ذلك إلى انخفاض واضح في انتشار الإتقان، ويستدعي تدخلًا سريعًا يبدأ بتشخيص جماعي داعم ثم إعادة تدريس مركزة وإعادة قياس قريبة. ${gapToNextLevel.message}`;
  }
}

export function buildGroupShapeInterpretation(groupShape: GroupShapeAnalysis): string {
  return `مستوى التشتت «${groupShape.dispersionLabel}». بلغت نسبة القريبين من الإتقان ${groupShape.nearMasteryPercent}%، وبلغت نسبة الفجوة العميقة ${groupShape.deepGapPercent}%. فرصة التحسن القريب: «${IMPROVEMENT_OPPORTUNITY_LABELS[groupShape.improvementOpportunity]}».`;
}

export function buildRecommendations(judgement: MasteryJudgement, groupShape: GroupShapeAnalysis): string[] {
  const nearHint = groupShape.nearMasteryPercent >= 10
    ? 'استثمار فئة القريبين من حد الإتقان عبر أنشطة دفع قصيرة وموجهة.'
    : 'تقوية الأساس العام قبل توقع انتقال سريع إلى حد الإتقان.';
  const deepHint = groupShape.deepGapCount > 0
    ? 'تخصيص دعم أعمق للفئة ذات الفجوة العميقة دون خلطها بفئة القرب من الإتقان.'
    : 'لا تظهر فجوة عميقة في البيانات الحالية؛ لذا يتركز التدخل في الدعم والتثبيت.';

  switch (judgement.code) {
    case 'distinguished':
      return [
        'تنفيذ أنشطة إثرائية ومهام مهارات عليا للحفاظ على مستوى الإتقان.',
        'تثبيت أداء المتقنين مع دعم نوعي للطلبة الذين لم يبلغوا حد الإتقان.',
        'تنفيذ قياس دوري مختصر للتحقق من استدامة انتشار الإتقان.',
      ];
    case 'good':
      return ['تنفيذ خطة رفع قصيرة للوصول إلى مستوى متميز.', nearHint, deepHint, 'إعادة قياس نسبة انتشار الإتقان بعد أسبوع واحد.'];
    case 'adequate':
      return ['تنفيذ دعم جماعي موجه يركز على بلوغ حد الإتقان.', nearHint, deepHint, 'إعادة القياس خلال أسبوع إلى أسبوعين.'];
    case 'not_adequate':
      return ['تنفيذ خطة علاجية منظمة.', 'إعادة تدريس مركزة للعناصر الأساسية المرتبطة بأداة القياس.', nearHint, deepHint, 'استخدام اختبار قصير بعد التدخل.'];
    case 'rapid_intervention':
      return ['تنفيذ تدخل عاجل يتضمن تشخيصًا جماعيًا سريعًا.', 'إعادة تدريس مركزة ومباشرة للعناصر الأساسية.', 'تقديم تدريبات قصيرة ومتكررة.', deepHint, 'إعادة قياس قريبة جدًا للتحقق من أثر التدخل.'];
  }
}

export function buildEducationalDecision(
  judgement: MasteryJudgement,
  summary: MasterySpreadSummary,
  gapToNextLevel: GapToNextLevel,
  groupShape: GroupShapeAnalysis,
): EducationalDecision {
  return {
    judgement,
    priority: judgement.priority,
    priorityLabel: PRIORITY_LABELS[judgement.priority],
    decisionType: judgement.decisionType,
    decisionLabel: DECISION_TYPE_LABELS[judgement.decisionType],
    interpretation: buildJudgementInterpretation(judgement, summary, gapToNextLevel),
    recommendations: buildRecommendations(judgement, groupShape),
    retestRecommendation: 'يوصى بإعادة قياس انتشار الإتقان بعد تنفيذ التدخل، ثم مقارنة النسبة الجديدة بالنسبة الحالية لتحديد أثر الخطة.',
  };
}

export function buildProposedPlan(
  judgement: MasteryJudgement,
  groupShape: GroupShapeAnalysis,
  gapToNextLevel: GapToNextLevel,
): ProposedGroupPlan {
  const groupingActivity = groupShape.dispersionLevel === 'high'
    ? 'تقسيم المجموعة إلى فئات دعم مرنة بسبب ارتفاع التشتت.'
    : 'تنفيذ نشاط جماعي متدرج بسبب تقارب الأداء نسبيًا.';

  const measurableNextLevelCriterion = gapToNextLevel.hasNextLevel
    && gapToNextLevel.requiredSpreadPercent !== undefined
    && gapToNextLevel.requiredMasteryCount !== undefined
    ? `رفع نسبة انتشار الإتقان إلى ${gapToNextLevel.requiredSpreadPercent}% على الأقل، بما يعادل بلوغ ${formatStudentCount(gapToNextLevel.requiredMasteryCount)} حد الإتقان.`
    : 'الحفاظ على نسبة الانتشار ضمن المستوى المتميز مع خفض عدد غير المتقنين.';

  switch (judgement.code) {
    case 'distinguished':
      return {
        title: 'خطة تثبيت وإثراء جماعية',
        duration: 'أسبوع واحد مع متابعة دورية',
        implementationMode: 'أنشطة إثرائية ومهام مهارات عليا مع دعم نوعي لغير المتقنين',
        activities: ['مهام تطبيقية أعلى من التذكر المباشر.', 'نشاط إنتاجي قصير مثل تصميم سؤال أو تفسير نموذج إجابة.', 'تغذية راجعة جماعية للحفاظ على جودة الأداء.'],
        assessmentTool: 'مهمة قصيرة أو اختبار خروج إتقاني',
        successCriterion: 'استمرار نسبة الانتشار في مستوى متميز مع انخفاض عدد غير المتقنين.',
        followUp: 'إعادة قياس مختصر بعد أنشطة الإثراء والدعم النوعي.',
      };
    case 'good':
      return {
        title: 'خطة رفع قصيرة نحو التميز',
        duration: 'أسبوع واحد',
        implementationMode: 'دعم قصير موجه لفئة القرب من الإتقان مع تثبيت أداء المتقنين',
        activities: ['مراجعة جماعية قصيرة للأفكار العامة المرتبطة بالاختبار.', 'تدريب متدرج يقترب من حد الإتقان.', groupingActivity],
        assessmentTool: 'اختبار قصير من 5 إلى 8 فقرات',
        successCriterion: measurableNextLevelCriterion,
        followUp: 'إعادة قياس بعد أسبوع واحد.',
      };
    case 'adequate':
      return {
        title: 'خطة دعم جماعي موجه',
        duration: 'أسبوع إلى أسبوعين',
        implementationMode: 'أنشطة دعم جماعي ومجموعات مرنة حسب شكل التوزيع',
        activities: ['شرح مصغر للأفكار الأساسية المرتبطة بالاختبار.', 'تدريب موجه ثم تدريب مستقل قصير.', groupingActivity],
        assessmentTool: 'اختبار خروج قصير ثم إعادة قياس',
        successCriterion: measurableNextLevelCriterion,
        followUp: 'إعادة قياس خلال أسبوع إلى أسبوعين.',
      };
    case 'not_adequate':
      return {
        title: 'خطة علاجية منظمة',
        duration: 'أسبوعان',
        implementationMode: 'إعادة تدريس مركزة مع تدريب متدرج ومتابعة قريبة',
        activities: ['تشخيص جماعي سريع لتحديد موضع الخلل العام.', 'إعادة تدريس مركزة للعناصر الأساسية.', 'تدريب متدرج من الأساسيات إلى مهام قريبة من حد الإتقان.', groupingActivity],
        assessmentTool: 'اختبار قصير بعد كل مرحلة أو نهاية الأسبوع الثاني',
        successCriterion: measurableNextLevelCriterion,
        followUp: 'إعادة قياس بعد أسبوعين.',
      };
    case 'rapid_intervention':
      return {
        title: 'خطة تدخل سريع',
        duration: 'أسبوع واحد كبداية عاجلة ثم متابعة',
        implementationMode: 'تدخل عاجل وقصير ومباشر قبل توسيع الأنشطة',
        activities: ['تشخيص جماعي سريع جدًا لتحديد موضع الخلل العام.', 'إعادة تدريس مركزة ومباشرة.', 'تدريبات قصيرة متكررة.', 'اختبار خروج قصير في نهاية التدخل الأول.'],
        assessmentTool: 'قياس قصير قريب جدًا',
        successCriterion: measurableNextLevelCriterion,
        followUp: 'إعادة قياس خلال مدة قصيرة لا تتجاوز أسبوعًا.',
      };
  }
}

export function buildReport(
  summary: MasterySpreadSummary,
  judgement: MasteryJudgement,
  gapToNextLevel: GapToNextLevel,
  groupShape: GroupShapeAnalysis,
  educationalDecision: EducationalDecision,
  proposedPlan: ProposedGroupPlan,
): MasterySpreadReport {
  const summaryText = `بلغت نسبة انتشار الإتقان ${summary.masterySpreadPercent}%، ووقع الحكم ضمن مستوى «${judgement.label}». بلغ عدد من حققوا حد الإتقان ${summary.masteryCount} من أصل ${summary.totalStudents}، بينما بلغ عدد غير المتقنين ${summary.nonMasteryCount}. ${gapToNextLevel.message}`;
  const educationalReading = `${educationalDecision.interpretation} ${buildGroupShapeInterpretation(groupShape)}`;
  const finalRecommendation = `يوصى بتنفيذ «${proposedPlan.title}» لمدة ${proposedPlan.duration}، ثم إعادة قياس انتشار الإتقان للتحقق من أثر التدخل.`;
  return {
    title: 'تقرير تحليل انتشار الإتقان',
    summaryText,
    educationalReading,
    finalRecommendation,
    printableSections: [summaryText, educationalReading, `القرار التربوي: ${DECISION_TYPE_LABELS[judgement.decisionType]}.`, `الخطة المقترحة: ${proposedPlan.title}.`, finalRecommendation],
  };
}
