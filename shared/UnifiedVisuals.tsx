import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function formatChartValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '')).join(' - ');
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  return String(value ?? '');
}

export function ChartCard({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`unified-chart-card rounded-3xl border border-slate-200 bg-white shadow-sm ${compact ? 'p-3' : 'p-4'}`}>
      <div className={compact ? 'mb-2' : 'mb-3'}>
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-black text-slate-900`}>{title}</h3>
        {description ? <p className={`${compact ? 'mt-1 text-xs' : 'mt-1 text-sm'} text-slate-500`}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function EmptyChartMessage({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function SideLabels({
  labels,
  height,
  topPadding = 12,
  bottomPadding = 34,
  widthClass = 'w-32 md:w-40',
}: {
  labels: string[];
  height: number;
  topPadding?: number;
  bottomPadding?: number;
  widthClass?: string;
}) {
  return (
    <div
      className={`${widthClass} horizontal-chart-labels shrink-0 text-sm font-medium leading-5 text-slate-600`}
      style={{ height, paddingTop: topPadding, paddingBottom: bottomPadding }}
      dir="rtl"
    >
      <div className="flex h-full flex-col justify-around gap-1">
        {labels.map((label) => (
          <div key={label} className="break-words text-right" title={label}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalChartShell({
  labels,
  height,
  children,
  labelWidthClass,
  topPadding,
  bottomPadding,
}: {
  labels: string[];
  height: number;
  children?: React.ReactNode;
  labelWidthClass?: string;
  topPadding?: number;
  bottomPadding?: number;
}) {
  return (
    <div className="horizontal-chart-shell flex w-full items-stretch gap-3" dir="ltr">
      <SideLabels
        labels={labels}
        height={height}
        widthClass={labelWidthClass}
        topPadding={topPadding}
        bottomPadding={bottomPadding}
      />
      <div className="horizontal-chart-canvas min-w-0 flex-1" style={{ height }} dir="ltr">
        {children}
      </div>
    </div>
  );
}

function getLabelColumnWidth(data: Array<Record<string, string | number>>, labelKey: string) {
  const longest = data.reduce((max, item) => Math.max(max, String(item[labelKey] ?? '').length), 0);
  return Math.max(76, Math.min(180, longest * 9));
}

export function OutsideLabelBarChart({
  data,
  valueKey,
  labelKey = 'name',
  valueSuffix = '',
  tooltipValueLabel = 'القيمة',
  fill = '#2563eb',
  height,
  domain,
  compact = true,
}: {
  data: Array<Record<string, string | number>>;
  valueKey: string;
  labelKey?: string;
  valueSuffix?: string;
  tooltipValueLabel?: string;
  fill?: string;
  height?: number;
  domain?: [number, number];
  compact?: boolean;
}) {
  const rowHeight = compact ? 34 : 40;
  const topOffset = compact ? 18 : 20;
  const bottomOffset = compact ? 10 : 14;
  const computedHeight = height ?? Math.max(155, data.length * rowHeight + topOffset + bottomOffset + 18);
  const labelWidth = getLabelColumnWidth(data, labelKey);

  return (
    <div className="flex items-stretch gap-3" dir="ltr">
      <div
        className="shrink-0 text-right text-[11px] font-bold text-slate-600"
        dir="rtl"
        style={{ width: labelWidth, paddingTop: topOffset, paddingBottom: bottomOffset }}
      >
        {data.map((item) => (
          <div
            key={String(item[labelKey])}
            className="flex items-center justify-end border-b border-slate-100 pr-1 last:border-b-0"
            style={{ height: rowHeight }}
          >
            <span className="leading-4">{item[labelKey]}</span>
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <ResponsiveContainer width="100%" height={computedHeight}>
          <BarChart data={data} layout="vertical" margin={{ top: topOffset, right: 38, left: 6, bottom: bottomOffset }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={domain} tickFormatter={(value) => `${value}${valueSuffix}`} tick={{ fontSize: 11 }} />
            <YAxis dataKey={labelKey} type="category" width={0} tick={false} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${formatChartValue(value)}${valueSuffix}`, tooltipValueLabel]} labelFormatter={(label) => String(label)} />
            <Bar dataKey={valueKey} fill={fill} radius={[8, 8, 8, 8]} barSize={20}>
              <LabelList dataKey={valueKey} position="right" offset={6} formatter={(value: unknown) => `${formatChartValue(value)}${valueSuffix}`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
