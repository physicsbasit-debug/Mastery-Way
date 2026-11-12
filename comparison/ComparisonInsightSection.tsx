import { useMemo } from "react";
import type { ComparisonResult } from "./comparisonTypes";
import AnalysisSectionCard from "../shared/AnalysisSectionCard";
import EducationalSummaryCard, {
  EducationalSummaryItem,
} from "../shared/EducationalSummaryCard";
import {
  buildComparisonDecisionPackage,
  type ComparisonRecommendation,
} from "./comparisonInsights";

interface ComparisonInsightSectionProps {
  result: ComparisonResult;
}

function getPriorityClasses(
  priority: ComparisonRecommendation["priority"]
): string {
  switch (priority) {
    case "high":
      return "border border-red-200 bg-red-100 text-red-700";
    case "medium":
      return "border border-amber-200 bg-amber-100 text-amber-700";
    case "low":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getPriorityLabel(priority: ComparisonRecommendation["priority"]): string {
  switch (priority) {
    case "high":
      return "عالية";
    case "medium":
      return "متوسطة";
    case "low":
      return "منخفضة";
    default:
      return priority;
  }
}

function getTypeLabel(type: ComparisonRecommendation["type"]): string {
  switch (type) {
    case "remedial":
      return "علاجي";
    case "preventive":
      return "وقائي";
    case "stabilization":
      return "تثبيتي";
    case "enrichment":
      return "إثرائي";
    default:
      return type;
  }
}

export default function ComparisonInsightSection({
  result,
}: ComparisonInsightSectionProps) {
  const decisionPackage = useMemo(
    () => buildComparisonDecisionPackage(result),
    [result]
  );

  const summaryItems: EducationalSummaryItem[] = [
    {
      title: "الخلاصة المقارنة",
      text: decisionPackage.summary.headline,
    },
    {
      title: "التفسير التربوي",
      text: decisionPackage.summary.interpretation,
    },
    {
      title: "تلميح القرار",
      text: decisionPackage.summary.decisionHint,
    },
  ];

  return (
    <AnalysisSectionCard
      title="التفسير التربوي للمقارنة"
      subtitle="قراءة تفسيرية وتوصيات مختصرة مبنية على فروقات المتوسط والإتقان والخطر والتشتت."
    >
      <EducationalSummaryCard items={summaryItems} />

      <div className="mt-6 space-y-4">
        {decisionPackage.recommendations.map((item, index) => (
          <div
            key={`${item.type}_${index}`}
            className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-right">
                <div className="text-sm font-extrabold text-slate-900">
                  توصية {getTypeLabel(item.type)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  مستوى الأولوية: {getPriorityLabel(item.priority)}
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                  item.priority
                )}`}
              >
                {getPriorityLabel(item.priority)}
              </span>
            </div>

            <div className="mt-4 text-sm leading-8 text-slate-700">
              {item.message}
            </div>
          </div>
        ))}
      </div>
    </AnalysisSectionCard>
  );
}
