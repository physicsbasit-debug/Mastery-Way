import type { MasteryJudgement, MasteryJudgementCode } from './types';
import {
  ACADEMIC_YEAR_START_MONTH as SHARED_ACADEMIC_YEAR_START_MONTH,
  ASSESSMENT_TYPE_OPTIONS as SHARED_ASSESSMENT_TYPE_OPTIONS,
  EDUCATION_DIRECTORATE_OPTIONS as SHARED_EDUCATION_DIRECTORATE_OPTIONS,
  GRADE_OPTIONS as SHARED_GRADE_OPTIONS,
  SUBJECT_OPTIONS as SHARED_SUBJECT_OPTIONS,
  getAcademicYearFromDate as sharedGetAcademicYearFromDate,
  getLocalDateString as sharedGetLocalDateString,
} from '../shared/appOptions';

export const ACADEMIC_YEAR_START_MONTH = SHARED_ACADEMIC_YEAR_START_MONTH;
export const ASSESSMENT_TYPE_OPTIONS = [...SHARED_ASSESSMENT_TYPE_OPTIONS];
export const EDUCATION_DIRECTORATE_OPTIONS = [...SHARED_EDUCATION_DIRECTORATE_OPTIONS];
export const SUBJECT_OPTIONS = [...SHARED_SUBJECT_OPTIONS];
export const GRADE_OPTIONS = [...SHARED_GRADE_OPTIONS];
export const getAcademicYearFromDate = sharedGetAcademicYearFromDate;
export const getLocalDateString = sharedGetLocalDateString;

export const DEFAULT_TOTAL_SCORE = 100;
export const DEFAULT_MASTERY_CUTOFF_PERCENT = 75;
export const DEFAULT_NEAR_MASTERY_MARGIN = 5;
export const DEFAULT_DEEP_GAP_MARGIN = 15;
export const DEFAULT_DECIMAL_PLACES = 1;
export const DEFAULT_EXPECTED_STUDENT_COUNT = '';

export const GROUP_SHAPE_THRESHOLDS = {
  lowDispersionMax: 10,
  highDispersionMin: 18,
  highOpportunityNearPercent: 20,
  mediumOpportunityNearPercent: 10,
} as const;

export const MASTERY_JUDGEMENT_SCALE: MasteryJudgement[] = [
  {
    code: 'distinguished',
    label: 'متميز',
    minPercent: 70,
    maxPercent: 100,
    rank: 5,
    priority: 'low',
    decisionType: 'enrichment',
    shortDescription: 'انتشار الإتقان قوي داخل المجموعة.',
  },
  {
    code: 'good',
    label: 'جيد',
    minPercent: 60,
    maxPercent: 70,
    rank: 4,
    priority: 'medium',
    decisionType: 'raise_to_excellence',
    shortDescription: 'انتشار الإتقان مناسب، مع فرصة واضحة للرفع.',
  },
  {
    code: 'adequate',
    label: 'ملائم',
    minPercent: 50,
    maxPercent: 60,
    rank: 3,
    priority: 'medium_high',
    decisionType: 'targeted_support',
    shortDescription: 'انتشار الإتقان متوسط ويحتاج دعمًا جماعيًا موجهًا.',
  },
  {
    code: 'not_adequate',
    label: 'غير ملائم',
    minPercent: 40,
    maxPercent: 50,
    rank: 2,
    priority: 'high',
    decisionType: 'remedial_plan',
    shortDescription: 'انتشار الإتقان ضعيف ويحتاج خطة علاجية منظمة.',
  },
  {
    code: 'rapid_intervention',
    label: 'يحتاج إلى تدخل سريع',
    minPercent: 0,
    maxPercent: 40,
    rank: 1,
    priority: 'urgent',
    decisionType: 'urgent_intervention',
    shortDescription: 'انتشار الإتقان منخفض جدًا ويحتاج تدخلًا سريعًا.',
  },
];

export const JUDGEMENT_LABELS: Record<MasteryJudgementCode, string> = {
  distinguished: 'متميز',
  good: 'جيد',
  adequate: 'ملائم',
  not_adequate: 'غير ملائم',
  rapid_intervention: 'يحتاج إلى تدخل سريع',
};

export const PRIORITY_LABELS = {
  low: 'منخفضة علاجياً، مرتفعة إثرائياً',
  medium: 'متوسطة',
  medium_high: 'متوسطة إلى عالية',
  high: 'عالية',
  urgent: 'عاجلة',
} as const;

export const DECISION_TYPE_LABELS = {
  enrichment: 'تثبيت وإثراء',
  raise_to_excellence: 'خطة رفع قصيرة نحو التميز',
  targeted_support: 'دعم جماعي موجه',
  remedial_plan: 'خطة علاجية منظمة',
  urgent_intervention: 'تدخل عاجل وإعادة تدريس مركزة',
} as const;

export const IMPROVEMENT_OPPORTUNITY_LABELS = {
  high: 'فرصة عالية',
  medium: 'فرصة متوسطة',
  limited: 'فرصة محدودة',
  none: 'لا توجد فرصة قريبة واضحة',
} as const;

export const VALIDATION_REASON_LABELS = {
  empty_value: 'قيمة فارغة',
  not_numeric: 'قيمة غير رقمية',
  negative_score: 'درجة سالبة',
  above_total_score: 'درجة أكبر من الدرجة الكلية',
} as const;

export const PERCENT_HISTOGRAM_BUCKETS = [
  { key: '0-9', label: '0% إلى أقل من 10%', min: 0, max: 10 },
  { key: '10-19', label: '10% إلى أقل من 20%', min: 10, max: 20 },
  { key: '20-29', label: '20% إلى أقل من 30%', min: 20, max: 30 },
  { key: '30-39', label: '30% إلى أقل من 40%', min: 30, max: 40 },
  { key: '40-49', label: '40% إلى أقل من 50%', min: 40, max: 50 },
  { key: '50-59', label: '50% إلى أقل من 60%', min: 50, max: 60 },
  { key: '60-69', label: '60% إلى أقل من 70%', min: 60, max: 70 },
  { key: '70-79', label: '70% إلى أقل من 80%', min: 70, max: 80 },
  { key: '80-89', label: '80% إلى أقل من 90%', min: 80, max: 90 },
  { key: '90-100', label: '90% إلى 100%', min: 90, max: 100.000001 },
] as const;


export const GRADE_LEVEL_OPTIONS = [...SHARED_GRADE_OPTIONS];

export const GROUP_DESCRIPTION_OPTIONS = [
  'جميع طلبة الصف',
  'طلبة شعبة واحدة',
  'جميع الشعب في الصف نفسه',
  'مجموعة علاجية',
  'مجموعة دعم موجه',
  'مجموعة إثرائية',
  'مجموعة متابعة بعد تدخل',
  'نتائج اختبار وحدة دراسية',
  'نتائج اختبار فصل دراسي',
  'نتائج قياس قبلي',
  'نتائج قياس بعدي',
] as const;



