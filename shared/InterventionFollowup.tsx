import React, {useState} from 'react';
import {clearWorkspace, isUsingMemoryStorageFallback, loadWorkspace, saveWorkspace} from './workspaceAutosave';
import {comparePercent,followupStorageKey,parsePercent,validFollowup,type FollowupMetric,type FollowupRecord} from './interventionFollowup';

type Props={identity:string; metrics:FollowupMetric[]; track:'individual'|'sample'|'group'; tone:'olive'|'amber'|'emerald'};
const field='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
export function InterventionFollowup(props:Props) { return <FollowupForm key={props.identity} {...props}/>; }
function FollowupForm({identity,metrics,track,tone}:Props) {
 const key=followupStorageKey(identity);
 const blank:FollowupRecord={identity,action:'',date:'',skill:'',after:'',comparable:false,note:''};
 const [record,setRecord]=useState<FollowupRecord>(()=>loadWorkspace(key,blank,(v):v is FollowupRecord=>validFollowup(v,identity)));
 const update=(patch:Partial<FollowupRecord>)=>{const next={...record,...patch};setRecord(next);saveWorkspace(key,next)};
 const metric=metrics.find(m=>m.skill===record.skill);
 const comparison=metric?comparePercent(metric.value,record.after,record.comparable):null;
 const isInvalid=record.after.trim()!=='' && parsePercent(record.after)===null;
 const color={olive:'border-[#cbd8b9] bg-[#f6f8f2]',amber:'border-amber-200 bg-amber-50',emerald:'border-emerald-200 bg-emerald-50'}[tone];
 const scope=track==='group'?'نسبة انتشار الإتقان في المجموعة':track==='sample'?'أداء المهارة في العينة':'أداء الطالب في المهارة';
 const confirmation=track==='group'?'أؤكد أن القياسين للمجموعة نفسها وبحد الإتقان نفسه، وأن التقويمين قابلان للمقارنة.':track==='sample'?'أؤكد قياس المهارة نفسها بعينة ومقياس قابلين للمقارنة، وأفهم أن النتائج تصف العينة.':'أؤكد قياس المهارة نفسها لدى الطالب، وأن المقياسين قابلان للمقارنة.';
 return <details className={`rounded-2xl border p-5 ${color}`}>
  <summary className="cursor-pointer text-base font-black text-slate-900">متابعة الإجراء وإعادة القياس <span className="text-xs font-normal">(اختياري)</span></summary>
  <p className="mt-3 text-sm leading-7 text-slate-700">وثّق ما نفذته، ثم أضف نتيجة إعادة القياس عند توفرها. {isUsingMemoryStorageFallback()?'التخزين الدائم غير متاح؛ البيانات مؤقتة وقد تضيع.':'تُحفظ البيانات في هذا المتصفح وعلى هذا الجهاز.'}</p>
  <div className="mt-3 grid gap-3 md:grid-cols-2">
   <label className="text-sm font-bold">الإجراء المنفّذ<input className={field} value={record.action} onChange={e=>update({action:e.target.value})} placeholder="مثال: تدريب موجّه على حل الأسئلة" /></label>
   <label className="text-sm font-bold">تاريخ التنفيذ<input className={field} type="date" value={record.date} onChange={e=>update({date:e.target.value})}/></label>
   <label className="text-sm font-bold">{track==='group'?'المؤشر':'المهارة'}<select className={field} value={record.skill} onChange={e=>update({skill:e.target.value,after:'',comparable:false})}><option value="">اختر {track==='group'?'المؤشر':'المهارة'}</option>{metrics.map(m=><option key={m.skill} value={m.skill}>{m.skill}</option>)}</select></label>
   <label className="text-sm font-bold">نتيجة إعادة القياس (%)<input className={field} type="text" inputMode="decimal" value={record.after} onChange={e=>update({after:e.target.value,comparable:false})} placeholder="من 0 إلى 100" aria-invalid={isInvalid}/>{isInvalid && <span className="mt-1 block text-xs text-red-700">أدخل نسبة صحيحة بين 0 و100.</span>}</label>
  </div>
  {metric && <p className="mt-3 text-sm font-bold">القياس السابق — {scope}: {metric.value}%</p>}
  {metric && record.after.trim()!=='' && !isInvalid && <label className="mt-3 flex items-start gap-2 text-sm leading-7"><input className="mt-1.5" type="checkbox" checked={record.comparable} onChange={e=>update({comparable:e.target.checked})}/><span>{confirmation}</span></label>}
  {comparison && <p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm font-bold">قبل: {comparison.before}% ← بعد: {comparison.after}% · الفرق: {comparison.difference>0?'+':''}{comparison.difference} نقطة مئوية <span className="block font-normal">المقارنة وصفية ولا تثبت أن الإجراء وحده سبب التغير.</span></p>}
  <label className="mt-3 block text-sm font-bold">ملاحظة اختيارية<input className={field} value={record.note} onChange={e=>update({note:e.target.value})}/></label>
  <button type="button" className="mt-3 text-sm font-bold text-slate-700 underline" onClick={()=>{clearWorkspace(key);setRecord(blank)}}>مسح بيانات هذه المتابعة</button>
 </details>;
}
