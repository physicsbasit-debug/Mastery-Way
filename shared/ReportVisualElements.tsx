import React from 'react';

export type PremiumReportTone = 'royal' | 'violet' | 'amber' | 'slate' | 'danger' | 'success';

export interface PremiumReportSummaryItem {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  tone?: PremiumReportTone;
}

export function PremiumReportSummary({
  eyebrow = 'ملخص بصري للتقرير',
  title,
  description,
  items,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  items: PremiumReportSummaryItem[];
}) {
  return (
    <section className="report-section premium-report-summary" dir="rtl">
      <div className="premium-report-summary__content">
        <span className="premium-report-summary__eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="premium-report-summary__metrics">
        {items.map((item) => (
          <div key={`${item.label}-${String(item.value)}`} className={`premium-report-summary-metric premium-report-summary-metric--${item.tone ?? 'royal'}`}>
            <div className="premium-report-summary-metric__label">{item.label}</div>
            <div className="premium-report-summary-metric__value">{item.value}</div>
            {item.note ? <div className="premium-report-summary-metric__note">{item.note}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReportStatusChip({
  children,
  tone = 'royal',
}: {
  children: React.ReactNode;
  tone?: PremiumReportTone;
}) {
  return <span className={`premium-report-status-chip premium-report-status-chip--${tone}`}>{children}</span>;
}

export function toneFromText(value: string): PremiumReportTone {
  const text = value || '';
  if (/متميز|ممتاز|قوي|مكتملة|كاملة|متقن|إتقان/.test(text)) return 'success';
  if (/جيد|مناسب|ملائم|داعم/.test(text)) return 'royal';
  if (/حذر|متوسط|قريب|مراجعة/.test(text)) return 'amber';
  if (/عاجل|حرج|ضعيف|منخفض|تدخل سريع|عالية/.test(text)) return 'danger';
  if (/فردي|طالب|تشخيص/.test(text)) return 'violet';
  return 'slate';
}
