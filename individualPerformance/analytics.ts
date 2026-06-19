import {
  DEFAULT_INDIVIDUAL_PERFORMANCE_SETTINGS,
  ERROR_TYPE_OPTIONS,
  PERFORMANCE_LEVEL_PRESENTATION,
  getDefaultQuestionTypeForCategory,
} from './constants';
import { buildNarratives, buildPlan } from './reportText';
import type {
  AnalysisReadinessResult,
  CodingCompletenessResult,
  ErrorPatternResult,
  ExamQuestionBlueprint,
  GeneralSummary,
  GroupPerformanceResult,
  IndividualPerformanceAnalysisResult,
  IndividualPerformanceSettings,
  IndividualReadingQualityResult,
  IndividualReportContext,
  ItemStatus,
  ItemStatusSummary,
  PerformanceLevel,
  PerformanceLevelCode,
  SkillPerformanceResult,
  StudentQuestionInput,
  TeacherNoteEvidence,
  ValidatedQuestionResult,
  ValidationIssue,
} from './types';

const UNCODED_ERROR_LABEL = 'لم يرمز نوع الخطأ';
const MASTERED_ANSWER_LABEL = 'إجابة متقنة';
const LEGACY_NOT_APPLICABLE_LABEL = 'لا ينطبق';
const OTHER_ERROR_LABEL = 'أخرى';
const GENERIC_INCOMPLETE_ANSWER_LABEL = 'إجابة ناقصة';

export function getCurrentAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}/${startYear + 1} م`;
}

export function getIsoDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDefaultIndividualContext(): IndividualReportContext {
  return {
    educationDirectorate: 'مديرية التعليم بمحافظة مسقط',
    schoolName: '',
    subject: 'العلوم',
    grade: 'الصف التاسع',
    section: '',
    studentName: '',
    paperTitle: '',
    assessmentType: 'اختبار قصير',
    teacherName: '',
    academicYear: getCurrentAcademicYear(),
    analysisDate: getIsoDate(),
  };
}

export function createDefaultSettings(): IndividualPerformanceSettings {
  return { ...DEFAULT_INDIVIDUAL_PERFORMANCE_SETTINGS };
}

export function createExamBlueprint(questionCount: number): ExamQuestionBlueprint[] {
  const safeCount = Math.max(1, Math.min(80, Math.floor(Number(questionCount) || 1)));
  const defaultCategory = 'مقالي / ذو إجابة قصيرة';
  return Array.from({ length: safeCount }, (_, index) => ({
    id: `q${index + 1}`,
    label: `س${index + 1}`,
    maxScore: 1,
    skill: 'الفهم',
    questionCategory: defaultCategory,
    questionType: getDefaultQuestionTypeForCategory(defaultCategory),
    questionLevel: 'متوسط',
  }));
}

export function createStudentInputsFromBlueprint(blueprint: ExamQuestionBlueprint[]): StudentQuestionInput[] {
  return blueprint.map((question) => ({
    questionId: question.id,
    score: '',
    errorType: UNCODED_ERROR_LABEL,
    otherErrorDetail: '',
    teacherNote: '',
  }));
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatArabicItemRepresentation(count: number): string {
  const forms: Record<number, string> = {
    1: 'بمفردة واحدة',
    2: 'بمفردتين',
    3: 'بثلاث مفردات',
    4: 'بأربع مفردات',
    5: 'بخمس مفردات',
    6: 'بست مفردات',
    7: 'بسبع مفردات',
    8: 'بثماني مفردات',
    9: 'بتسع مفردات',
    10: 'بعشر مفردات',
  };
  return forms[count] || `بـ${count} مفردة`;
}

function buildSingleItemSkillsCaution(count: number): string {
  if (count === 1) return 'توجد مهارة واحدة ممثلة بمفردة واحدة فقط.';
  if (count === 2) return 'توجد مهارتان ممثلتان بمفردة واحدة لكل منهما.';
  const forms: Record<number, string> = {
    3: 'ثلاث مهارات',
    4: 'أربع مهارات',
    5: 'خمس مهارات',
    6: 'ست مهارات',
    7: 'سبع مهارات',
    8: 'ثماني مهارات',
    9: 'تسع مهارات',
    10: 'عشر مهارات',
  };
  return `توجد ${forms[count] || `${count} مهارات`} ممثلة بمفردة واحدة لكل منها.`;
}

function getStatus(score: number, maxScore: number, errorType: string): ItemStatus {
  if (score >= maxScore && maxScore > 0) return 'correct';
  if (score > 0) return 'partial';
  if (errorType === 'ترك السؤال') return 'omitted';
  return 'wrong';
}

function normalizeErrorType(
  score: number,
  maxScore: number,
  rawErrorType?: string,
  otherErrorDetail?: string,
): string {
  if (score >= maxScore && maxScore > 0) return MASTERED_ANSWER_LABEL;
  const text = String(rawErrorType || '').trim();
  if (!text || text === LEGACY_NOT_APPLICABLE_LABEL || text === 'غير محدد' || text === '—' || text === MASTERED_ANSWER_LABEL) {
    return UNCODED_ERROR_LABEL;
  }
  if (text === OTHER_ERROR_LABEL) {
    const detail = String(otherErrorDetail || '').trim();
    return detail ? `${OTHER_ERROR_LABEL}: ${detail}` : OTHER_ERROR_LABEL;
  }
  return text;
}

function isUncodedError(errorType: string): boolean {
  const text = String(errorType || '').trim();
  return (
    !text ||
    text === UNCODED_ERROR_LABEL ||
    text === LEGACY_NOT_APPLICABLE_LABEL ||
    text === MASTERED_ANSWER_LABEL ||
    text === GENERIC_INCOMPLETE_ANSWER_LABEL ||
    text === 'غير محدد' ||
    text === '—'
  );
}

function getPriority(loss: number, maxScore: number): ValidatedQuestionResult['priority'] {
  const percentLoss = maxScore > 0 ? (loss / maxScore) * 100 : 0;
  if (loss <= 0) return 'لا تحتاج أولوية خاصة';
  if (percentLoss >= 60) return 'أولوية عالية';
  if (percentLoss >= 30) return 'أولوية متوسطة';
  return 'أولوية منخفضة';
}

function resolveSettings(settingsInput?: Partial<IndividualPerformanceSettings>): IndividualPerformanceSettings {
  const merged = { ...createDefaultSettings(), ...(settingsInput || {}) };
  return {
    passCutoffPercent: Number(merged.passCutoffPercent),
    masteryCutoffPercent: Number(merged.masteryCutoffPercent),
    excellenceCutoffPercent: Number(merged.excellenceCutoffPercent),
    decimalPlaces: Number.isInteger(Number(merged.decimalPlaces))
      ? Math.max(0, Math.min(4, Number(merged.decimalPlaces)))
      : DEFAULT_INDIVIDUAL_PERFORMANCE_SETTINGS.decimalPlaces,
  };
}

export function validateIndividualPerformanceSettings(settings: IndividualPerformanceSettings): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const pass = Number(settings.passCutoffPercent);
  const mastery = Number(settings.masteryCutoffPercent);
  const excellence = Number(settings.excellenceCutoffPercent);

  if (!Number.isFinite(pass) || pass < 0 || pass > 100) {
    issues.push({
      code: 'invalid_pass_cutoff',
      field: 'passCutoffPercent',
      message: 'حد النجاح يجب أن يكون رقمًا بين 0 و100.',
      minValue: 0,
      maxValue: 100,
      actualValue: settings.passCutoffPercent,
    });
  }
  if (!Number.isFinite(mastery) || mastery <= 0 || mastery > 100) {
    issues.push({
      code: 'invalid_mastery_cutoff',
      field: 'masteryCutoffPercent',
      message: 'حد الإتقان يجب أن يكون رقمًا أكبر من 0 ولا يتجاوز 100.',
      minValue: 0,
      maxValue: 100,
      actualValue: settings.masteryCutoffPercent,
    });
  }
  if (!Number.isFinite(excellence) || excellence <= 0 || excellence > 100) {
    issues.push({
      code: 'invalid_excellence_cutoff',
      field: 'excellenceCutoffPercent',
      message: 'حد التميز يجب أن يكون رقمًا أكبر من 0 ولا يتجاوز 100.',
      minValue: 0,
      maxValue: 100,
      actualValue: settings.excellenceCutoffPercent,
    });
  }

  if (
    Number.isFinite(pass) &&
    Number.isFinite(mastery) &&
    Number.isFinite(excellence) &&
    !(pass < mastery && mastery < excellence)
  ) {
    issues.push({
      code: 'invalid_cutoff_order',
      message: 'يجب أن يكون حد النجاح أقل من حد الإتقان، وحد الإتقان أقل من حد التميز.',
      actualValue: `${pass} < ${mastery} < ${excellence}`,
    });
  }

  return issues;
}

function getSafeSettings(settings: IndividualPerformanceSettings): IndividualPerformanceSettings {
  return validateIndividualPerformanceSettings(settings).length === 0 ? settings : createDefaultSettings();
}

function getPerformanceLevel(percent: number, settingsInput: IndividualPerformanceSettings): PerformanceLevel {
  const settings = getSafeSettings(settingsInput);
  const safePercent = clampPercent(percent);
  const code: PerformanceLevelCode = safePercent < settings.passCutoffPercent
    ? 'remedial'
    : safePercent < settings.masteryCutoffPercent
      ? 'support'
      : safePercent < settings.excellenceCutoffPercent
        ? 'mastery'
        : 'excellent';
  const presentation = PERFORMANCE_LEVEL_PRESENTATION[code];
  const ranges: Record<PerformanceLevelCode, [number, number]> = {
    remedial: [0, settings.passCutoffPercent],
    support: [settings.passCutoffPercent, settings.masteryCutoffPercent],
    mastery: [settings.masteryCutoffPercent, settings.excellenceCutoffPercent],
    excellent: [settings.excellenceCutoffPercent, 100],
  };
  return { ...presentation, minPercent: ranges[code][0], maxPercent: ranges[code][1] };
}

interface QuestionInspectionResult {
  questions: ValidatedQuestionResult[];
  readiness: AnalysisReadinessResult;
}

function inspectIndividualAnalysisInputs(
  blueprint: ExamQuestionBlueprint[],
  inputs: StudentQuestionInput[],
  settings: IndividualPerformanceSettings,
): QuestionInspectionResult {
  const issues: ValidationIssue[] = [];
  const warnings: string[] = [];
  const inputById = new Map(inputs.map((input) => [input.questionId, input]));
  const seenIds = new Set<string>();
  let completedScoreCount = 0;
  let emptyScoreCount = 0;
  let invalidScoreCount = 0;
  let invalidBlueprintCount = 0;

  if (blueprint.length === 0) {
    issues.push({ code: 'missing_blueprint', message: 'يجب بناء الورقة الامتحانية قبل التحليل.' });
  }

  const settingIssues = validateIndividualPerformanceSettings(settings);
  issues.push(...settingIssues);
  const questions: ValidatedQuestionResult[] = [];

  blueprint.forEach((question) => {
    const questionId = String(question.id || '').trim();
    const questionLabel = question.label || questionId || 'سؤال غير محدد';
    if (!questionId || seenIds.has(questionId)) {
      invalidBlueprintCount += 1;
      issues.push({
        code: 'duplicate_question_id',
        questionId,
        questionLabel,
        message: questionId ? 'معرّف السؤال مكرر داخل بناء الورقة.' : 'معرّف السؤال غير موجود.',
      });
      return;
    }
    seenIds.add(questionId);

    const maxScore = Number(question.maxScore);
    const input = inputById.get(questionId);
    const rawValue = input?.score;
    const isEmpty = rawValue === '' || rawValue == null || (typeof rawValue === 'string' && rawValue.trim() === '');

    let blueprintValid = true;
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      blueprintValid = false;
      issues.push({
        code: 'invalid_max_score',
        questionId,
        questionLabel,
        field: 'maxScore',
        message: 'درجة السؤال الكلية يجب أن تكون رقمًا أكبر من صفر.',
        minValue: 0,
        actualValue: question.maxScore,
      });
    }
    if (!String(question.skill || '').trim()) {
      blueprintValid = false;
      issues.push({
        code: 'missing_skill',
        questionId,
        questionLabel,
        field: 'skill',
        message: 'يجب تحديد المهارة المرتبطة بالسؤال.',
      });
    }
    if (!blueprintValid) invalidBlueprintCount += 1;

    if (isEmpty) {
      emptyScoreCount += 1;
      issues.push({
        code: 'missing_score',
        questionId,
        questionLabel,
        field: 'score',
        message: 'درجة الطالب فارغة. يجب إدخال الدرجة قبل التحليل.',
      });
      return;
    }

    const rawScore = Number(rawValue);
    if (!Number.isFinite(rawScore)) {
      invalidScoreCount += 1;
      issues.push({
        code: 'non_numeric_score',
        questionId,
        questionLabel,
        field: 'score',
        message: 'درجة الطالب يجب أن تكون قيمة رقمية.',
        actualValue: String(rawValue),
      });
      return;
    }
    if (rawScore < 0) {
      invalidScoreCount += 1;
      issues.push({
        code: 'negative_score',
        questionId,
        questionLabel,
        field: 'score',
        message: 'درجة الطالب لا يمكن أن تكون سالبة.',
        minValue: 0,
        actualValue: rawScore,
      });
      return;
    }
    if (Number.isFinite(maxScore) && maxScore > 0 && rawScore > maxScore) {
      invalidScoreCount += 1;
      issues.push({
        code: 'score_above_max',
        questionId,
        questionLabel,
        field: 'score',
        message: `درجة الطالب يجب أن تكون بين 0 و${maxScore}.`,
        minValue: 0,
        maxValue: maxScore,
        actualValue: rawScore,
      });
      return;
    }

    completedScoreCount += 1;
    const rawErrorType = String(input?.errorType || '').trim();
    if (rawScore > 0 && rawErrorType === 'ترك السؤال') {
      issues.push({
        code: 'omitted_with_positive_score',
        questionId,
        questionLabel,
        field: 'errorType',
        message: 'لا يمكن ترميز السؤال بأنه متروك مع وجود درجة أكبر من صفر.',
        actualValue: rawErrorType,
      });
      return;
    }
    if (rawScore < maxScore && rawErrorType === OTHER_ERROR_LABEL && !String(input?.otherErrorDetail || '').trim()) {
      issues.push({
        code: 'missing_other_error_detail',
        questionId,
        questionLabel,
        field: 'otherErrorDetail',
        message: 'عند اختيار «أخرى» يجب كتابة وصف مختصر لنوع الخطأ.',
      });
      return;
    }

    if (!blueprintValid) return;

    const score = rawScore;
    const errorType = normalizeErrorType(score, maxScore, input?.errorType, input?.otherErrorDetail);
    const loss = round(maxScore - score, settings.decimalPlaces);
    const percent = round((score / maxScore) * 100, settings.decimalPlaces);
    const status = getStatus(score, maxScore, errorType);

    questions.push({
      id: questionId,
      label: questionLabel,
      maxScore,
      score,
      skill: String(question.skill || '').trim(),
      questionCategory: String(question.questionCategory || 'غير محدد').trim() || 'غير محدد',
      questionType: String(question.questionType || 'أخرى').trim() || 'أخرى',
      questionLevel: String(question.questionLevel || 'متوسط').trim() || 'متوسط',
      errorType,
      otherErrorDetail: String(input?.otherErrorDetail || '').trim(),
      teacherNote: String(input?.teacherNote || '').trim(),
      loss,
      percent,
      status,
      priority: getPriority(loss, maxScore),
    });
  });

  const settingsValid = settingIssues.length === 0;
  const readiness: AnalysisReadinessResult = {
    isValid: issues.length === 0 && questions.length > 0 && questions.length === blueprint.length,
    totalQuestionCount: blueprint.length,
    completedScoreCount,
    emptyScoreCount,
    invalidScoreCount,
    invalidBlueprintCount,
    settingsValid,
    validQuestionCount: questions.length,
    issueCount: issues.length,
    issues,
    warnings,
  };
  return { questions, readiness };
}

export function validateIndividualAnalysisReadiness(
  blueprint: ExamQuestionBlueprint[],
  inputs: StudentQuestionInput[],
  settingsInput?: Partial<IndividualPerformanceSettings>,
): AnalysisReadinessResult {
  const settings = resolveSettings(settingsInput);
  return inspectIndividualAnalysisInputs(blueprint, inputs, settings).readiness;
}

function buildSummary(questions: ValidatedQuestionResult[], settings: IndividualPerformanceSettings): GeneralSummary {
  const totalScore = questions.reduce((sum, question) => sum + question.maxScore, 0);
  const studentScore = questions.reduce((sum, question) => sum + question.score, 0);
  const percent = round(totalScore > 0 ? (studentScore / totalScore) * 100 : 0, settings.decimalPlaces);
  const masteryCutoffScore = round((settings.masteryCutoffPercent / 100) * totalScore, settings.decimalPlaces);
  const gapToMasteryPoints = round(Math.max(0, masteryCutoffScore - studentScore), settings.decimalPlaces);
  return {
    totalScore: round(totalScore, settings.decimalPlaces),
    studentScore: round(studentScore, settings.decimalPlaces),
    percent,
    masteryCutoffPercent: settings.masteryCutoffPercent,
    masteryCutoffScore,
    gapToMasteryPoints,
    achievedMastery: studentScore >= masteryCutoffScore,
    passCutoffPercent: settings.passCutoffPercent,
    excellenceCutoffPercent: settings.excellenceCutoffPercent,
  };
}

function buildItemStatusSummary(questions: ValidatedQuestionResult[]): ItemStatusSummary {
  return {
    correctCount: questions.filter((question) => question.status === 'correct').length,
    partialCount: questions.filter((question) => question.status === 'partial').length,
    wrongCount: questions.filter((question) => question.status === 'wrong').length,
    omittedCount: questions.filter((question) => question.status === 'omitted').length,
    totalQuestions: questions.length,
  };
}

function buildJudgement(percent: number, settings: IndividualPerformanceSettings): string {
  if (percent >= settings.excellenceCutoffPercent) return 'متميزة وتحتاج إثراء';
  if (percent >= settings.masteryCutoffPercent) return 'متقنة وتحتاج تثبيتًا';
  if (percent >= settings.passCutoffPercent) return 'تحتاج دعمًا للوصول إلى الإتقان';
  return 'تحتاج تدخلًا علاجيًا';
}

function buildDynamicSkillFocusSuggestion(skill: string, percent: number, settings: IndividualPerformanceSettings): string {
  if (percent >= settings.excellenceCutoffPercent) {
    return `يُنصح بتقديم إثراء مناسب في مهارة ${skill} عبر مهمة أعمق أو سؤال مفتوح.`;
  }
  if (percent >= settings.masteryCutoffPercent) {
    return `تحتاج مهارة ${skill} إلى تثبيت قصير للحفاظ على مستوى الإتقان.`;
  }
  if (percent >= settings.passCutoffPercent) {
    return `تحتاج مهارة ${skill} إلى دعم موجه وتدريب متدرج للوصول إلى الإتقان.`;
  }
  return `تحتاج مهارة ${skill} إلى تدخل علاجي يبدأ بتبسيط المتطلب ثم تدريب موجه.`;
}

function buildSkills(questions: ValidatedQuestionResult[], settings: IndividualPerformanceSettings): SkillPerformanceResult[] {
  const map = new Map<string, { score: number; maxScore: number; questionCount: number }>();
  questions.forEach((question) => {
    const current = map.get(question.skill) || { score: 0, maxScore: 0, questionCount: 0 };
    current.score += question.score;
    current.maxScore += question.maxScore;
    current.questionCount += 1;
    map.set(question.skill, current);
  });

  return Array.from(map.entries())
    .map(([skill, values]) => {
      const percent = round(values.maxScore > 0 ? (values.score / values.maxScore) * 100 : 0, settings.decimalPlaces);
      const loss = round(values.maxScore - values.score, settings.decimalPlaces);
      return {
        skill,
        questionCount: values.questionCount,
        score: round(values.score, settings.decimalPlaces),
        maxScore: round(values.maxScore, settings.decimalPlaces),
        loss,
        percent,
        judgement: buildJudgement(percent, settings),
        focusSuggestion: buildDynamicSkillFocusSuggestion(skill, percent, settings),
        representationNote: values.questionCount === 1
          ? 'هذه المهارة ممثلة بمفردة واحدة؛ تُقرأ النتيجة بوصفها إشارة أولية.'
          : `هذه المهارة ممثلة ${formatArabicItemRepresentation(values.questionCount)}.`,
      };
    })
    .sort((a, b) => a.percent - b.percent || b.loss - a.loss || b.questionCount - a.questionCount || a.skill.localeCompare(b.skill, 'ar'));
}

function buildGroupedPerformance(
  questions: ValidatedQuestionResult[],
  settings: IndividualPerformanceSettings,
  keySelector: (question: ValidatedQuestionResult) => string,
): GroupPerformanceResult[] {
  const map = new Map<string, { score: number; maxScore: number; questionCount: number }>();
  questions.forEach((question) => {
    const key = keySelector(question) || 'غير محدد';
    const current = map.get(key) || { score: 0, maxScore: 0, questionCount: 0 };
    current.score += question.score;
    current.maxScore += question.maxScore;
    current.questionCount += 1;
    map.set(key, current);
  });

  return Array.from(map.entries())
    .map(([key, values]) => {
      const percent = round(values.maxScore > 0 ? (values.score / values.maxScore) * 100 : 0, settings.decimalPlaces);
      return {
        key,
        label: key,
        questionCount: values.questionCount,
        score: round(values.score, settings.decimalPlaces),
        maxScore: round(values.maxScore, settings.decimalPlaces),
        loss: round(values.maxScore - values.score, settings.decimalPlaces),
        percent,
        judgement: buildJudgement(percent, settings),
        representationNote: values.questionCount === 1
          ? 'الفئة ممثلة بمفردة واحدة؛ تُعامل النتيجة بوصفها إشارة أولية.'
          : `الفئة ممثلة ${formatArabicItemRepresentation(values.questionCount)}.`,
      };
    })
    .sort((a, b) => a.percent - b.percent || b.loss - a.loss || b.questionCount - a.questionCount || a.label.localeCompare(b.label, 'ar'));
}

function buildErrorPatterns(questions: ValidatedQuestionResult[], settings: IndividualPerformanceSettings): ErrorPatternResult[] {
  const incomplete = questions.filter((question) => question.status !== 'correct');
  const map = new Map<string, { count: number; questionLabels: Set<string>; skills: Set<string> }>();
  incomplete.forEach((question) => {
    if (isUncodedError(question.errorType)) return;
    const current = map.get(question.errorType) || { count: 0, questionLabels: new Set<string>(), skills: new Set<string>() };
    current.count += 1;
    current.questionLabels.add(question.label);
    current.skills.add(question.skill);
    map.set(question.errorType, current);
  });
  const total = Array.from(map.values()).reduce((sum, value) => sum + value.count, 0);
  return Array.from(map.entries())
    .map(([errorType, values]) => ({
      errorType,
      count: values.count,
      percent: round(total > 0 ? (values.count / total) * 100 : 0, settings.decimalPlaces),
      questionLabels: Array.from(values.questionLabels),
      skills: Array.from(values.skills),
    }))
    .sort((a, b) => b.count - a.count || b.percent - a.percent || a.errorType.localeCompare(b.errorType, 'ar'));
}

function buildCodingCompleteness(questions: ValidatedQuestionResult[], settings: IndividualPerformanceSettings): CodingCompletenessResult {
  const incomplete = questions.filter((question) => question.status !== 'correct');
  const coded = incomplete.filter((question) => !isUncodedError(question.errorType));
  const percent = round(incomplete.length > 0 ? (coded.length / incomplete.length) * 100 : 100, settings.decimalPlaces);
  let label = 'ترميز قوي للأخطاء';
  let message = 'يسمح هذا المستوى بقراءة تربوية مناسبة لأن معظم المفردات غير المكتملة لها نوع خطأ محدد.';
  if (percent < 40) {
    label = 'ترميز محدود للأخطاء';
    message = 'قراءة أسباب التعثر محدودة بسبب نقص ترميز الأخطاء؛ يفضل إدخال نوع الخطأ للمفردات غير المكتملة.';
  } else if (percent < 70) {
    label = 'ترميز متوسط للأخطاء';
    message = 'يمكن بناء قراءة أولية، لكن دقة التشخيص تتحسن عند اكتمال ترميز الأخطاء.';
  }
  return {
    incompleteItemsCount: incomplete.length,
    codedIncompleteItemsCount: coded.length,
    percent,
    label,
    message,
  };
}

function buildTeacherNotes(questions: ValidatedQuestionResult[]): TeacherNoteEvidence[] {
  return questions
    .filter((question) => question.teacherNote.trim().length > 0)
    .map((question) => ({
      questionId: question.id,
      questionLabel: question.label,
      skill: question.skill,
      percent: question.percent,
      loss: question.loss,
      errorType: question.errorType,
      note: question.teacherNote,
    }))
    .sort((a, b) => b.loss - a.loss || a.percent - b.percent || a.questionLabel.localeCompare(b.questionLabel, 'ar'));
}

function buildReadingQuality(
  questions: ValidatedQuestionResult[],
  skills: SkillPerformanceResult[],
  categories: GroupPerformanceResult[],
  levels: GroupPerformanceResult[],
  codingCompleteness: CodingCompletenessResult,
): IndividualReadingQualityResult {
  const totalQuestions = questions.length;
  const representedSkills = skills.length;
  const singleItemSkills = skills.filter((skill) => skill.questionCount === 1).length;
  const cautions: string[] = [];

  if (totalQuestions < 5) cautions.push('عدد المفردات أقل من 5، لذلك تبقى القراءة محدودة.');
  if (representedSkills < 2) cautions.push('الورقة لا تمثل إلا مهارة واحدة.');
  if (singleItemSkills > 0) cautions.push(buildSingleItemSkillsCaution(singleItemSkills));
  if (categories.length < 2) cautions.push('أنواع الأسئلة محدودة التمثيل.');
  if (levels.length < 2) cautions.push('مستويات الأسئلة محدودة التمثيل.');
  if (codingCompleteness.incompleteItemsCount > 0 && codingCompleteness.percent < 70) {
    cautions.push('ترميز الأخطاء غير مكتمل بما يكفي لبناء تشخيص قوي.');
  }

  const good =
    totalQuestions >= 10 &&
    representedSkills >= 3 &&
    singleItemSkills <= Math.floor(representedSkills / 2) &&
    categories.length >= 2 &&
    levels.length >= 2 &&
    codingCompleteness.percent >= 70;
  const cautious =
    totalQuestions >= 5 &&
    representedSkills >= 2 &&
    categories.length >= 2 &&
    levels.length >= 2 &&
    codingCompleteness.percent >= 40;

  if (good) {
    return {
      code: 'good',
      label: 'قراءة فردية جيدة',
      message: 'البيانات مكتملة، والورقة تمثل عددًا مناسبًا من المفردات والمهارات والأنواع والمستويات. تبقى النتيجة خاصة بهذه الورقة ولا تُعمم منفردة على مستوى الطالب العام.',
      totalQuestions,
      representedSkills,
      singleItemSkills,
      representedQuestionCategories: categories.length,
      representedQuestionLevels: levels.length,
      codingCompletenessPercent: codingCompleteness.percent,
      cautions,
    };
  }

  if (cautious) {
    return {
      code: 'cautious',
      label: 'قراءة فردية مقبولة بحذر',
      message: `البيانات مكتملة، لكن بعض جوانب التمثيل محدودة. ${cautions.join(' ')}`.trim(),
      totalQuestions,
      representedSkills,
      singleItemSkills,
      representedQuestionCategories: categories.length,
      representedQuestionLevels: levels.length,
      codingCompletenessPercent: codingCompleteness.percent,
      cautions,
    };
  }

  return {
    code: 'limited',
    label: 'قراءة فردية محدودة',
    message: `تُستخدم النتيجة بوصفها إشارة أولية فقط. ${cautions.join(' ')}`.trim(),
    totalQuestions,
    representedSkills,
    singleItemSkills,
    representedQuestionCategories: categories.length,
    representedQuestionLevels: levels.length,
    codingCompletenessPercent: codingCompleteness.percent,
    cautions,
  };
}

function compareSkillPriority(a: SkillPerformanceResult, b: SkillPerformanceResult): number {
  return a.percent - b.percent || b.loss - a.loss || b.questionCount - a.questionCount || a.skill.localeCompare(b.skill, 'ar');
}

function buildDataPriorityReason(
  skill: SkillPerformanceResult,
  settings: IndividualPerformanceSettings,
  tiedAtSamePerformance: boolean,
): string {
  const tieNote = tiedAtSamePerformance
    ? ' تشترك مع مهارة أخرى في نسبة الأداء، وقد قُدّمت في الترتيب بسبب ارتفاع الفقد أو قوة تمثيلها في الورقة.'
    : '';
  if (skill.percent < settings.passCutoffPercent) {
    return `تُقدَّم مهارة ${skill.skill} بوصفها أولوية علاجية؛ لأن أداءها أقل من حد النجاح المعتمد، مع فقد قدره ${skill.loss} درجة.${tieNote}`;
  }
  if (skill.percent < settings.masteryCutoffPercent) {
    return `تُقدَّم مهارة ${skill.skill} ضمن خطة دعم ورفع؛ لأنها لم تبلغ حد الإتقان بعد، مع فقد قدره ${skill.loss} درجة.${tieNote}`;
  }
  if (skill.percent < settings.excellenceCutoffPercent) {
    return `تظهر مهارة ${skill.skill} كأولوية تثبيت بسبب وجود فقد محدود رغم تحقق الإتقان.${tieNote}`;
  }
  return `تظهر مهارة ${skill.skill} ضمن المتابعة الإثرائية للحفاظ على جودة الأداء.${tieNote}`;
}

function buildPriorities(skills: SkillPerformanceResult[], settings: IndividualPerformanceSettings) {
  const candidates = skills
    .filter((skill) => skill.maxScore > 0 && (skill.percent < settings.excellenceCutoffPercent || skill.loss > 0))
    .sort(compareSkillPriority);

  return candidates.slice(0, 3).map((skill, index) => {
    const tiedAtSamePerformance = candidates.some(
      (other) => other.skill !== skill.skill && Math.abs(other.percent - skill.percent) < 0.000001,
    );
    return {
      rank: index + 1,
      skill: skill.skill,
      percent: skill.percent,
      loss: skill.loss,
      reason: buildDataPriorityReason(skill, settings, tiedAtSamePerformance),
    };
  });
}

export function runIndividualPerformanceAnalysis(
  context: IndividualReportContext,
  blueprint: ExamQuestionBlueprint[],
  studentInputs: StudentQuestionInput[],
  settingsInput?: Partial<IndividualPerformanceSettings>,
): IndividualPerformanceAnalysisResult {
  const settings = resolveSettings(settingsInput);
  const inspected = inspectIndividualAnalysisInputs(blueprint, studentInputs, settings);
  if (!inspected.readiness.isValid) {
    const firstIssue = inspected.readiness.issues[0]?.message || 'بيانات التحليل غير مكتملة أو غير صالحة.';
    throw new Error(firstIssue);
  }

  const questions = inspected.questions;
  const summary = buildSummary(questions, settings);
  const level = getPerformanceLevel(summary.percent, settings);
  const itemStatus = buildItemStatusSummary(questions);
  const topLossItems = [...questions]
    .filter((question) => question.loss > 0)
    .sort((a, b) => b.loss - a.loss || a.percent - b.percent || a.label.localeCompare(b.label, 'ar'))
    .slice(0, 8);
  const skills = buildSkills(questions, settings);
  const questionCategories = buildGroupedPerformance(questions, settings, (question) => question.questionCategory);
  const questionLevels = buildGroupedPerformance(questions, settings, (question) => question.questionLevel);
  const errorPatterns = buildErrorPatterns(questions, settings);
  const teacherNotes = buildTeacherNotes(questions);
  const codingCompleteness = buildCodingCompleteness(questions, settings);
  const readingQuality = buildReadingQuality(questions, skills, questionCategories, questionLevels, codingCompleteness);
  const priorities = buildPriorities(skills, settings);
  const plan = buildPlan(level, priorities);
  const baseResult = {
    context,
    settings,
    validation: inspected.readiness,
    questions,
    summary,
    level,
    itemStatus,
    topLossItems,
    skills,
    questionCategories,
    questionLevels,
    errorPatterns,
    teacherNotes,
    codingCompleteness,
    readingQuality,
    priorities,
    plan,
  };
  return { ...baseResult, narratives: buildNarratives(baseResult) };
}

export function getStatusLabel(status: ItemStatus): string {
  switch (status) {
    case 'correct':
      return 'صحيحة';
    case 'partial':
      return 'جزئية';
    case 'wrong':
      return 'خاطئة';
    case 'omitted':
      return 'متروكة';
    default:
      return 'غير محددة';
  }
}

export function getPerformanceLevelCode(
  percent: number,
  settingsInput?: Partial<IndividualPerformanceSettings>,
): PerformanceLevelCode {
  return getPerformanceLevel(percent, resolveSettings(settingsInput)).code;
}

export function isKnownErrorType(value: string): boolean {
  return (ERROR_TYPE_OPTIONS as readonly string[]).includes(value);
}
