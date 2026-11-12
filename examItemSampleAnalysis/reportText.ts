import type { ExamItemsSampleAnalysisResult, ItemAnalysisResult, SkillAnalysisResult } from './types';

function getHighPriorityItems(result: ExamItemsSampleAnalysisResult): ItemAnalysisResult[] {
  return [...result.items]
    .filter((item) => item.priority === 'عالية')
    .sort((a, b) => b.totalLoss - a.totalLoss || a.performancePercent - b.performancePercent);
}

function getMediumItems(result: ExamItemsSampleAnalysisResult): ItemAnalysisResult[] {
  return result.items.filter((item) => item.priority === 'متوسطة');
}

function getLowestSkills(result: ExamItemsSampleAnalysisResult): SkillAnalysisResult[] {
  if (!result.skills.length) return [];
  const sorted = [...result.skills].sort((a, b) => a.performancePercent - b.performancePercent || b.totalLoss - a.totalLoss);
  const minimum = sorted[0].performancePercent;
  return sorted.filter((skill) => Math.abs(skill.performancePercent - minimum) < 0.05);
}

function formatHighPriorityCount(count: number): string {
  if (count === 1) return 'مفردة واحدة عالية الأولوية';
  if (count === 2) return 'مفردتين عاليتَي الأولوية';
  if (count >= 3 && count <= 10) return `${count} مفردات عالية الأولوية`;
  return `${count} مفردة عالية الأولوية`;
}

export function buildSampleLimitText(_result: ExamItemsSampleAnalysisResult): string {
  return `تعتمد نتائج هذا التقرير على العينة المدخلة ولا تمثل بالضرورة جميع الأوراق ما لم تكن العينة شاملة أو ممثلة بدرجة كافية. تُقرأ مؤشرات أداء المفردات والفقد والمهارات بوصفها دلائل تربوية مساعدة، لا أحكامًا نهائية مستقلة. ولا يكفي أداء المفردة وحده للحكم على جودة صياغتها؛ فقد يتأثر الأداء بسياق التدريس أو وضوح التعليمات أو طريقة التصحيح.`;
}

export function buildMethodologyText(_result: ExamItemsSampleAnalysisResult): string {
  return `اعتمد التحليل على حساب أداء كل مفردة من خلال مجموع درجات العينة مقارنة بالدرجة المتاحة لها، ثم تحليل الفقد ونسبة الصفر والدرجة الكاملة، وربط المفردات بالمهارات. كما تم تقدير موثوقية القراءة من خلال حجم العينة ونسبتها وطريقة اختيارها، مع اشتراط اكتمال بيانات الدرجات قبل قراءة المؤشرات.`;
}

export function buildPriorityItemRecommendation(result: ExamItemsSampleAnalysisResult): string {
  const priorityItems = getHighPriorityItems(result);
  if (!priorityItems.length) {
    return getMediumItems(result).length
      ? 'لا توجد مفردات عالية الأولوية وفق المعيار المعتمد، مع استمرار الحاجة إلى متابعة المفردات متوسطة الأداء والأعلى فقدًا.'
      : 'لا توجد مفردات عالية الأولوية وفق المعيار المعتمد.';
  }
  return priorityItems.slice(0, 5).map((item, index) => `${index + 1}. ${item.label}: ${item.interpretation}`).join('\n');
}

export function buildTeachingRecommendations(result: ExamItemsSampleAnalysisResult): string[] {
  const lowestSkills = getLowestSkills(result).map((skill) => skill.skill);
  const recommendations = [...result.decision.recommendations];
  if (lowestSkills.length) recommendations.unshift(`توجيه الدعم نحو أقل المهارات أداءً: ${lowestSkills.join('، ')}.`);
  if (result.reliability.level === 'very_low' || result.reliability.level === 'limited') {
    recommendations.push('توسيع العينة أو تحليل جميع الأوراق قبل بناء حكم نهائي على الورقة.');
  }
  return recommendations;
}

export function buildTeachingDecisionText(result: ExamItemsSampleAnalysisResult): string {
  const lowestSkills = getLowestSkills(result);
  if (!lowestSkills.length) return 'لا توجد مهارات كافية لبناء قرار تدريسي محدد.';
  const names = lowestSkills.map((skill) => skill.skill).join('، ');
  return lowestSkills.length === 1
    ? `تبدأ المتابعة التدريسية من أقل مهارة أداءً: ${names}، ثم تُراجع المهارات التالية حسب الفقد وترتيب الاحتياج.`
    : `تبدأ المتابعة التدريسية من أقل المهارات أداءً: ${names}، ثم تُراجع المهارات التالية حسب الفقد وترتيب الاحتياج.`;
}

export function buildOverallReadingText(result: ExamItemsSampleAnalysisResult): string {
  const priorityItems = getHighPriorityItems(result);
  const mediumItems = getMediumItems(result);
  if (priorityItems.length) {
    return `تشير نتائج العينة إلى وجود ${formatHighPriorityCount(priorityItems.length)} وفق المعيار المعتمد، مع ضرورة قراءة النتائج في ضوء ${result.reliability.label} و${result.dataCompleteness.label}.`;
  }
  return mediumItems.length
    ? `لا توجد مفردات عالية الأولوية، مع استمرار الحاجة إلى متابعة المفردات متوسطة الأداء وقراءة النتائج في ضوء ${result.reliability.label} و${result.dataCompleteness.label}.`
    : `لا توجد مفردات عالية الأولوية، وتُقرأ النتائج في ضوء ${result.reliability.label} و${result.dataCompleteness.label}.`;
}

export function buildPaperReviewDecisionText(result: ExamItemsSampleAnalysisResult): string {
  return getHighPriorityItems(result).length
    ? 'يوصى بمراجعة المفردات عالية الأولوية أو ذات الفقد المرتفع مراجعة تربوية وصياغية، مع عدم إصدار حكم نهائي على المفردة دون فحص سياق التدريس والتصحيح.'
    : 'يوصى بالاحتفاظ ببنية الورقة مع مراجعة عامة لتوازن المهارات، ومتابعة المفردات متوسطة الأداء أو الأعلى فقدًا.';
}
