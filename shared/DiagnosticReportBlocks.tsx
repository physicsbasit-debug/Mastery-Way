import React from 'react';
import type { DiagnosticDecision, FishboneDiagnostic, ParetoEntry, RadarSkillEntry } from './diagnosticTypes';
import { confidenceLabel } from './diagnosticText';
import { ParetoChart } from './ParetoChart';
import { RadarSkillChart } from './RadarSkillChart';

export function DiagnosticDecisionReportBlock({ decision }: { decision: DiagnosticDecision }) {
  return (
    <section className="diagnostic-report-block rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black text-blue-700">لوحة القرار التشخيصي</p>
          <h3 className="mt-1 text-base font-black text-slate-950">{decision.priorityTitle}</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-700">{confidenceLabel(decision.confidence)}</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <Info label="الأولوية الأولى" value={decision.priorityTarget} />
        <Info label="سبب الاختيار" value={decision.reason} />
        <Info label="الإجراء المقترح" value={decision.recommendedAction} />
        <Info label="دليل إعادة القياس" value={decision.retestEvidence} />
      </div>
      <p className="mt-3 rounded-xl border border-blue-100 bg-white p-3 text-xs font-bold leading-6 text-slate-700">{decision.caution}</p>
    </section>
  );
}

export function ParetoReportBlock({ title, description, entries, valueLabel = 'الفقد' }: { title: string; description?: string; entries: ParetoEntry[]; valueLabel?: string }) {
  return <div className="diagnostic-report-visual"><ParetoChart title={title} description={description} entries={entries} valueLabel={valueLabel} compact /></div>;
}

export function RadarReportBlock({ title, description, data }: { title: string; description?: string; data: RadarSkillEntry[] }) {
  return <div className="diagnostic-report-visual"><RadarSkillChart title={title} description={description} data={data} compact /></div>;
}

export function FishboneReportBlock({ diagnostic }: { diagnostic: FishboneDiagnostic }) {
  return (
    <section className="diagnostic-report-fishbone rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">{diagnostic.title}</h3>
          <p className="mt-1 text-xs leading-6 text-slate-600">{diagnostic.caution}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">أسباب محتملة لا أحكام قطعية</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {diagnostic.categories.slice(0, 6).map((category) => (
          <div key={category.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <h4 className="text-xs font-black text-slate-900">{category.title}</h4>
            {category.evidence ? <p className="mt-1 text-[10px] font-bold leading-5 text-slate-500">{category.evidence}</p> : null}
            <ul className="mt-1 space-y-1 text-[11px] leading-5 text-slate-700">
              {category.prompts.slice(0, 3).map((prompt) => <li key={prompt}>• {prompt}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-3">
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
      <div className="mt-1 text-xs font-black leading-6 text-slate-900">{value}</div>
    </div>
  );
}
