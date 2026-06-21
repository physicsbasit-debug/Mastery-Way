export type SampleReliabilityLevel = 'very_low' | 'limited' | 'cautious' | 'good' | 'strong' | 'complete';
export type ItemPriorityLevel = 'عالية' | 'متوسطة' | 'منخفضة' | 'مستقرة';
export type DataCompletenessLevel = 'low' | 'cautious' | 'good' | 'complete';

export interface ExamItemsSampleContext {
  educationDirectorate: string;
  schoolName: string;
  subject: string;
  grade: string;
  paperTitle: string;
  assessmentType: string;
  teacherName: string;
  academicYear: string;
  analysisDate: string;
  masteryCutoffPercent: number;
  totalPapers: number;
  sampleSize: number;
  analysisMethod: string;
  sampleSelectionMethod: string;
}

export interface ExamItemDefinition {
  id: string;
  label: string;
  maxScore: number | '';
  skill: string;
}

export interface SampleScoreRow {
  id: string;
  label: string;
  scores: Record<string, number | ''>;
}

export interface ValidationIssue {
  scope: 'context' | 'items' | 'scores';
  message: string;
}

export type ScoreCellIssueType = 'empty' | 'not_numeric' | 'negative' | 'above_max';

export interface ScoreCellIssue {
  rowId: string;
  rowLabel: string;
  rowIndex: number;
  itemId: string;
  itemLabel: string;
  itemIndex: number;
  maxScore: number;
  type: ScoreCellIssueType;
  message: string;
}

export interface AnalysisReadinessResult {
  valid: boolean;
  issues: ValidationIssue[];
  cellIssues: ScoreCellIssue[];
  totalCells: number;
  completedCells: number;
  emptyCells: number;
  invalidCells: number;
  excludedItems: number;
}

export interface SampleReliabilityResult {
  totalPapers: number;
  sampleSize: number;
  samplePercent: number;
  recommendedSampleSize: number;
  level: SampleReliabilityLevel;
  label: string;
  message: string;
  warning?: string;
}

export interface DataCompletenessResult {
  totalScoreCells: number;
  validScoreCells: number;
  invalidScoreCells: number;
  completionPercent: number;
  level: DataCompletenessLevel;
  label: string;
  message: string;
  warning?: string;
}

export interface BalanceReadingResult {
  skillReading: string;
  overallReading: string;
}

export interface ItemAnalysisResult {
  itemId: string;
  label: string;
  skill: string;
  maxScore: number;
  totalAvailable: number;
  totalAchieved: number;
  totalLoss: number;
  averageScore: number;
  performancePercent: number;
  zeroCount: number;
  zeroPercent: number;
  fullCount: number;
  fullPercent: number;
  partialCount: number;
  partialPercent: number;
  standardDeviation: number;
  bandLabel: string;
  priority: ItemPriorityLevel;
  interpretation: string;
}

export interface SkillAnalysisResult {
  skill: string;
  itemCount: number;
  totalScore: number;
  totalAvailable: number;
  totalAchieved: number;
  totalLoss: number;
  performancePercent: number;
  judgement: string;
  recommendation: string;
}

export interface BalanceEntry {
  name: string;
  itemCount: number;
  scoreWeight: number;
  scoreWeightPercent: number;
}

export interface ExamItemsSampleSummary {
  totalItems: number;
  excludedItems: number;
  sampleSize: number;
  paperTotalScore: number;
  totalAvailable: number;
  totalAchieved: number;
  totalLoss: number;
  averagePaperScore: number;
  averagePaperPercent: number;
  masteryCutoffPercent: number;
  masteryCutoffScore: number;
}

export interface ExamItemsSampleDecision {
  overallReading: string;
  teachingDecision: string;
  paperReviewDecision: string;
  priorityItems: ItemAnalysisResult[];
  lowestPerformanceItems: ItemAnalysisResult[];
  highestLossItems: ItemAnalysisResult[];
  prioritySkills: SkillAnalysisResult[];
  recommendations: string[];
  nextSteps: string[];
}

export interface ExamItemsSampleAnalysisResult {
  context: ExamItemsSampleContext;
  items: ItemAnalysisResult[];
  skills: SkillAnalysisResult[];
  skillBalance: BalanceEntry[];
  reliability: SampleReliabilityResult;
  dataCompleteness: DataCompletenessResult;
  summary: ExamItemsSampleSummary;
  balanceReading: BalanceReadingResult;
  decision: ExamItemsSampleDecision;
  validation: {
    valid: boolean;
    issues: ValidationIssue[];
    validScoreCells: number;
    invalidScoreCells: number;
  };
}
