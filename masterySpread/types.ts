export type MasteryJudgementCode =
  | 'distinguished'
  | 'good'
  | 'adequate'
  | 'not_adequate'
  | 'rapid_intervention';

export type InterventionPriority = 'low' | 'medium' | 'medium_high' | 'high' | 'urgent';

export type GroupDecisionType =
  | 'enrichment'
  | 'raise_to_excellence'
  | 'targeted_support'
  | 'remedial_plan'
  | 'urgent_intervention';

export type ImprovementOpportunity = 'high' | 'medium' | 'limited' | 'none';
export type NumericInputValue = number | '';

export type InvalidScoreReason =
  | 'empty_value'
  | 'not_numeric'
  | 'negative_score'
  | 'above_total_score';

export type MasterySpreadValidationIssueCode =
  | 'no_scores'
  | 'invalid_total_score'
  | 'invalid_mastery_cutoff'
  | 'invalid_near_margin'
  | 'invalid_deep_gap_margin'
  | 'overlapping_gap_margins'
  | 'deep_gap_margin_above_cutoff'
  | 'invalid_expected_count'
  | 'expected_count_mismatch'
  | 'invalid_scores_present';

export interface MasterySpreadSettings {
  totalScore: NumericInputValue;
  masteryCutoffPercent: NumericInputValue;
  nearMasteryMargin?: NumericInputValue;
  deepGapMargin?: NumericInputValue;
  expectedStudentCount?: NumericInputValue;
  decimalPlaces?: number;
}

export interface NormalizedMasterySpreadSettings {
  totalScore: number;
  masteryCutoffPercent: number;
  nearMasteryMargin: number;
  deepGapMargin: number;
  expectedStudentCount?: number;
  decimalPlaces: number;
}

export interface MasterySpreadContext {
  educationDirectorate?: string;
  schoolName?: string;
  teacherName?: string;
  academicYear?: string;
  analysisDate?: string;
  groupDescription?: string;
  subject?: string;
  grade?: string;
  assessmentName?: string;
}

export interface MasterySpreadAnalysisInput {
  rawScoresText?: string;
  scores?: number[];
  settings: MasterySpreadSettings;
  context?: MasterySpreadContext;
}

export interface ValidScoreRecord {
  index: number;
  score: number;
  rawPercent: number;
  percent: number;
  isMastery: boolean;
  rawGapToMasteryPercent: number;
  gapToMasteryPercent: number;
}

export interface InvalidScoreRecord {
  index: number;
  position: number;
  rawValue: string;
  reason: InvalidScoreReason;
  message: string;
}

export interface MasterySpreadValidationIssue {
  code: MasterySpreadValidationIssueCode;
  message: string;
}

export interface ValidationSummary {
  valid: boolean;
  totalTokens: number;
  validCount: number;
  invalidCount: number;
  invalidRecords: InvalidScoreRecord[];
  issues: MasterySpreadValidationIssue[];
  warnings: string[];
  expectedStudentCount?: number;
  missingScoresCount: number;
  extraScoresCount: number;
  completionPercent: number;
}


export interface MasterySpreadReadiness {
  validation: ValidationSummary;
  validScores: ValidScoreRecord[];
  normalizedSettings: NormalizedMasterySpreadSettings | null;
}

export interface MasteryJudgement {
  code: MasteryJudgementCode;
  label: string;
  minPercent: number;
  maxPercent: number;
  rank: number;
  priority: InterventionPriority;
  decisionType: GroupDecisionType;
  shortDescription: string;
}

export interface BasicStatistics {
  meanPercent: number;
  medianPercent: number;
  minPercent: number;
  maxPercent: number;
  rangePercent: number;
  standardDeviationPercent: number;
}

export interface MasterySpreadSummary {
  totalStudents: number;
  masteryCount: number;
  nonMasteryCount: number;
  rawMasterySpreadPercent: number;
  masterySpreadPercent: number;
  masteryCutoffPercent: number;
  totalScore: number;
  masteryCutoffScore: number;
  minimumWholeScoreForMastery: number;
}

export interface MasteryDistributionBand {
  key: 'mastery' | 'near_mastery' | 'moderate_gap' | 'deep_gap';
  label: string;
  count: number;
  rawPercent: number;
  percent: number;
  minPercent: number;
  maxPercent: number;
  interpretation: string;
}

export interface HistogramBucket {
  key: string;
  label: string;
  minPercent: number;
  maxPercent: number;
  count: number;
  rawPercent: number;
  percent: number;
}

export interface GapToNextLevel {
  hasNextLevel: boolean;
  currentJudgement: MasteryJudgementCode;
  nextJudgement?: MasteryJudgementCode;
  nextJudgementLabel?: string;
  requiredSpreadPercent?: number;
  rawCurrentSpreadPercent: number;
  currentSpreadPercent: number;
  rawGapPoints: number;
  gapPoints: number;
  requiredMasteryCount?: number;
  additionalStudentsNeeded: number;
  message: string;
}

export interface GroupShapeAnalysis {
  dispersionLevel: 'low' | 'medium' | 'high';
  dispersionLabel: string;
  nearMasteryCount: number;
  nearMasteryPercent: number;
  deepGapCount: number;
  deepGapPercent: number;
  improvementOpportunity: ImprovementOpportunity;
  interpretation: string;
}

export interface GroupDataQuality {
  label: 'بيانات مكتملة' | 'بيانات مكتملة لمجموعة صغيرة';
  expectedStudentCount?: number;
  enteredStudentCount: number;
  completenessPercent: number;
  singleStudentImpactPoints: number;
  interpretation: string;
}

export interface EducationalDecision {
  judgement: MasteryJudgement;
  priority: InterventionPriority;
  priorityLabel: string;
  decisionType: GroupDecisionType;
  decisionLabel: string;
  interpretation: string;
  recommendations: string[];
  retestRecommendation: string;
}

export interface ProposedGroupPlan {
  title: string;
  duration: string;
  implementationMode: string;
  activities: string[];
  assessmentTool: string;
  successCriterion: string;
  followUp: string;
}

export interface MasterySpreadReport {
  title: string;
  summaryText: string;
  educationalReading: string;
  finalRecommendation: string;
  printableSections: string[];
}

export interface MasterySpreadAnalysisResult {
  context: Required<MasterySpreadContext>;
  settings: NormalizedMasterySpreadSettings;
  validation: ValidationSummary;
  validScores: ValidScoreRecord[];
  summary: MasterySpreadSummary;
  statistics: BasicStatistics;
  judgement: MasteryJudgement;
  distribution: MasteryDistributionBand[];
  histogram: HistogramBucket[];
  gapToNextLevel: GapToNextLevel;
  groupShape: GroupShapeAnalysis;
  dataQuality: GroupDataQuality;
  educationalDecision: EducationalDecision;
  proposedPlan: ProposedGroupPlan;
  report: MasterySpreadReport;
}
