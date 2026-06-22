import type { DiagnosticDecision, FishboneDiagnostic, ParetoEntry, RadarSkillEntry } from '../shared/diagnosticTypes';

export type IndividualPerformanceTab =
  | 'student-paper'
  | 'exam-structure'
  | 'student-scores'
  | 'overview'
  | 'analysis'
  | 'report';

export type PerformanceLevelCode = 'remedial' | 'support' | 'mastery' | 'excellent';
export type ItemStatus = 'correct' | 'partial' | 'wrong' | 'omitted';
export type ReadingQualityCode = 'limited' | 'cautious' | 'good';
export type ValidationIssueCode =
  | 'missing_blueprint'
  | 'duplicate_question_id'
  | 'invalid_max_score'
  | 'missing_skill'
  | 'missing_score'
  | 'non_numeric_score'
  | 'negative_score'
  | 'score_above_max'
  | 'omitted_with_positive_score'
  | 'missing_other_error_detail'
  | 'invalid_pass_cutoff'
  | 'invalid_mastery_cutoff'
  | 'invalid_excellence_cutoff'
  | 'invalid_cutoff_order';

export interface IndividualReportContext {
  educationDirectorate: string;
  schoolName: string;
  subject: string;
  grade: string;
  section: string;
  studentName: string;
  paperTitle: string;
  assessmentType: string;
  teacherName?: string;
  academicYear: string;
  analysisDate: string;
}

export interface IndividualPerformanceSettings {
  masteryCutoffPercent: number;
  passCutoffPercent: number;
  excellenceCutoffPercent: number;
  decimalPlaces: number;
}

export interface ExamQuestionBlueprint {
  id: string;
  label: string;
  maxScore: number | '';
  skill: string;
}

export interface StudentQuestionInput {
  questionId: string;
  score: number | string;
  errorType?: string;
  otherErrorDetail?: string;
  teacherNote?: string;
}

export interface ValidatedQuestionResult {
  id: string;
  label: string;
  maxScore: number;
  score: number;
  skill: string;
  errorType: string;
  otherErrorDetail: string;
  teacherNote: string;
  loss: number;
  percent: number;
  status: ItemStatus;
  priority: 'لا تحتاج أولوية خاصة' | 'أولوية منخفضة' | 'أولوية متوسطة' | 'أولوية عالية';
}

export interface ValidationIssue {
  code?: ValidationIssueCode;
  questionId?: string;
  questionLabel?: string;
  field?:
    | 'maxScore'
    | 'skill'
    | 'score'
    | 'errorType'
    | 'otherErrorDetail'
    | 'passCutoffPercent'
    | 'masteryCutoffPercent'
    | 'excellenceCutoffPercent';
  message: string;
  minValue?: number;
  maxValue?: number;
  actualValue?: number | string;
}

export interface AnalysisReadinessResult {
  isValid: boolean;
  totalQuestionCount: number;
  completedScoreCount: number;
  emptyScoreCount: number;
  invalidScoreCount: number;
  invalidBlueprintCount: number;
  excludedQuestionCount: number;
  settingsValid: boolean;
  validQuestionCount: number;
  issueCount: number;
  issues: ValidationIssue[];
  warnings: string[];
}

export interface ValidationSummary extends AnalysisReadinessResult {}

export interface PerformanceLevel {
  code: PerformanceLevelCode;
  label: string;
  planType: string;
  minPercent: number;
  maxPercent: number;
  colorClass: string;
}

export interface GeneralSummary {
  totalScore: number;
  studentScore: number;
  percent: number;
  masteryCutoffPercent: number;
  masteryCutoffScore: number;
  gapToMasteryPoints: number;
  achievedMastery: boolean;
  passCutoffPercent: number;
  excellenceCutoffPercent: number;
}

export interface ItemStatusSummary {
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  omittedCount: number;
  totalQuestions: number;
}

export interface SkillPerformanceResult {
  skill: string;
  questionCount: number;
  score: number;
  maxScore: number;
  loss: number;
  percent: number;
  judgement: string;
  focusSuggestion: string;
  representationNote: string;
}

export interface ErrorPatternResult {
  errorType: string;
  count: number;
  percent: number;
  questionLabels: string[];
  skills: string[];
}

export interface TeacherNoteEvidence {
  questionId: string;
  questionLabel: string;
  skill: string;
  percent: number;
  loss: number;
  errorType: string;
  note: string;
}

export interface CodingCompletenessResult {
  incompleteItemsCount: number;
  codedIncompleteItemsCount: number;
  percent: number;
  label: string;
  message: string;
}

export interface IndividualReadingQualityResult {
  code: ReadingQualityCode;
  label: string;
  message: string;
  totalQuestions: number;
  representedSkills: number;
  singleItemSkills: number;
  codingCompletenessPercent: number;
  cautions: string[];
}

export interface InterventionPriority {
  rank: number;
  skill: string;
  percent: number;
  loss: number;
  reason: string;
}

export interface IndividualPlan {
  type: string;
  duration: string;
  title: string;
  studentMessage: string;
  parentRole: string[];
  teacherRole: string[];
  studentActions: string[];
  evidenceOfImprovement: string;
  firstPriority?: InterventionPriority;
  secondPriority?: InterventionPriority;
  laterStage?: InterventionPriority;
}

export interface IndividualReportNarratives {
  executiveSummary: string;
  educationalMeaning: string;
  proposedAction: string;
  diagnosisIndicator: string;
  limitationsNote: string;
  teacherNotesReading: string;
}

export interface IndividualPerformanceDiagnosticInsights {
  itemLossPareto: ParetoEntry[];
  skillLossPareto: ParetoEntry[];
  errorPareto: ParetoEntry[];
  skillRadar: RadarSkillEntry[];
  fishbone: FishboneDiagnostic;
  decision: DiagnosticDecision;
}

export interface IndividualPerformanceAnalysisResult {
  context: IndividualReportContext;
  settings: IndividualPerformanceSettings;
  validation: ValidationSummary;
  questions: ValidatedQuestionResult[];
  summary: GeneralSummary;
  level: PerformanceLevel;
  itemStatus: ItemStatusSummary;
  topLossItems: ValidatedQuestionResult[];
  skills: SkillPerformanceResult[];
  errorPatterns: ErrorPatternResult[];
  teacherNotes: TeacherNoteEvidence[];
  codingCompleteness: CodingCompletenessResult;
  readingQuality: IndividualReadingQualityResult;
  priorities: InterventionPriority[];
  plan: IndividualPlan;
  diagnostics: IndividualPerformanceDiagnosticInsights;
  narratives: IndividualReportNarratives;
}
