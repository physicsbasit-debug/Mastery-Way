export type LegacyAnalysisTabKey =
  | 'input'
  | 'overview'
  | 'distribution'
  | 'specialized'
  | 'risk_recommendations'
  | 'reports';

export type AnalysisTabLabel = {
  id: LegacyAnalysisTabKey;
  title: string;
  description: string;
};

export const ANALYSIS_TAB_LABELS: AnalysisTabLabel[] = [
  { id: 'input', title: 'إدخال البيانات', description: 'إدخال البيانات الأساسية قبل التحليل.' },
  { id: 'overview', title: 'الملخص العام', description: 'عرض المؤشرات العامة بعد التحليل.' },
  { id: 'distribution', title: 'التوزيع والتحليلات', description: 'عرض الرسوم والتحليلات الداعمة.' },
  { id: 'specialized', title: 'التحليل التخصصي', description: 'عرض المؤشرات التفصيلية عند الحاجة.' },
  { id: 'risk_recommendations', title: 'القرار والتوصيات', description: 'عرض القرار التربوي والتوصيات.' },
  { id: 'reports', title: 'التقارير', description: 'عرض التقرير القابل للطباعة.' },
];

export const analysisTabLabels = ANALYSIS_TAB_LABELS;
export default ANALYSIS_TAB_LABELS;
