import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, EmptyChartMessage, HorizontalChartShell } from '../shared/UnifiedVisuals';
import type { MasteryJudgementCode, MasterySpreadAnalysisResult } from './types';

const JUDGEMENT_COLORS: Record<MasteryJudgementCode, string> = {
  distinguished: '#15803d',
  good: '#2563eb',
  adequate: '#ca8a04',
  not_adequate: '#f97316',
  rapid_intervention: '#dc2626',
};

const BAND_COLORS: Record<string, string> = {
  mastery: '#15803d',
  near_mastery: '#2563eb',
  moderate_gap: '#ca8a04',
  deep_gap: '#dc2626',
};

function formatPercent(value: unknown): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? `${numeric}%` : String(value ?? '');
}

function countTooltip(value: unknown): [string, string] {
  return [String(value ?? ''), 'العدد'];
}

export function MasteryScaleBar({ result }: { result: MasterySpreadAnalysisResult }) {
  const spread = Math.max(0, Math.min(100, result.summary.masterySpreadPercent));
  const segments = [
    { label: 'تدخل سريع', width: 40, color: '#dc2626' },
    { label: 'غير ملائم', width: 10, color: '#f97316' },
    { label: 'ملائم', width: 10, color: '#ca8a04' },
    { label: 'جيد', width: 10, color: '#2563eb' },
    { label: 'متميز', width: 30, color: '#15803d' },
  ];

  return (
    <div className="unified-chart-card rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-base font-black text-slate-900">انتشار الإتقان على سلم الحكم</h3>
          <p className="mt-1 text-sm text-slate-500">يوضح موقع النسبة الحالية ضمن السلم المعتمد.</p>
        </div>
        <div className="rounded-full px-3 py-1 text-sm font-black text-white" style={{ backgroundColor: JUDGEMENT_COLORS[result.judgement.code] }}>
          {result.judgement.label}
        </div>
      </div>
      <div className="relative pt-8" dir="ltr">
        <div className="absolute top-0 -translate-x-1/2" style={{ left: `${spread}%` }}>
          <div className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-black text-white shadow">{spread}%</div>
        </div>
        <div className="flex h-8 overflow-hidden rounded-xl border border-slate-200">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${segment.width}%`, backgroundColor: segment.color }}>
              <span dir="rtl" className="hidden sm:inline">{segment.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs font-bold text-slate-500">
          {[0, 40, 50, 60, 70, 100].map((value) => <span key={value}>{value}%</span>)}
        </div>
      </div>
    </div>
  );
}

export function MasteryVsNonMasteryChart({ result }: { result: MasterySpreadAnalysisResult }) {
  const data = [
    { name: 'حققوا الإتقان', count: result.summary.masteryCount, color: '#15803d' },
    { name: 'لم يحققوا الإتقان', count: result.summary.nonMasteryCount, color: '#dc2626' },
  ];
  return (
    <ChartCard title="المتقنون مقابل غير المتقنين" description="يقارن عدد من بلغوا حد الإتقان بمن لم يبلغوه.">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 12, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={countTooltip} />
          <Bar dataKey="count" name="العدد" radius={[12, 12, 0, 0]}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DistributionAroundMasteryChart({ result }: { result: MasterySpreadAnalysisResult }) {
  const data = result.distribution.map((band) => ({ name: band.label, count: band.count, color: BAND_COLORS[band.key] || '#64748b' }));
  return (
    <ChartCard title="توزيع المجموعة حول حد الإتقان" description="يقسم المجموعة إلى فئات غير متداخلة، بحيث ينتمي كل طالب إلى فئة واحدة.">
      <HorizontalChartShell labels={data.map((item) => item.name)} height={320} labelWidthClass="w-40 md:w-56" topPadding={14} bottomPadding={36}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 48, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip formatter={countTooltip} />
            <Bar dataKey="count" name="العدد" radius={[0, 12, 12, 0]}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              <LabelList dataKey="count" position="right" offset={8} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </HorizontalChartShell>
    </ChartCard>
  );
}

export function ScoresHistogramChart({ result }: { result: MasterySpreadAnalysisResult }) {
  const data = result.histogram.map((bucket) => ({ name: bucket.key, count: bucket.count }));
  const cutoffBucket = result.histogram.find((bucket) => result.summary.masteryCutoffPercent >= bucket.minPercent && result.summary.masteryCutoffPercent <= bucket.maxPercent);
  return (
    <ChartCard title="المدرج التكراري للتوزيع العام" description="يوضح انتشار الدرجات عبر نطاقات النسب المئوية.">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 12, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={countTooltip} />
          {cutoffBucket ? <ReferenceLine x={cutoffBucket.key} stroke="#0f172a" strokeDasharray="4 4" label={{ value: 'نطاق حد الإتقان', position: 'top', fontSize: 11 }} /> : null}
          <Bar dataKey="count" name="العدد" fill="#2563eb" radius={[10, 10, 0, 0]}>
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MeanMedianCutoffChart({ result }: { result: MasterySpreadAnalysisResult }) {
  const data = [
    { name: 'المتوسط', value: result.statistics.meanPercent, color: '#2563eb' },
    { name: 'الوسيط', value: result.statistics.medianPercent, color: '#7c3aed' },
    { name: 'حد الإتقان', value: result.summary.masteryCutoffPercent, color: '#15803d' },
  ];
  return (
    <ChartCard title="المتوسط والوسيط وحد الإتقان" description="تساعد المقارنة في قراءة مركز أداء المجموعة.">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 12, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tickFormatter={formatPercent} />
          <Tooltip formatter={(value) => [formatPercent(value), 'النسبة']} />
          <Bar dataKey="value" name="النسبة" radius={[12, 12, 0, 0]}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            <LabelList dataKey="value" position="top" formatter={formatPercent} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function GapToNextLevelChart({ result }: { result: MasterySpreadAnalysisResult }) {
  if (!result.gapToNextLevel.hasNextLevel || result.gapToNextLevel.requiredSpreadPercent === undefined) {
    return (
      <ChartCard title="الفجوة إلى المستوى التالي" description="لا يوجد مستوى أعلى في السلم المعتمد.">
        <EmptyChartMessage>وصلت المجموعة إلى أعلى مستوى. تركز المتابعة على تثبيت الانتشار، والإثراء، ودعم غير المتقنين.</EmptyChartMessage>
      </ChartCard>
    );
  }
  const data = [
    { name: 'الحالي', value: result.summary.masterySpreadPercent, color: '#2563eb' },
    { name: 'المطلوب', value: result.gapToNextLevel.requiredSpreadPercent, color: '#15803d' },
  ];
  return (
    <ChartCard title="الفجوة إلى المستوى التالي" description="يوضح المسافة بين النسبة الحالية وحد المستوى التالي.">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 20, right: 12, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tickFormatter={formatPercent} />
          <Tooltip formatter={(value) => [formatPercent(value), 'النسبة']} />
          <Bar dataKey="value" name="النسبة" radius={[12, 12, 0, 0]}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            <LabelList dataKey="value" position="top" formatter={formatPercent} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
