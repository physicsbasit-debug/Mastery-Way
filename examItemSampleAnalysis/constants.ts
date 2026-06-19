import {
  ASSESSMENT_TYPE_OPTIONS as SHARED_ASSESSMENT_TYPE_OPTIONS,
  EDUCATION_DIRECTORATE_OPTIONS as SHARED_EDUCATION_DIRECTORATE_OPTIONS,
  GRADE_OPTIONS as SHARED_GRADE_OPTIONS,
  QUESTION_LEVEL_OPTIONS as SHARED_QUESTION_LEVEL_OPTIONS,
  QUESTION_TYPE_OPTIONS as SHARED_QUESTION_TYPE_OPTIONS,
  SKILL_OPTIONS as SHARED_SKILL_OPTIONS,
  SUBJECT_OPTIONS as SHARED_SUBJECT_OPTIONS,
} from '../shared/appOptions';

export const ASSESSMENT_TYPE_OPTIONS = [...SHARED_ASSESSMENT_TYPE_OPTIONS];
export const EDUCATION_DIRECTORATE_OPTIONS = [...SHARED_EDUCATION_DIRECTORATE_OPTIONS];
export const GRADE_OPTIONS = [...SHARED_GRADE_OPTIONS];
export const QUESTION_LEVEL_OPTIONS = [...SHARED_QUESTION_LEVEL_OPTIONS];
export const QUESTION_TYPE_OPTIONS = [...SHARED_QUESTION_TYPE_OPTIONS];
export const SKILL_OPTIONS = [...SHARED_SKILL_OPTIONS];
export const SUBJECT_OPTIONS = [...SHARED_SUBJECT_OPTIONS];
export const COGNITIVE_LEVEL_OPTIONS = [...SHARED_QUESTION_LEVEL_OPTIONS];

export const ANALYSIS_METHOD_OPTIONS = [
  'تحليل جميع الأوراق',
  'تحليل عينة بنسبة مقترحة',
  'تحليل عدد محدد يدويًا',
  'عينة ممثلة حسب مستويات الأداء',
];

export const SAMPLE_SELECTION_OPTIONS = [
  'عشوائية',
  'ممثلة لمستويات الأداء',
  'من جميع الشعب',
  'من شعبة واحدة',
  'أوراق متاحة فقط',
  'اختيار يدوي من المعلم',
  'أخرى',
];

export const ITEM_PERFORMANCE_BANDS = [
  {
    code: 'very_easy',
    label: 'سهلة جدًا / تحتاج مراجعة مستوى التحدي',
    min: 85,
    max: 100,
    priority: 'منخفضة',
    tone: 'emerald',
  },
  {
    code: 'appropriate',
    label: 'مناسبة غالبًا',
    min: 60,
    max: 85,
    priority: 'منخفضة',
    tone: 'blue',
  },
  {
    code: 'watch',
    label: 'متوسطة الصعوبة وتحتاج متابعة',
    min: 40,
    max: 60,
    priority: 'متوسطة',
    tone: 'amber',
  },
  {
    code: 'difficult',
    label: 'صعبة وتحتاج مراجعة',
    min: 20,
    max: 40,
    priority: 'عالية',
    tone: 'orange',
  },
  {
    code: 'critical',
    label: 'حرجة وتحتاج فحصًا تربويًا',
    min: 0,
    max: 20,
    priority: 'عالية جدًا',
    tone: 'red',
  },
] as const;

export const DEFAULT_CONTEXT = {
  educationDirectorate: 'مديرية التعليم بمحافظة مسقط',
  schoolName: '',
  subject: 'العلوم',
  grade: 'الصف التاسع',
  paperTitle: 'اختبار قصير',
  assessmentType: 'اختبار قصير',
  teacherName: '',
  masteryCutoffPercent: 75,
  totalPapers: 30,
  sampleSize: 30,
  analysisMethod: 'تحليل جميع الأوراق',
  sampleSelectionMethod: 'ممثلة لمستويات الأداء',
  sampleNote: '',
};

export const DEFAULT_ITEM_COUNT = 5;
export const DEFAULT_SAMPLE_SIZE = 10;
export const MAX_VISIBLE_TOP_ITEMS = 5;
