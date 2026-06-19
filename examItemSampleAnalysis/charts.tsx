import React from 'react';
import { ChartCard, OutsideLabelBarChart } from '../shared/UnifiedVisuals';
import type { BalanceEntry, ExamItemsSampleAnalysisResult } from './types';

export function ItemPerformanceChart({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const data = result.items.map((item) => ({ name: item.label, value: item.performancePercent }));
  return (
    <ChartCard title="أداء المفردات" description="يعرض نسبة أداء العينة في كل مفردة." compact>
      <OutsideLabelBarChart data={data} valueKey="value" valueSuffix="%" tooltipValueLabel="الأداء" fill="#2563eb" domain={[0, 100]} />
    </ChartCard>
  );
}

export function ItemLossChart({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const data = [...result.items]
    .sort((a, b) => b.totalLoss - a.totalLoss)
    .map((item) => ({ name: item.label, value: item.totalLoss }));
  return (
    <ChartCard title="الفقد حسب المفردات" description="يوضح المفردات الأعلى تأثيرًا في فقد الدرجات داخل العينة." compact>
      <OutsideLabelBarChart data={data} valueKey="value" tooltipValueLabel="الفقد" fill="#dc2626" />
    </ChartCard>
  );
}

export function ZeroRateChart({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const data = result.items.map((item) => ({ name: item.label, value: item.zeroPercent }));
  return (
    <ChartCard title="نسبة الصفر لكل مفردة" description="تكشف المفردات التي حصلت فيها نسبة مرتفعة من أوراق العينة على صفر." compact>
      <OutsideLabelBarChart data={data} valueKey="value" valueSuffix="%" tooltipValueLabel="نسبة الصفر" fill="#f97316" domain={[0, 100]} />
    </ChartCard>
  );
}

export function SkillPerformanceChart({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const data = result.skills.map((skill) => ({ name: skill.skill, value: skill.performancePercent }));
  return (
    <ChartCard title="أداء المهارات" description="يعرض أداء العينة حسب المهارات المرتبطة بمفردات الورقة." compact>
      <OutsideLabelBarChart data={data} valueKey="value" valueSuffix="%" tooltipValueLabel="أداء المهارة" fill="#0f766e" domain={[0, 100]} />
    </ChartCard>
  );
}

function BalanceBarChart({ title, description, entries }: { title: string; description: string; entries: BalanceEntry[] }) {
  const data = entries.map((entry) => ({ name: entry.name, value: entry.scoreWeightPercent }));
  return (
    <ChartCard title={title} description={description} compact>
      <OutsideLabelBarChart data={data} valueKey="value" valueSuffix="%" tooltipValueLabel="وزن الدرجة" fill="#7c3aed" domain={[0, 100]} />
    </ChartCard>
  );
}

export function SkillBalanceChart({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return <BalanceBarChart title="توزيع درجات الورقة حسب المهارات" description="يوضح وزن كل مهارة من الدرجة الكلية للورقة." entries={result.skillBalance} />;
}

export function LevelBalanceChart({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return <BalanceBarChart title="توزيع درجات الورقة حسب مستوى السؤال" description="يوضح توازن الورقة بين المستويات المختلفة." entries={result.levelBalance} />;
}

export function ReliabilityBadgeChart({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const percent = result.reliability.samplePercent;
  return (
    <ChartCard title="حجم العينة من مجتمع التحليل" description="يوضح نسبة أوراق العينة من إجمالي الأوراق." compact>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>نسبة العينة</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
        <div className="mt-2 text-center text-sm font-black text-slate-900">{result.reliability.label}</div>
        <div className="mt-2 space-y-1 text-center text-xs text-slate-500">
          <div>للقراءة الأولية: {Math.min(10, result.reliability.totalPapers)} أوراق على الأقل</div>
          <div>للحكم النهائي: {result.reliability.totalPapers <= 30 ? 'يفضل تحليل جميع الأوراق' : `يفضل عينة ممثلة لا تقل عن ${result.reliability.recommendedSampleSize} ورقة`}</div>
        </div>
      </div>
    </ChartCard>
  );
}
