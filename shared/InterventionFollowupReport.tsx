import React from 'react';
import {loadWorkspace} from './workspaceAutosave';
import {comparePercent, followupStorageKey, validFollowup, type FollowupMetric, type FollowupRecord} from './interventionFollowup';

export function InterventionFollowupReport({identity,metrics}:{identity:string;metrics:FollowupMetric[]}) {
  const record=loadWorkspace<FollowupRecord|null>(followupStorageKey(identity),null,(value):value is FollowupRecord|null=>value===null||validFollowup(value,identity));
  if (!record || ![record.action,record.date,record.skill,record.after,record.note].some(value=>value.trim())) return null;
  const metric=metrics.find(item=>item.skill===record.skill);
  const comparison=metric?comparePercent(metric.value,record.after,record.comparable):null;
  return <section className="report-section premium-report-narrative mt-4 rounded-xl border border-slate-200 p-3 text-sm leading-7" dir="rtl">
    <h3 className="premium-report-subtitle">متابعة الإجراء وإعادة القياس</h3>
    {record.action.trim() && <p><strong>الإجراء المنفّذ:</strong> {record.action}</p>}
    {record.date && <p><strong>تاريخ التنفيذ:</strong> {record.date}</p>}
    {metric && <p><strong>المهارة أو المؤشر:</strong> {metric.skill} · <strong>القياس السابق:</strong> {metric.value}%</p>}
    {comparison && <><p><strong>إعادة القياس:</strong> {comparison.after}% · <strong>الفرق:</strong> {comparison.difference>0?'+':''}{comparison.difference} نقطة مئوية</p><p>المقارنة وصفية ولا تثبت أن الإجراء وحده سبب التغير.</p></>}
    {record.after.trim() && !comparison && <p>لم تُعرض المقارنة لعدم تأكيد قابلية القياسين للمقارنة أو عدم اكتمال بياناتهما.</p>}
    {record.note.trim() && <p><strong>ملاحظة المعلم:</strong> {record.note}</p>}
  </section>;
}
