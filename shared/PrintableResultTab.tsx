import React from 'react';
import {
  printUnifiedReport,
  UnifiedOfficialReportHeader,
  UnifiedPrintStyles,
} from './UnifiedReport';

export interface PrintableResultContext {
  directorate?: string;
  schoolName?: string;
  teacherName?: string;
  trackLabel: string;
  title: string;
  subtitle?: string;
  fields?: Array<{ label: string; value: React.ReactNode }>;
}

export function PrintableResultTab({
  sectionId,
  context,
  children,
}: {
  sectionId: string;
  context: PrintableResultContext;
  children: React.ReactNode;
}) {
  const print = () => {
    void printUnifiedReport({
      targetValue: sectionId,
      areaId: sectionId,
      documentTitle: `بوصلة الإتقان - ${context.title}`,
    });
  };

  return (
    <div className="space-y-3">
      <div className="result-tab-no-print flex justify-end">
        <button
          type="button"
          onClick={print}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700"
        >
          طباعة هذا التبويب
        </button>
      </div>

      <section id={sectionId} className="printable-result-tab space-y-4" dir="rtl">
        <div className="result-tab-print-header">
          <UnifiedOfficialReportHeader
            directorate={context.directorate}
            schoolName={context.schoolName}
            trackLabel={context.trackLabel}
            title={context.title}
            subtitle={context.subtitle ?? 'نسخة مطبوعة من نتائج التحليل.'}
          />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <HeaderField label="اسم المعلم" value={context.teacherName || 'لم يحدد'} />
            {(context.fields ?? []).map((field) => (
              <HeaderField key={field.label} label={field.label} value={field.value} />
            ))}
          </div>
        </div>
        {children}
      </section>

      <UnifiedPrintStyles
        printAreaId={sectionId}
        noPrintClassName="result-tab-no-print"
        pageMarginMm={9}
        fontSizePx={9.8}
        lineHeight={1.4}
        extraCss={`
          #unified-print-root .result-tab-print-header { display: block !important; }
          #unified-print-root .printable-result-tab { display: block !important; }
          #unified-print-root .printable-result-tab > * { max-width: 100% !important; }
        `}
      />
    </div>
  );
}

function HeaderField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="font-bold text-slate-500">{label}</div>
      <div className="mt-0.5 font-black text-slate-900">{value ?? 'لم يحدد'}</div>
    </div>
  );
}
