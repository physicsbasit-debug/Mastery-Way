import type {
  CumulativePoint,
  ParetoPoint,
  QualityMetricItem,
  ThresholdGapPoint,
  UnifiedBoxPlotStats,
  UnifiedInsightModel,
} from "./analyticsVisualTypes";
import EducationalSummaryCard from "./EducationalSummaryCard";
import AnalysisSectionCard from "./AnalysisSectionCard";

function statusClasses(status: QualityMetricItem["status"]): string {
  switch (status) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "watch":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "risk":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function convertInsight(insight: UnifiedInsightModel) {
  return [
    { title: "ماذا تعني البيانات؟", text: insight.meaning },
    { title: "أهميتها للعملية التعليمية", text: insight.importance },
    { title: "الإجراء المقترح", text: insight.action },
  ];
}

function DataTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[22px] border border-slate-200/80 bg-white shadow-sm">
      {children}
    </div>
  );
}

function SectionSpacer({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

export function UnifiedCumulativeChartCard({
  title,
  subtitle,
  points,
  insight,
}: {
  title: string;
  subtitle?: string;
  points: CumulativePoint[];
  insight: UnifiedInsightModel;
}) {
  return (
    <AnalysisSectionCard title={title} subtitle={subtitle}>
      <SectionSpacer>
        <DataTableShell>
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-right text-slate-500">
                <th className="px-4 py-3">النطاق</th>
                <th className="px-4 py-3">العدد</th>
                <th className="px-4 py-3">التراكمي</th>
                <th className="px-4 py-3">النسبة التراكمية</th>
              </tr>
            </thead>
            <tbody>
              {points.map((item) => (
                <tr
                  key={item.label}
                  className="border-b border-slate-100 text-right last:border-b-0"
                >
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.count}
                  </td>
                  <td className="px-4 py-3">{item.cumulativeCount}</td>
                  <td className="px-4 py-3">{item.cumulativePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>

        <EducationalSummaryCard items={convertInsight(insight)} />
      </SectionSpacer>
    </AnalysisSectionCard>
  );
}

export function UnifiedThresholdGapCard({
  title,
  subtitle,
  points,
  insight,
}: {
  title: string;
  subtitle?: string;
  points: ThresholdGapPoint[];
  insight: UnifiedInsightModel;
}) {
  return (
    <AnalysisSectionCard title={title} subtitle={subtitle}>
      <SectionSpacer>
        <div className="space-y-3.5">
          {points.map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="font-bold text-slate-900">{item.label}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.side === "above"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.side === "below"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  الفجوة: {item.gapValue}
                </span>
              </div>
            </div>
          ))}
        </div>

        <EducationalSummaryCard items={convertInsight(insight)} />
      </SectionSpacer>
    </AnalysisSectionCard>
  );
}

export function UnifiedParetoCard({
  title,
  subtitle,
  points,
  insight,
}: {
  title: string;
  subtitle?: string;
  points: ParetoPoint[];
  insight: UnifiedInsightModel;
}) {
  return (
    <AnalysisSectionCard title={title} subtitle={subtitle}>
      <SectionSpacer>
        <DataTableShell>
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-right text-slate-500">
                <th className="px-4 py-3">العنصر</th>
                <th className="px-4 py-3">القيمة</th>
                <th className="px-4 py-3">النسبة التراكمية</th>
              </tr>
            </thead>
            <tbody>
              {points.map((item) => (
                <tr
                  key={item.label}
                  className="border-b border-slate-100 text-right last:border-b-0"
                >
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.value}
                  </td>
                  <td className="px-4 py-3">{item.cumulativePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>

        <EducationalSummaryCard items={convertInsight(insight)} />
      </SectionSpacer>
    </AnalysisSectionCard>
  );
}

export function UnifiedBoxPlotCard({
  title,
  subtitle,
  stats,
  insight,
}: {
  title: string;
  subtitle?: string;
  stats: UnifiedBoxPlotStats;
  insight: UnifiedInsightModel;
}) {
  return (
    <AnalysisSectionCard title={title} subtitle={subtitle}>
      <SectionSpacer>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricBox label="أدنى قيمة" value={stats.min} />
          <MetricBox label="Q1" value={stats.q1} />
          <MetricBox label="الوسيط" value={stats.median} />
          <MetricBox label="Q3" value={stats.q3} />
          <MetricBox label="أعلى قيمة" value={stats.max} />
          <MetricBox label="المدى" value={stats.range} />
          <MetricBox label="IQR" value={stats.iqr} />
          <MetricBox label="الانحراف المعياري" value={stats.stdDev ?? "—"} />
        </div>

        {stats.outliers && stats.outliers.length > 0 ? (
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
            <span className="font-bold text-slate-900">القيم الشاذة:</span>{" "}
            {stats.outliers.join("، ")}
          </div>
        ) : null}

        <EducationalSummaryCard items={convertInsight(insight)} />
      </SectionSpacer>
    </AnalysisSectionCard>
  );
}

export function UnifiedQualityMetricsCard({
  title,
  subtitle,
  items,
  insight,
}: {
  title: string;
  subtitle?: string;
  items: QualityMetricItem[];
  insight: UnifiedInsightModel;
}) {
  return (
    <AnalysisSectionCard title={title} subtitle={subtitle}>
      <SectionSpacer>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.key}
              className={`rounded-[22px] border p-4 text-right shadow-sm ${statusClasses(
                item.status
              )}`}
            >
              <div className="text-sm font-bold">{item.label}</div>
              <div className="mt-3 text-2xl font-black">{item.value}</div>
              <div className="mt-3 text-xs leading-6">{item.description}</div>
            </div>
          ))}
        </div>

        <EducationalSummaryCard items={convertInsight(insight)} />
      </SectionSpacer>
    </AnalysisSectionCard>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 text-right shadow-sm">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}