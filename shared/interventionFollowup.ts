import { toLatinDigits } from './numberFormat';
export type FollowupRecord = {identity:string; action:string; date:string; skill:string; after:string; comparable:boolean; note:string};
export type FollowupMetric = {skill:string; value:number};
export function parsePercent(value:string):number|null {
  const normalized=toLatinDigits(value).trim().replace('٫','.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const number=Number(normalized);
  return Number.isFinite(number) && number>=0 && number<=100 ? number : null;
}
export function comparePercent(before:number, value:string, comparable:boolean) {
  const after=parsePercent(value);
  if (!comparable || after === null || !Number.isFinite(before) || before < 0 || before > 100) return null;
  return {before,after,difference:Math.round((after-before)*100)/100};
}
export function followupIdentity(track:string, context:unknown, baseline:unknown):string {
  return JSON.stringify([track,context,baseline]);
}
export function followupStorageKey(identity:string):string {
  let a=2166136261,b=5381;
  for (let i=0;i<identity.length;i++) { const n=identity.charCodeAt(i); a=Math.imul(a^n,16777619);b=Math.imul(b^n,33); }
  return `bosla.followup.v1.${(a>>>0).toString(36)}.${(b>>>0).toString(36)}`;
}
export function validFollowup(value:unknown, identity:string):value is FollowupRecord {
  if (!value || typeof value!=='object') return false;
  const r=value as Record<string,unknown>;
  return r.identity===identity && ['action','date','skill','after','note'].every(k=>typeof r[k]==='string') && typeof r.comparable==='boolean';
}
