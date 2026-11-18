import React from 'react';
import type { NextStep } from './nextSteps';

export function NextStepCard({ step, tone }: { step: NextStep; tone: 'olive' | 'amber' | 'emerald' }) {
  const colors = {olive:'border-[#cbd8b9] bg-[#f6f8f2] text-[#33482d]',amber:'border-amber-200 bg-amber-50 text-amber-950',emerald:'border-emerald-200 bg-emerald-50 text-emerald-950'};
  return <section aria-label="ما الخطوة التالية؟" className={`rounded-2xl border p-5 ${colors[tone]}`}>
    <h2 className="text-lg font-black">ما الخطوة التالية؟</h2>
    <div className="mt-3 grid gap-3 md:grid-cols-3">{[['الملاحظة',step.observation],['الإجراء المقترح',step.action],['التحقق',step.check]].map(([label,text]) => <div key={label} className="rounded-xl bg-white/80 p-3"><h3 className="text-sm font-black">{label}</h3><p className="mt-1 text-sm leading-7">{text}</p></div>)}</div>
    <p className="mt-3 text-xs leading-6">اقتراح يستند إلى البيانات المدخلة، ويعدّله المعلم وفق سياق طلبته.</p>
  </section>;
}
