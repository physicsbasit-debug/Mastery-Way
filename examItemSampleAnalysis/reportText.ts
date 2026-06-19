import type { ExamItemsSampleAnalysisResult, ItemAnalysisResult, SkillAnalysisResult } from './types';

function getItemPriorityLabel(item: ItemAnalysisResult): ItemAnalysisResult['priority'] {
  return item.priority;
}

function getHighPriorityItems(result: ExamItemsSampleAnalysisResult): ItemAnalysisResult[] {
  return [...result.items]
    .filter((item) => getItemPriorityLabel(item) === 'عالية')
    .sort((a, b) => b.totalLoss - a.totalLoss || a.performancePercent - b.performancePercent);
}

function getMediumPerformanceItems(result: ExamItemsSampleAnalysisResult): ItemAnalysisResult[] {
  return result.items.filter((item) => getItemPriorityLabel(item) === 'متوسطة');
}

function getLowestSkills(result: ExamItemsSampleAnalysisResult): SkillAnalysisResult[] {
  if (!result.skills.length) return [];
  const sorted = [...result.skills].sort((a, b) => a.performancePercent - b.performancePercent || b.totalLoss - a.totalLoss);
  const min = sorted[0].performancePercent;
  return sorted.filter((skill) => Math.abs(skill.performancePercent - min) < 0.05);
}

function formatPaperCount(count: number): string {
  if (count === 1) return 'ورقة واحدة';
  if (count === 2) return 'ورقتين';
  if (count >= 3 && count <= 10) return `${count} أوراق`;
  return `${count} ورقة`;
}

function formatHighPriorityCount(count: number): string {
  if (count === 1) return 'مفردة واحدة عالية الأولوية';
  if (count === 2) return 'مفردتين عاليتَي الأولوية';
  if (count >= 3 && count <= 10) return `${count} مفردات عالية الأولوية`;
  return `${count} مفردة عالية الأولوية`;
}

function joinArabic(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join('، ')} و${items[items.length - 1]}`;
}

function buildLowestSkillsText(result: ExamItemsSampleAnalysisResult): string {
  const lowestSkills = getLowestSkills(result);
  if (!lowestSkills.length) return 'ولا توجد مهارة واحدة بارزة يمكن تقديمها كأولوية مستقلة.';
  const names = lowestSkills.map((skill) => skill.skill).join('، ');
  if (lowestSkills.length === 1) {
    return `وأقل مهارة أداءً هي ${names} بنسبة أداء ${lowestSkills[0].performancePercent}%.`;
  }
  return `وأقل المهارات أداءً هي ${names} بنسبة أداء ${lowestSkills[0].performancePercent}%.`;
}

function shouldUseCaution(result: ExamItemsSampleAnalysisResult): boolean {
  return result.dataCompleteness.completionPercent < 90;
}

function formatReliabilityLabel(result: ExamItemsSampleAnalysisResult): string {
  return shouldUseCaution(result) ? `${result.reliability.label} مع حذر` : result.reliability.label;
}

export function buildExecutiveSummaryText(result: ExamItemsSampleAnalysisResult): string {
  const priorityItems = getHighPriorityItems(result);
  const topItem = priorityItems[0];
  const mediumItems = getMediumPerformanceItems(result);
  const skillText = buildLowestSkillsText(result);
  let itemText: string;

  if (priorityItems.length === 1 && topItem) {
    itemText = `وتظهر ${topItem.label} ضمن المفردات عالية الأولوية للمراجعة بفقد قدره ${topItem.totalLoss} درجة.`;
  } else if (priorityItems.length > 1 && topItem) {
    const shownItems = priorityItems.slice(0, 3).map((item) => item.label);
    const labelsText = joinArabic(shownItems);
    const prefix = priorityItems.length > 3 ? 'ومن أبرزها' : 'وتظهر المفردات';
    itemText = `${prefix} ${labelsText} ضمن المفردات عالية الأولوية للمراجعة، وأعلاها فقدًا ${topItem.label} بفقد قدره ${topItem.totalLoss} درجة.`;
  } else {
    itemText = mediumItems.length
      ? 'ولا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد، مع استمرار الحاجة إلى متابعة المفردات متوسطة الأداء.'
      : 'ولا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد.';
  }

  const cautionText = shouldUseCaution(result)
    ? ' وتقرأ النتائج مع حذر بسبب نقص اكتمال بيانات الدرجات.'
    : '';

  return `تم تحليل ${result.summary.totalItems} مفردات من خلال عينة تضم ${formatPaperCount(result.reliability.sampleSize)} من أصل ${formatPaperCount(result.reliability.totalPapers)}، بنسبة عينة ${result.reliability.samplePercent}%.
بلغ متوسط أداء المفردات ${result.summary.averagePaperPercent}%. اكتمال بيانات الدرجات بلغ ${result.dataCompleteness.completionPercent}% (${result.dataCompleteness.label}). ${skillText} ${itemText}${cautionText}`;
}

export function buildSampleLimitText(result: ExamItemsSampleAnalysisResult): string {
  return `تعتمد نتائج هذا التقرير على العينة المدخلة ولا تمثل بالضرورة جميع الأوراق ما لم تكن العينة شاملة أو ممثلة بدرجة كافية.
لذلك تُقرأ مؤشرات أداء المفردات والفقد والمهارات بوصفها دلائل تربوية مساعدة، لا أحكامًا نهائية مستقلة. ولا يكفي أداء المفردة وحده للحكم على جودة صياغتها؛ فقد يتأثر الأداء بسياق التدريس أو وضوح التعليمات أو اكتمال البيانات أو طريقة التصحيح.`;
}

export function buildMethodologyText(result: ExamItemsSampleAnalysisResult): string {
  const cautionText = shouldUseCaution(result)
    ? ' وتظهر إشارات الحذر في التقرير عندما يكون اكتمال البيانات أقل من 90%.'
    : '';
  return `اعتمد التحليل على حساب أداء كل مفردة من خلال مجموع درجات العينة مقارنة بالدرجة المتاحة لها، ثم تحليل الفقد ونسبة الصفر والدرجة الكاملة، وربط المفردات بالمهارات والمستويات المعرفية.
كما تم تقدير موثوقية القراءة من خلال حجم العينة ونسبتها وطريقة اختيارها، مع احتساب اكتمال بيانات الدرجات قبل قراءة المؤشرات.${cautionText}`;
}

export function buildPriorityItemRecommendation(result: ExamItemsSampleAnalysisResult): string {
  const priorityItems = getHighPriorityItems(result);
  if (!priorityItems.length) {
    const mediumItems = getMediumPerformanceItems(result);
    return mediumItems.length
      ? 'لا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد، مع استمرار الحاجة إلى متابعة المفردات متوسطة الأداء وقراءتها مع المفردات الأعلى فقدًا كدلائل مساعدة.'
      : 'لا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد، ويوصى بمراجعة عامة لتوازن الورقة وتوثيق نتائج العينة.';
  }
  return priorityItems
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.label}: ${item.interpretation}`)
    .join('\n');
}

export function buildTeachingRecommendations(result: ExamItemsSampleAnalysisResult): string[] {
  const lowestSkills = getLowestSkills(result).map((skill) => skill.skill);
  const recommendations = [...result.decision.recommendations];
  if (lowestSkills.length) {
    recommendations.unshift(`توجيه الدعم التدريسي نحو أقل المهارات أداءً: ${lowestSkills.join('، ')}.`);
  }
  if (result.dataCompleteness.completionPercent < 90) {
    recommendations.unshift('مراجعة اكتمال بيانات الدرجات قبل اعتماد التقرير النهائي، لأن وجود خلايا فارغة أو غير صالحة قد يؤثر في ثبات المؤشرات.');
  }
  if (result.reliability.level === 'very_low' || result.reliability.level === 'limited') {
    recommendations.push('ينبغي عدم اعتماد نتائج العينة وحدها للحكم النهائي، ويُفضل توسيع العينة أو تحليل جميع الأوراق إن أمكن.');
  }
  return recommendations;
}

export function buildTeachingDecisionText(result: ExamItemsSampleAnalysisResult): string {
  const lowestSkills = getLowestSkills(result);
  if (!lowestSkills.length) return 'لا توجد مهارات كافية لبناء قرار تدريسي محدد.';
  const names = lowestSkills.map((skill) => skill.skill).join('، ');
  const opening = lowestSkills.length === 1
    ? `تبدأ المتابعة التدريسية من أقل مهارة أداءً: ${names}`
    : `تبدأ المتابعة التدريسية من أقل المهارات أداءً: ${names}`;
  return `${opening}، ثم تُراجع المهارات التالية حسب الفقد وترتيب الاحتياج.`;
}

export function buildOverallReadingText(result: ExamItemsSampleAnalysisResult): string {
  const priorityItems = getHighPriorityItems(result);
  const mediumItems = getMediumPerformanceItems(result);
  const reliability = formatReliabilityLabel(result);
  if (priorityItems.length) {
    return `تشير نتائج العينة إلى وجود ${formatHighPriorityCount(priorityItems.length)} وفق معيار الأولوية المعتمد، مع ضرورة قراءة ذلك في ضوء ${reliability} و${result.dataCompleteness.label}.`;
  }
  return mediumItems.length
    ? `لا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد، مع استمرار الحاجة إلى متابعة المفردات متوسطة الأداء وقراءة النتائج في ضوء ${reliability} و${result.dataCompleteness.label}.`
    : `لا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد، وتقرأ النتائج في ضوء ${reliability} و${result.dataCompleteness.label}.`;
}

export function buildPaperReviewDecisionText(result: ExamItemsSampleAnalysisResult): string {
  const priorityItems = getHighPriorityItems(result);
  if (priorityItems.length) {
    return 'يوصى بمراجعة المفردات عالية الأولوية أو ذات الفقد المرتفع مراجعة تربوية وصياغية، مع عدم إصدار حكم نهائي على المفردة دون فحص سياق التدريس والتصحيح.';
  }
  return 'يوصى بالاحتفاظ ببنية الورقة مع مراجعة عامة للتوازن والتدرج، ومتابعة المفردات متوسطة الأداء أو الأعلى فقدًا كدلائل مساعدة.';
}
