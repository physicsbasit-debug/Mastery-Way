import type { IndividualPerformanceAnalysisResult, IndividualReportContext } from './types';
import { toLatinDigits } from '../shared/numberFormat';

export interface ContactEntry {
  id: string; date: string; method: string; status: string; agreement: string; evidence: string;
  skill: string; baseline: number | null; followupDate: string; followupPercent: string; followupNote: string;
}
export interface ParentRecord { draft?: string; parentPhone?: string; contacts: ContactEntry[] }
export type ParentRecords = Record<string, ParentRecord>;

export function studentRecordKey(context: IndividualReportContext): string | null {
  if (!context.studentName?.trim() || !context.paperTitle?.trim()) return null;
  return JSON.stringify([context.studentName,context.schoolName,context.grade,context.section,context.subject,context.paperTitle,context.academicYear].map(value => String(value || '').trim()));
}
const HOME_PRACTICE: Record<string, string> = {
  'المعرفة': 'اختيار سؤال قصير من أوراقه، وتشجيعه على استرجاع الفكرة المرتبطة به ثم توضيح إجابته.',
  'التذكر': 'اختيار سؤال قصير من أوراقه، وتشجيعه على استرجاع المعلومة ثم شرحها بكلماته.',
  'الفهم': 'اختيار سؤال مشابه من أوراقه، والطلب منه أن يشرح الفكرة بكلماته ويبيّن سبب إجابته.',
  'التطبيق': 'اختيار سؤال مشابه من أوراقه، ومساعدته على تحديد المطلوب ثم شرح خطوات الحل بالترتيب.',
  'الاستدلال': 'مناقشته في سؤال مشابه من أوراقه، وسؤاله عن الدليل أو السبب الذي استند إليه في إجابته.',
  'التحليل': 'اختيار سؤال مشابه من أوراقه، ومساعدته على تقسيم المعطيات وربطها بالمطلوب قبل الإجابة.',
  'التقويم': 'مناقشته في سؤال مشابه من أوراقه، وتشجيعه على تبرير اختياره ومراجعة إجابته.',
  'الإبداع / الإنتاج': 'تشجيعه على ابتكار سؤال مرتبط بما تعلمه، ثم شرح فكرته وطريقة الإجابة عنه.',
  'القدرات العليا': 'اختيار سؤال مشابه من أوراقه، وتشجيعه على تفسير إجابته وتوضيح السبب الذي اعتمد عليه.',
};

export function buildParentMessage(result: IndividualPerformanceAnalysisResult): string {
  const name = result.context.studentName?.trim() || 'الطالب';
  const subject = result.context.subject?.trim();
  const paper = result.context.paperTitle?.trim();
  const teacher = result.context.teacherName?.trim();
  const strongest = [...result.skills].sort((a, b) => b.percent - a.percent)[0];
  const positive = strongest && strongest.percent >= result.summary.masteryCutoffPercent
    ? `وقد أظهر ابنكم في هذه الورقة أداءً جيدًا في مهارة ${strongest.skill}، ونعتز بما حققه.` : '';
  const priority = result.summary.achievedMastery ? '' : result.priorities[0]?.skill;
  const focus = priority
    ? `وتشير نتيجته إلى فرصة لتعزيز مهارة ${priority}، ويمكن دعمها بتدريب متدرج في المدرسة والمنزل.`
    : result.summary.achievedMastery
      ? 'وقد بلغ حد الإتقان في هذه الورقة، ونأمل أن تتواصل فرص تثبيت تعلمه وإثرائه.'
      : 'ونتطلع إلى دعمه بالتدريب المتدرج وفق ما نلاحظه في أعماله الصفية.';
  const practice = priority
    ? HOME_PRACTICE[priority] || 'اختيار سؤال مناسب من أوراقه، وتشجيعه على قراءة المطلوب وشرح طريقة إجابته بهدوء.'
    : result.summary.achievedMastery
      ? result.plan.parentRole?.[0] || 'تشجيعه على شرح فكرة تعلمها أو حل سؤال مناسب.'
      : 'اختيار سؤال مناسب من أوراقه، وتشجيعه على قراءة المطلوب وشرح طريقة إجابته بهدوء.';
  const assessment = paper && subject ? `«${paper}» في مادة ${subject}` : paper ? `«${paper}»` : subject ? `ورقته في مادة ${subject}` : 'ورقته';
  return [
    `الفاضل/ ولي أمر الطالب ${name}`,
    'السلام عليكم ورحمة الله وبركاته،',
    `حرصًا على دعم تعلم ابنكم وتعزيز تقدمه، نشارككم قراءة مختصرة لأدائه في ${assessment}.`,
    [positive, focus].filter(Boolean).join(' '),
    `ويمكنكم مساندته في المنزل من خلال ${practice} والأهم تشجيع محاولته والثناء على تقدمه، مع التواصل مع المعلم إذا احتاج إلى توضيح.`,
    'نثمّن تعاونكم وشراكتكم في دعم تعلم ابنكم، ونسأل الله له التوفيق.',
    teacher ? `معلم المادة: ${teacher}` : '',
  ].filter(Boolean).join('\n\n');
}
/** Oman numbers are eight digits; international numbers require a country code. */
export function normalizeParentPhone(input: string): string | null {
  const value = toLatinDigits(input).trim();
  if (!value || !/^[+\d\s()\-]+$/.test(value)) return null;
  if ((value.match(/\+/g) || []).length > 1 || (value.includes('+') && !value.startsWith('+'))) return null;
  const plus = value.startsWith('+');
  let digits = value.replace(/[^0-9]/g, '');
  const international = plus || digits.startsWith('00');
  if (!plus && digits.startsWith('00')) digits = digits.slice(2);
  if (!international && /^[1-9]\d{7}$/.test(digits)) return `968${digits}`;
  if (!international && !digits.startsWith('968')) return null;
  if (digits.startsWith('968')) return /^968\d{8}$/.test(digits) ? digits : null;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
export function parentWhatsappUrl(phone: string, message: string): string | null {
  const normalized = normalizeParentPhone(phone);
  return normalized && message.trim() ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : null;
}
export function compareFollowup(before: number | null, value: string): {before:number;after:number;difference:number} | null {
  if (before === null || !Number.isFinite(before) || !value.trim()) return null;
  const after = Number(value);
  if (!Number.isFinite(after) || after < 0 || after > 100) return null;
  return {before,after,difference:Math.round((after-before)*10)/10};
}
