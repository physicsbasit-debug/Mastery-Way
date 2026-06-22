export type DiagnosticConfidence = 'limited' | 'cautious' | 'adequate' | 'strong';

export interface ParetoEntry {
  label: string;
  value: number;
  sharePercent: number;
  cumulativePercent: number;
  rank: number;
  note?: string;
}

export interface RadarSkillEntry {
  skill: string;
  percent: number;
  itemCount?: number;
  note?: string;
}

export interface FishboneCategory {
  title: string;
  prompts: string[];
  evidence?: string;
}

export interface FishboneDiagnostic {
  title: string;
  caution: string;
  categories: FishboneCategory[];
}

export interface DiagnosticDecision {
  priorityTitle: string;
  priorityTarget: string;
  reason: string;
  recommendedAction: string;
  retestEvidence: string;
  confidence: DiagnosticConfidence;
  caution: string;
}
