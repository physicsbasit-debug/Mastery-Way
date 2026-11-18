import type { IndividualPerformanceAnalysisResult } from '../individualPerformance/types';
import type { ExamItemsSampleAnalysisResult } from '../examItemSampleAnalysis/types';
import type { MasterySpreadAnalysisResult } from '../masterySpread/types';

export interface NextStep { observation: string; action: string; check: string }

function prioritySkills<T>(skills: T[], cutoff: number, percent: (skill: T) => number): T[] {
  const below = skills.filter(s => Number.isFinite(percent(s)) && percent(s) < cutoff);
  if (!below.length) return [];
  const lowest = Math.min(...below.map(percent));
  return below.filter(s => Math.abs(percent(s) - lowest) < 0.000001);
}

function activity(skill: string): string {
  const examples: Record<string, string> = {
    'المعرفة': 'قدّم سؤالًا قصيرًا لاسترجاع الفكرة، ثم اطلب توضيح الإجابة.',
    'التذكر': 'قدّم سؤالًا قصيرًا لاسترجاع المعلومة، ثم اطلب شرحها بالكلمات الخاصة بالمتعلم.',
    'الفهم': 'اعرض مثالًا موجّهًا، ثم اطلب شرح الفكرة والإجابة عن سؤال مشابه.',
    'التطبيق': 'حل مثالًا مع توضيح الخطوات، ثم قدّم سؤالًا مشابهًا للحل المستقل.',
    'الاستدلال': 'قدّم سؤالًا واطلب تحديد الإجابة وتوضيح الدليل أو السبب.',
    'التحليل': 'اعرض سؤالًا ووجّه المتعلم لتحديد المعطيات وربطها بالمطلوب قبل الحل.',
    'التقويم': 'اعرض إجابتين محتملتين واطلب اختيار الأنسب مع تبرير الاختيار.',
    'الإبداع / الإنتاج': 'اطلب اقتراح فكرة أو سؤال جديد مرتبط بما تم تعلمه وشرح الاختيار.',
    'القدرات العليا': 'قدّم موقفًا مشابهًا واطلب تفسير الإجابة وتوضيح السبب.',
  };
  return examples[skill] || `قدّم مثالًا موجّهًا مرتبطًا بمهارة ${skill}، ثم سؤالًا مشابهًا للحل المستقل.`;
}

export function individualNextStep(result: IndividualPerformanceAnalysisResult): NextStep {
  if (!result.skills.length) return {observation:'لا توجد مهارات ممثلة كفاية لاقتراح أولوية من هذه الورقة.',action:'راجع بناء الورقة والمهارات المرتبطة بمفرداتها.',check:'أكمل بيانات المهارات ثم أعد التحليل.'};
  const priorities = prioritySkills(result.skills, result.summary.masteryCutoffPercent, s => s.percent);
  if (!priorities.length) return {observation:'المهارات الممثلة في هذه الورقة عند حد الإتقان أو أعلى.',action:'قدّم سؤال إثراء في موقف جديد واطلب من الطالب توضيح طريقته.',check:'راجع إجابة الطالب على السؤال الجديد وتوضيحه لخطواته.'};
  const names = priorities.map(s => s.skill).join('، ');
  if (priorities.length > 1) return {observation:`تساوت أقل نتائج المهارات دون حد الإتقان: ${names}.`,action:'اختر مع الطالب إحدى المهارات المتساوية، ثم قدّم مثالًا موجّهًا وسؤالًا مشابهًا.',check:'أعد قياس المهارة المختارة بسؤال مماثل، ثم قارن النتيجة بقراءتها في هذه الورقة.'};
  return {observation:`أقل مهارة دون حد الإتقان في هذه الورقة: ${names} (${priorities[0].percent}%).`,action:activity(names),check:`أعد قياس مهارة ${names} بسؤال مماثل وقارن النتيجة بقراءتها في هذه الورقة.`};
}

export function sampleNextStep(result: ExamItemsSampleAnalysisResult): NextStep {
  if (!result.skills.length) return {observation:'لا توجد مهارات ممثلة في العينة لتحديد أولوية.',action:'راجع المفردات والمهارات المرتبطة بها قبل وضع خطة.',check:'أكمل البيانات ثم أعد التحليل.'};
  const priorities = prioritySkills(result.skills, result.summary.masteryCutoffPercent, s => s.performancePercent);
  if (!priorities.length) return {observation:'المهارات الممثلة في أوراق العينة عند حد الإتقان أو أعلى.',action:'قدّم نشاط إثراء في موقف جديد وراجع تمثيل المهارات في الورقة.',check:'تحقق بسؤال مماثل من ثبات أداء المهارات الممثلة في العينة.'};
  const names = priorities.map(s => s.skill).join('، ');
  const action = priorities.length === 1 ? activity(names) : 'اختر إحدى المهارات المتساوية، وقدّم مثالًا موجّهًا وسؤالًا مشابهًا للتدريب.';
  return {observation:`${priorities.length > 1 ? 'تساوت أقل المهارات' : 'أقل مهارة'} أداءً دون حد الإتقان في العينة: ${names}.`,action,check:'أعد قياس المهارة المختارة بسؤال مماثل وقارن النتائج ضمن مجموعة قابلة للمقارنة.'};
}

export function groupNextStep(result: MasterySpreadAnalysisResult): NextStep {
  const { totalStudents, masteryCount, nonMasteryCount, masteryCutoffPercent } = result.summary;
  if (!nonMasteryCount) return {observation:`بلغ ${masteryCount} من أصل ${totalStudents} طالب حد الإتقان (${masteryCutoffPercent}%).`,action:'قدّم نشاطًا إثرائيًا في موقف جديد لتوسيع تطبيق التعلم.',check:'استخدم تقويمًا مماثلًا للتحقق من استمرار بلوغ حد الإتقان.'};
  return {observation:`بلغ ${masteryCount} من أصل ${totalStudents} طالب حد الإتقان، ولم يبلغه ${nonMasteryCount}.`,action:'راجع أوراق الطلبة لتحديد احتياجاتهم، ثم قدّم تدريبًا مناسبًا مع مثال موجّه.',check:'أعد القياس بتقويم مناسب قابل للمقارنة، ثم احسب عدد من بلغوا حد الإتقان.'};
}
