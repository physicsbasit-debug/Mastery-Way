import React from 'react';
import type { DiagnosticDecision } from './diagnosticTypes';
import { confidenceLabel } from './diagnosticText';

export function DiagnosticDecisionCard({ decision }: { decision: DiagnosticDecision }) {
  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-blue-700">لوحة القرار التشخيصي</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{decision.priorityTitle}</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{confidenceLabel(decision.confidence)}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Info label="الأولوية الأولى" value={decision.priorityTarget} />
        <Info label="سبب الاختيار" value={decision.reason} />
        <Info label="الإجراء المقترح" value={decision.recommendedAction} />
        <Info label="دليل إعادة القياس" value={decision.retestEvidence} />
      </div>
      <p className="mt-4 rounded-2xl border border-blue-100 bg-white p-3 text-sm font-bold leading-7 text-slate-700">{decision.caution}</p>
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-black leading-7 text-slate-900">{value}</div>
    </div>
  );
}
