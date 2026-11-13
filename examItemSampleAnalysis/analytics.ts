import { ITEM_PERFORMANCE_BANDS } from './constants';
import type {
  AnalysisReadinessResult,
  BalanceEntry,
  BalanceReadingResult,
  DataCompletenessResult,
  ExamItemDefinition,
  ExamItemsSampleAnalysisResult,
  ExamItemsSampleContext,
  ExamItemsSampleDecision,
  ExamItemsSampleSummary,
  ItemAnalysisResult,
  ItemPriorityLevel,
  SampleReliabilityResult,
  SampleScoreRow,
  ScoreCellIssue,
  SkillAnalysisResult,
  ValidationIssue,
  ExamItemsSampleDiagnosticInsights,
} from './types';
import { buildDiagnosticDecision, buildFishboneDiagnostic, buildParetoEntries, confidenceFromSignals, getParetoTopSummary } from '../shared/diagnosticText';
import { mean, roundTo, safePercent, standardDeviation } from './utils';

export function recommendedSampleSize(totalPapers: number): number {
  if (totalPapers <= 0) return 0;
  if (totalPapers <= 30) return totalPapers;
  if (totalPapers <= 60) return Math.min(totalPapers, Math.max(30, Math.ceil(totalPapers * 0.5)));
  if (totalPapers <= 150) return Math.max(30, Math.ceil(totalPapers * 0.3));
  return Math.max(50, Math.ceil(totalPapers * 0.2));
}

export function evaluateSampleReliability(totalPapers: number, sampleSize: number, selectionMethod: string): SampleReliabilityResult {
  const samplePercent = safePercent(sampleSize, totalPapers);
  const recommended = recommendedSampleSize(totalPapers);
  const biasedSelection = ['أوراق متاحة فقط', 'اختيار يدوي من المعلم', 'من شعبة واحدة'].includes(selectionMethod);

  let level: SampleReliabilityResult['level'] = 'limited';
  let label = 'قراءة أولية محدودة';
  let message = 'حجم العينة يسمح بقراءة أولية فقط، ولا يوصى ببناء أحكام نهائية على المفردات.';

  if (sampleSize <= 0 || totalPapers <= 0) {
    level = 'very_low';
    label = 'بيانات العينة غير مكتملة';
    message = 'يلزم إدخال إجمالي الأوراق وعدد أوراق العينة قبل اعتماد القراءة.';
  } else if (sampleSize >= totalPapers) {
    level = 'complete';
    label = 'تحليل شامل عالي الثقة';
    message = 'تم تحليل جميع الأوراق المدخلة؛ لذلك تمثل النتائج مجتمع التحليل المحدد.';
  } else if (sampleSize < 10) {
    level = 'very_low';
    label = 'قراءة ضعيفة جدًا';
    message = 'عدد أوراق العينة أقل من 10؛ تستخدم النتائج للاستئناس فقط.';
  } else if (sampleSize < 20) {
    level = 'limited';
    label = 'قراءة أولية محدودة';
    message = 'حجم العينة محدود؛ تصلح النتائج للمراجعة الأولية لا للأحكام النهائية.';
  } else if (sampleSize < 30) {
    level = 'cautious';
    label = 'قراءة مقبولة بحذر';
    message = 'حجم العينة مقبول مبدئيًا، وتقرأ النتائج بحذر خاصة إذا لم تكن العينة ممثلة.';
  } else if (sampleSize >= 50 && samplePercent >= 20) {
    level = 'strong';
    label = 'قراءة قوية نسبيًا';
    message = 'حجم العينة مناسب لدعم قراءة تربوية أكثر ثباتًا، بشرط تمثيل مستويات الأداء.';
  } else if (sampleSize >= 30 && samplePercent >= 30) {
    level = 'good';
    label = 'قراءة جيدة';
    message = 'حجم العينة مناسب لدعم قرارات تربوية أولية حول المفردات والمهارات.';
  } else {
    level = 'cautious';
    label = 'قراءة مقبولة بحذر';
    message = 'حجم العينة معقول، لكن نسبتها أو تمثيلها يحتاجان إلى مراعاة عند تفسير النتائج.';
  }

  const warning = biasedSelection
    ? 'تنبيه: طريقة اختيار العينة قد تكون متحيزة؛ يفضل أن تشمل العينة مستويات أداء متنوعة ومن أكثر من شعبة إن وجدت.'
    : undefined;

  return {
    totalPapers,
    sampleSize,
    samplePercent,
    recommendedSampleSize: recommended,
    level,
    label,
    message,
    warning,
  };
}

function getItemBand(percent: number) {
  return ITEM_PERFORMANCE_BANDS.find((band) =>
    percent >= band.min && (percent < band.max || (band.max === 100 && percent === 100))
  ) ?? ITEM_PERFORMANCE_BANDS[ITEM_PERFORMANCE_BANDS.length - 1];
}

function getItemPriority(performancePercent: number, totalLoss: number, totalAvailable: number, zeroPercent: number): ItemPriorityLevel {
  const lossPercent = safePercent(totalLoss, totalAvailable);
  if (performancePercent < 40 || (performancePercent < 50 && (lossPercent >= 50 || zeroPercent >= 35))) return 'عالية';
  if (performancePercent < 60) return 'متوسطة';
  if (performancePercent < 75) return 'منخفضة';
  return 'مستقرة';
}

function buildItemInterpretation(item: ItemAnalysisResult): string {
  if (item.performancePercent < 20) {
    return `تشير نتائج العينة إلى انخفاض حاد في أداء ${item.label}، ويوصى بمراجعة تربوية وصياغية للمفردة والمهارة المرتبطة بها قبل إصدار حكم نهائي.`;
  }
  if (item.priority === 'عالية') {
    const signals: string[] = [];
    if (item.zeroPercent >= 35) signals.push('ارتفاع نسبة الإجابات الصفرية');
    if (safePercent(item.totalLoss, item.totalAvailable) >= 50) signals.push('ارتفاع الفقد الكلي');
    const reason = signals.length ? `، مع ${signals.join(' و')}` : '';
    return `تظهر ${item.label} أداءً منخفضًا يحتاج متابعة تربوية ومراجعة للمفردة والمهارة المرتبطة بها${reason}.`;
  }
  if (item.performancePercent < 40) {
    return `تشير نتائج العينة إلى أن ${item.label} تحتاج مراجعة تربوية محتملة أو أن المهارة المرتبطة بها تحتاج دعمًا.`;
  }
  if (item.performancePercent < 60) {
    return `تظهر ${item.label} أداءً متوسطًا يحتاج متابعة تربوية، خاصة إذا كان الفقد الكلي مرتفعًا.`;
  }
  if (item.performancePercent >= 85) {
    return `تظهر ${item.label} أداءً مرتفعًا جدًا؛ وقد يشير ذلك إلى سهولة المفردة أو إتقان العينة للمهارة.`;
  }
  return `تظهر ${item.label} أداءً مناسبًا غالبًا ضمن العينة المدخلة.`;
}

export class ExamItemsSampleValidationError extends Error {
  validation: AnalysisReadinessResult;

  constructor(validation: AnalysisReadinessResult) {
    const firstIssue = validation.issues[0]?.message ?? 'بيانات التحليل غير مكتملة أو غير صالحة.';
    super(firstIssue);
    this.name = 'ExamItemsSampleValidationError';
    this.validation = validation;
  }
}

function isBlankScore(value: unknown): boolean {
  return value === '' || value === undefined || value === null;
}

export function validateAnalysisReadiness(
  context: ExamItemsSampleContext,
  items: ExamItemDefinition[],
  rows: SampleScoreRow[],
): AnalysisReadinessResult {
  const issues: ValidationIssue[] = [];
  const cellIssues: ScoreCellIssue[] = [];

  if (!context.schoolName.trim()) issues.push({ scope: 'context', message: 'اسم المدرسة غير مدخل.' });
  if (!context.paperTitle.trim()) issues.push({ scope: 'context', message: 'عنوان الورقة غير مدخل.' });
  if (!Number.isInteger(context.totalPapers) || context.totalPapers <= 0) {
    issues.push({ scope: 'context', message: 'إجمالي عدد الأوراق يجب أن يكون عددًا صحيحًا أكبر من صفر.' });
  }
  if (!Number.isInteger(context.sampleSize) || context.sampleSize <= 0) {
    issues.push({ scope: 'context', message: 'عدد أوراق العينة يجب أن يكون عددًا صحيحًا أكبر من صفر.' });
  }
  if (context.sampleSize > context.totalPapers) {
    issues.push({ scope: 'context', message: 'عدد أوراق العينة لا يمكن أن يكون أكبر من إجمالي الأوراق.' });
  }
  if (!Number.isFinite(context.masteryCutoffPercent) || context.masteryCutoffPercent <= 0 || context.masteryCutoffPercent > 100) {
    issues.push({ scope: 'context', message: 'حد الإتقان يجب أن يكون بين 1 و100.' });
  }

  if (!items.length) issues.push({ scope: 'items', message: 'لم يتم بناء مفردات الورقة.' });
  const validItems: ExamItemDefinition[] = [];
  items.forEach((item) => {
    const isEmptyMaxScore = item.maxScore === '' || item.maxScore === undefined || item.maxScore === null;
    const maxScore = Number(item.maxScore);
    if (isEmptyMaxScore) {
      issues.push({ scope: 'items', message: `${item.label}: يجب إدخال الدرجة الكلية للمفردة.` });
    } else if (!Number.isFinite(maxScore) || maxScore <= 0) {
      issues.push({ scope: 'items', message: `${item.label}: الدرجة الكلية يجب أن تكون 0.5 فأكثر ولا تقبل الصفر أو القيم السالبة.` });
    } else if (Math.abs(maxScore * 2 - Math.round(maxScore * 2)) > 1e-9) {
      issues.push({ scope: 'items', message: `${item.label}: الدرجة الكلية يجب أن تتدرج بمقدار 0.5 (مثل 0.5، 1، 1.5).` });
    } else {
      validItems.push(item);
    }
    if (!item.skill) issues.push({ scope: 'items', message: `${item.label}: المهارة غير محددة.` });
  });

  const expectedRowCount = Number.isInteger(context.sampleSize) && context.sampleSize > 0
    ? context.sampleSize
    : rows.length;
  const totalCells = expectedRowCount * validItems.length;
  let completedCells = 0;
  let emptyCells = 0;
  let invalidCells = 0;

  if (!rows.length) {
    issues.push({ scope: 'scores', message: 'لم يتم إنشاء جدول درجات العينة.' });
  }
  if (rows.length !== expectedRowCount) {
    issues.push({
      scope: 'scores',
      message: `عدد صفوف الدرجات (${rows.length}) لا يطابق عدد أوراق العينة (${expectedRowCount}). أعد إنشاء جدول العينة.`,
    });
  }

  for (let rowIndex = 0; rowIndex < expectedRowCount; rowIndex += 1) {
    const row = rows[rowIndex];
    const rowId = row?.id ?? `missing-paper-${rowIndex + 1}`;
    const rowLabel = row?.label ?? `ورقة ${rowIndex + 1}`;

    validItems.forEach((item, itemIndex) => {
      const raw = row?.scores?.[item.id];
      const baseIssue = {
        rowId,
        rowLabel,
        rowIndex,
        itemId: item.id,
        itemLabel: item.label,
        itemIndex,
        maxScore: Number(item.maxScore),
      };

      if (isBlankScore(raw)) {
        emptyCells += 1;
        cellIssues.push({
          ...baseIssue,
          type: 'empty',
          message: `${rowLabel}، ${item.label}: الدرجة فارغة.`,
        });
        return;
      }

      const score = Number(raw);
      if (!Number.isFinite(score)) {
        invalidCells += 1;
        cellIssues.push({
          ...baseIssue,
          type: 'not_numeric',
          message: `${rowLabel}، ${item.label}: يجب إدخال قيمة رقمية.`,
        });
        return;
      }
      if (score < 0) {
        invalidCells += 1;
        cellIssues.push({
          ...baseIssue,
          type: 'negative',
          message: `${rowLabel}، ${item.label}: لا يمكن أن تكون الدرجة سالبة.`,
        });
        return;
      }
      if (score > Number(item.maxScore)) {
        invalidCells += 1;
        cellIssues.push({
          ...baseIssue,
          type: 'above_max',
          message: `${rowLabel}، ${item.label}: الدرجة ${score} أعلى من الدرجة الكلية (${item.maxScore}).`,
        });
        return;
      }
      if (Math.abs(score * 2 - Math.round(score * 2)) > 1e-9) {
        invalidCells += 1;
        cellIssues.push({
          ...baseIssue,
          type: 'invalid_increment',
          message: `${rowLabel}، ${item.label}: الدرجة يجب أن تتدرج بمقدار 0.5، مثل 0، 0.5، 1، 1.5.`,
        });
        return;
      }

      completedCells += 1;
    });
  }

  if (emptyCells > 0) {
    issues.push({
      scope: 'scores',
      message: `توجد ${emptyCells} خلية درجة فارغة. يجب استكمال جميع الخلايا قبل بدء التحليل.`,
    });
  }
  if (invalidCells > 0) {
    issues.push({
      scope: 'scores',
      message: `توجد ${invalidCells} خلية درجة غير صالحة. راجع القيم السالبة أو غير الرقمية أو الأعلى من الدرجة الكلية، وتأكد من استخدام درجات بتدرج 0.5.`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    cellIssues,
    totalCells,
    completedCells,
    emptyCells,
    invalidCells,
    excludedItems: 0,
  };
}

function getValidatedScore(row: SampleScoreRow, item: ExamItemDefinition): number {
  const score = Number(row.scores[item.id]);
  const maxScore = Number(item.maxScore);
  if (!Number.isFinite(score) || score < 0 || score > maxScore) {
    throw new Error(`${row.label}، ${item.label}: وصلت قيمة غير صالحة إلى محرك التحليل.`);
  }
  return score;
}

function buildItemResults(items: ExamItemDefinition[], rows: SampleScoreRow[]): { results: ItemAnalysisResult[]; validCells: number; invalidCells: number } {
  const results = items.map((item) => {
    const maxScore = Number(item.maxScore);
    const validScores = rows.map((row) => getValidatedScore(row, item));
    const totalAchieved = validScores.reduce((sum, score) => sum + score, 0);
    const totalAvailable = validScores.length * maxScore;
    const totalLoss = Math.max(0, totalAvailable - totalAchieved);
    const averageScore = mean(validScores);
    const performancePercent = safePercent(totalAchieved, totalAvailable);
    const zeroCount = validScores.filter((score) => score === 0).length;
    const fullCount = validScores.filter((score) => score === maxScore).length;
    const partialCount = validScores.filter((score) => score > 0 && score < maxScore).length;
    const zeroPercent = safePercent(zeroCount, validScores.length);
    const fullPercent = safePercent(fullCount, validScores.length);
    const partialPercent = safePercent(partialCount, validScores.length);
    const band = getItemBand(performancePercent);
    const priority = getItemPriority(performancePercent, totalLoss, totalAvailable, zeroPercent);

    const result: ItemAnalysisResult = {
      itemId: item.id,
      label: item.label,
      skill: item.skill,
      maxScore,
      totalAvailable: roundTo(totalAvailable),
      totalAchieved: roundTo(totalAchieved),
      totalLoss: roundTo(totalLoss),
      averageScore: roundTo(averageScore),
      performancePercent,
      zeroCount,
      zeroPercent,
      fullCount,
      fullPercent,
      partialCount,
      partialPercent,
      standardDeviation: roundTo(standardDeviation(validScores)),
      bandLabel: band.label,
      priority,
      interpretation: '',
    };
    result.interpretation = buildItemInterpretation(result);
    return result;
  });

  return {
    results,
    validCells: rows.length * items.length,
    invalidCells: 0,
  };
}

function groupBalance(items: ExamItemDefinition[]): BalanceEntry[] {
  const totalScore = items.reduce((sum, item) => sum + Number(item.maxScore), 0);
  const map = new Map<string, BalanceEntry>();
  items.forEach((item) => {
    const key = item.skill || 'غير محدد';
    const current = map.get(key) ?? { name: key, itemCount: 0, scoreWeight: 0, scoreWeightPercent: 0 };
    current.itemCount += 1;
    current.scoreWeight = roundTo(current.scoreWeight + Number(item.maxScore));
    map.set(key, current);
  });
  return Array.from(map.values()).map((entry) => ({ ...entry, scoreWeightPercent: safePercent(entry.scoreWeight, totalScore) }));
}

function buildSkillResults(itemResults: ItemAnalysisResult[]): SkillAnalysisResult[] {
  const map = new Map<string, SkillAnalysisResult>();
  itemResults.forEach((item) => {
    const current = map.get(item.skill) ?? {
      skill: item.skill,
      itemCount: 0,
      totalScore: 0,
      totalAvailable: 0,
      totalAchieved: 0,
      totalLoss: 0,
      performancePercent: 0,
      judgement: '',
      recommendation: '',
    };
    current.itemCount += 1;
    current.totalScore = roundTo(current.totalScore + item.maxScore);
    current.totalAvailable = roundTo(current.totalAvailable + item.totalAvailable);
    current.totalAchieved = roundTo(current.totalAchieved + item.totalAchieved);
    current.totalLoss = roundTo(current.totalLoss + item.totalLoss);
    map.set(item.skill, current);
  });

  return Array.from(map.values()).map((skill) => {
    const percent = safePercent(skill.totalAchieved, skill.totalAvailable);
    let judgement = 'قوية';
    let recommendation = 'يمكن توظيف هذه المهارة في أنشطة إثرائية أو تعزيزية.';
    if (percent < 40) {
      judgement = 'تحتاج دعمًا عاليًا';
      recommendation = 'يوصى بتدخل تدريسي موجه لهذه المهارة وإعادة قياسها لاحقًا.';
    } else if (percent < 60) {
      judgement = 'تحتاج متابعة';
      recommendation = 'يوصى بتدريب متدرج وتحليل أمثلة من أخطاء العينة.';
    } else if (percent < 75) {
      judgement = 'مقبولة مع حاجة إلى تثبيت';
      recommendation = 'يوصى بأنشطة تثبيت وتغذية راجعة مركزة.';
    }
    return { ...skill, performancePercent: percent, judgement, recommendation };
  }).sort((a, b) => a.performancePercent - b.performancePercent);
}


function buildDataCompleteness(validCells: number, invalidCells: number): DataCompletenessResult {
  const totalScoreCells = validCells + invalidCells;
  const completionPercent = safePercent(validCells, totalScoreCells);
  let level: DataCompletenessResult['level'] = 'good';
  let label = 'اكتمال جيد للبيانات';
  let message = 'بيانات العينة مكتملة بدرجة جيدة وتدعم قراءة المؤشرات.';
  let warning: string | undefined;

  if (totalScoreCells === 0 || validCells === 0) {
    level = 'low';
    label = 'بيانات غير مكتملة';
    message = 'لا توجد خلايا درجات صحيحة كافية لبناء قراءة موثوقة.';
    warning = 'يلزم إدخال درجات العينة قبل اعتماد التحليل.';
  } else if (completionPercent < 70) {
    level = 'low';
    label = 'اكتمال منخفض للبيانات';
    message = 'نسبة كبيرة من خلايا الدرجات فارغة أو غير صالحة؛ لذلك تُقرأ النتائج بحذر شديد.';
    warning = 'يفضل استكمال درجات العينة أو استبعاد الصفوف/الخلايا غير الصالحة قبل اعتماد التقرير.';
  } else if (completionPercent < 85) {
    level = 'cautious';
    label = 'اكتمال مقبول بحذر';
    message = 'توجد بعض القيم الفارغة أو غير الصالحة، وقد تؤثر في ثبات قراءة بعض المفردات.';
    warning = 'راجع خلايا الدرجات غير المكتملة قبل استخدام النتائج في قرار توثيقي.';
  } else if (completionPercent >= 100) {
    level = 'complete';
    label = 'بيانات مكتملة';
    message = 'جميع خلايا درجات العينة صالحة ومكتملة.';
  }

  return {
    totalScoreCells,
    validScoreCells: validCells,
    invalidScoreCells: invalidCells,
    completionPercent,
    level,
    label,
    message,
    warning,
  };
}

function buildBalanceReading(skillBalance: BalanceEntry[]): BalanceReadingResult {
  const sortedSkills = [...skillBalance].sort((a, b) => b.scoreWeightPercent - a.scoreWeightPercent);
  const topSkill = sortedSkills[0];
  const skillSpread = sortedSkills.map((entry) => `${entry.name}: ${entry.scoreWeightPercent}%`).join('، ');
  let skillReading = 'لا توجد بيانات كافية لقراءة توازن المهارات.';
  if (topSkill) {
    const concentration = topSkill.scoreWeightPercent >= 50
      ? `تتركز درجات الورقة بدرجة واضحة في مهارة ${topSkill.name} بنسبة ${topSkill.scoreWeightPercent}%.`
      : `لا يظهر تركّز حاد في مهارة واحدة؛ أعلى وزن كان لمهارة ${topSkill.name} بنسبة ${topSkill.scoreWeightPercent}%.`;
    skillReading = `${concentration} توزيع الدرجات حسب المهارات: ${skillSpread}.`;
  }
  return { skillReading, overallReading: skillReading };
}

function buildSummary(context: ExamItemsSampleContext, itemResults: ItemAnalysisResult[], excludedItems: number): ExamItemsSampleSummary {
  const paperTotalScore = itemResults.reduce((sum, item) => sum + item.maxScore, 0);
  const totalAvailable = itemResults.reduce((sum, item) => sum + item.totalAvailable, 0);
  const totalAchieved = itemResults.reduce((sum, item) => sum + item.totalAchieved, 0);
  const totalLoss = Math.max(0, totalAvailable - totalAchieved);
  return {
    totalItems: itemResults.length,
    excludedItems,
    sampleSize: context.sampleSize,
    paperTotalScore: roundTo(paperTotalScore),
    totalAvailable: roundTo(totalAvailable),
    totalAchieved: roundTo(totalAchieved),
    totalLoss: roundTo(totalLoss),
    averagePaperScore: roundTo(context.sampleSize ? totalAchieved / context.sampleSize : 0),
    averagePaperPercent: safePercent(totalAchieved, totalAvailable),
    masteryCutoffPercent: context.masteryCutoffPercent,
    masteryCutoffScore: roundTo((paperTotalScore * context.masteryCutoffPercent) / 100),
  };
}

function formatHighPriorityCount(count: number): string {
  if (count === 1) return 'مفردة واحدة عالية الأولوية';
  if (count === 2) return 'مفردتين عاليتَي الأولوية';
  if (count >= 3 && count <= 10) return `${count} مفردات عالية الأولوية`;
  return `${count} مفردة عالية الأولوية`;
}


function buildExamDiagnostics(
  itemResults: ItemAnalysisResult[],
  skills: SkillAnalysisResult[],
  reliability: SampleReliabilityResult,
  dataCompleteness: DataCompletenessResult,
): ExamItemsSampleDiagnosticInsights {
  const itemLossPareto = buildParetoEntries(
    itemResults,
    (item) => item.label,
    (item) => item.totalLoss,
    { note: (item) => `${item.skill} — الأداء ${item.performancePercent}%` },
  );
  const skillLossPareto = buildParetoEntries(
    skills,
    (skill) => skill.skill,
    (skill) => skill.totalLoss,
    { note: (skill) => `الأداء ${skill.performancePercent}% وعدد المفردات ${skill.itemCount}` },
  );
  const skillRadar = skills.map((skill) => ({
    skill: skill.skill,
    percent: skill.performancePercent,
    itemCount: skill.itemCount,
    note: skill.itemCount === 1 ? 'ممثلة بمفردة واحدة' : undefined,
  }));
  const topItem = itemLossPareto[0];
  const topSkill = skillLossPareto[0];
  const weakItems = itemResults.filter((item) => item.priority === 'عالية' || item.performancePercent < 75 || item.zeroPercent >= 35);
  const lowReliability = ['very_low', 'limited'].includes(reliability.level);
  const singleItemSkill = skills.some((skill) => skill.itemCount === 1);
  const confidence = confidenceFromSignals({
    lowReliability,
    singleItemSkills: singleItemSkill,
    completeData: dataCompleteness.level === 'complete',
    strongEvidence: !lowReliability && weakItems.length > 0,
  });
  const fishbone = buildFishboneDiagnostic(
    'خريطة أسباب محتملة لأداء المفردات والمهارات',
    `هذه الخريطة لا تثبت سببًا محددًا، بل تقترح محاور مراجعة في ضوء ${reliability.label} و${dataCompleteness.label}.`,
    [
      {
        title: 'صياغة المفردة',
        evidence: topItem ? `أعلى فقد ظاهر في ${topItem.label}.` : 'لا توجد مفردة ذات فقد واضح.',
        prompts: [
          'هل صياغة المطلوب واضحة وخالية من اللبس؟',
          'هل تتطلب المفردة أكثر من خطوة غير ظاهرة للطالب؟',
          'هل تتسق درجة المفردة مع حجم المطلوب؟',
        ],
      },
      {
        title: 'المهارة المستهدفة',
        evidence: topSkill ? `أكثر مهارة مساهمة في الفقد: ${topSkill.label}.` : 'الفقد المهاري محدود.',
        prompts: [
          'هل المهارة ممثلة بعدد كاف من المفردات؟',
          'هل الضعف موضعي في مفردة واحدة أم ممتد داخل المهارة؟',
          'هل تحتاج المهارة تدريبًا متدرجًا قبل إعادة القياس؟',
        ],
      },
      {
        title: 'العينة والتمثيل',
        evidence: reliability.message,
        prompts: [
          'هل حجم العينة كاف لبناء حكم على الورقة؟',
          'هل تمثل العينة مستويات أداء مختلفة؟',
          'هل يلزم توسيع العينة قبل اعتماد قرار نهائي؟',
        ],
      },
      {
        title: 'التدريس والتغذية الراجعة',
        prompts: [
          'هل حصلت المهارة الأضعف على تدريب كاف؟',
          'هل عولجت الأخطاء الشائعة قبل القياس؟',
          'هل يحتاج الطلبة نشاط دعم قصيرًا ثم إعادة قياس؟',
        ],
      },
      {
        title: 'التصحيح ومعيار الدرجة',
        prompts: [
          'هل معيار التصحيح واضح وثابت؟',
          'هل الفقد مرتبط بخطوة محددة في الإجابة؟',
          'هل يلزم تحليل نماذج إجابات من العينة؟',
        ],
      },
    ],
  );
  const decision = buildDiagnosticDecision({
    priorityTitle: 'أولوية التدخل في تحليل مفردات الورقة',
    priorityTarget: topItem ? `${topItem.label}${topSkill ? ` / ${topSkill.label}` : ''}` : 'لا توجد أولوية فقد واضحة',
    reason: topItem ? getParetoTopSummary(itemLossPareto, 'الفقد') : 'لا توجد مفردة ذات فقد يستدعي ترتيبًا علاجيًا.',
    recommendedAction: topItem ? 'ابدأ بمراجعة المفردة الأعلى فقدًا وربطها بالمهارة المقابلة، ثم نفذ نشاط دعم قصيرًا قبل إعادة القياس.' : 'حافظ على بنية الورقة مع متابعة توازن المهارات.',
    retestEvidence: topSkill ? `إعادة قياس قصيرة في مهارة ${topSkill.label} أو مفردة مشابهة خلال أسبوع.` : 'إعادة قياس عند الحاجة للتحقق من ثبات الأداء.',
    confidence,
    caution: 'لا تُقرأ هذه اللوحة بوصفها حكمًا على جودة التدريس أو المفردة منفردة؛ بل إطار قرار يستند إلى العينة والبيانات المدخلة.',
  });
  return { itemLossPareto, skillLossPareto, skillRadar, fishbone, decision };
}

function buildDecision(
  itemResults: ItemAnalysisResult[],
  skills: SkillAnalysisResult[],
  reliability: SampleReliabilityResult,
  dataCompleteness: DataCompletenessResult,
): ExamItemsSampleDecision {
  const lowestPerformanceItems = [...itemResults]
    .sort((a, b) => a.performancePercent - b.performancePercent || b.totalLoss - a.totalLoss)
    .slice(0, 5);
  const highestLossItems = [...itemResults]
    .sort((a, b) => b.totalLoss - a.totalLoss || a.performancePercent - b.performancePercent)
    .slice(0, 5);
  const priorityItems = [...itemResults]
    .filter((item) => item.priority === 'عالية')
    .sort((a, b) => b.totalLoss - a.totalLoss || a.performancePercent - b.performancePercent);
  const mediumItems = itemResults.filter((item) => item.priority === 'متوسطة');
  const sortedSkills = [...skills].sort((a, b) => a.performancePercent - b.performancePercent || b.totalLoss - a.totalLoss);
  const prioritySkills = sortedSkills.slice(0, 3);
  const minimumSkillPerformance = sortedSkills[0]?.performancePercent;
  const lowestSkills = minimumSkillPerformance === undefined
    ? []
    : sortedSkills.filter((skill) => Math.abs(skill.performancePercent - minimumSkillPerformance) < 0.05);

  const overallReading = priorityItems.length
    ? `تشير نتائج العينة إلى وجود ${formatHighPriorityCount(priorityItems.length)} وفق معيار الأولوية المعتمد، مع ضرورة قراءة النتائج في ضوء ${reliability.label} و${dataCompleteness.label}.`
    : mediumItems.length
      ? `لا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد، مع استمرار الحاجة إلى متابعة المفردات متوسطة الأداء وقراءتها مع المفردات الأعلى فقدًا كدلائل مساعدة، في ضوء ${reliability.label} و${dataCompleteness.label}.`
      : `لا توجد مفردات عالية الأولوية وفق معيار الأولوية المعتمد، وتُقرأ النتائج في ضوء ${reliability.label} و${dataCompleteness.label}.`;

  let teachingDecision = 'لا توجد مهارات كافية لبناء قرار تدريسي محدد.';
  if (lowestSkills.length) {
    const names = lowestSkills.map((skill) => skill.skill).join('، ');
    teachingDecision = lowestSkills.length === 1
      ? `تبدأ المتابعة التدريسية من أقل مهارة أداءً: ${names}، ثم تُراجع المهارات التالية حسب الفقد وترتيب الاحتياج.`
      : `تبدأ المتابعة التدريسية من أقل المهارات أداءً: ${names}، ثم تُراجع المهارات التالية حسب الفقد وترتيب الاحتياج.`;
  }

  const paperReviewDecision = priorityItems.length
    ? 'يوصى بمراجعة المفردات عالية الأولوية أو ذات الفقد المرتفع مراجعة تربوية وصياغية، مع عدم إصدار حكم نهائي على المفردة دون فحص سياق التدريس والتصحيح.'
    : mediumItems.length
      ? 'يوصى بالاحتفاظ ببنية الورقة مع مراجعة عامة للتوازن والتدرج، ومتابعة المفردات متوسطة الأداء أو الأعلى فقدًا كدلائل مساعدة.'
      : 'يوصى بالاحتفاظ ببنية الورقة، مع متابعة توازنها والمحافظة على جودة المفردات المستقرة.';

  const recommendations = [
    'فصل قراءة المفردات الأقل أداءً عن المفردات الأعلى فقدًا؛ لأن الصعوبة النسبية ليست دائمًا هي الأعلى أثرًا في الدرجة.',
    'قراءة المفردات الأقل أداءً مع المفردات الأعلى فقدًا قبل إصدار حكم على جودة الورقة.',
    'ربط نتائج المفردات بتحليل المهارات لتحديد هل الحاجة في مفردة محددة أم في مهارة ممتدة.',
    'مراجعة توازن الورقة في ضوء توزيع الدرجات حسب المهارات.',
    'تنفيذ خطة تدريسية قصيرة ثم إعادة قياس المهارات أو المفردات ذات الأولوية.',
  ];

  const nextSteps = priorityItems.length
    ? [
        'تنفيذ مراجعة تربوية للمفردات عالية الأولوية والمفردات الأعلى فقدًا.',
        'إعداد نشاط علاجي أو داعم للمهارات الأقل أداءً في العينة.',
        'مراجعة توازن الورقة القادمة وفق قراءة المهارات.',
      ]
    : mediumItems.length
      ? [
          'تنفيذ مراجعة تربوية للمفردات متوسطة الأداء والمفردات الأعلى فقدًا.',
          'إعداد نشاط داعم للمهارات الأقل أداءً في العينة.',
          'مراجعة توازن الورقة القادمة وفق قراءة المهارات.',
        ]
      : [
          'المحافظة على مستوى المفردات المستقرة مع تقديم أنشطة إثرائية مناسبة.',
          'مراجعة توازن الورقة القادمة وفق قراءة المهارات.',
          'إعادة القياس للتحقق من ثبات الأداء.',
        ];

  if (reliability.level === 'very_low' || reliability.level === 'limited') {
    nextSteps.push('توسيع العينة أو تحليل جميع الأوراق قبل بناء حكم نهائي على الورقة.');
  }

  return {
    overallReading,
    teachingDecision,
    paperReviewDecision,
    priorityItems,
    lowestPerformanceItems,
    highestLossItems,
    prioritySkills,
    recommendations,
    nextSteps,
  };
}

export function runExamItemsSampleAnalysis(
  context: ExamItemsSampleContext,
  items: ExamItemDefinition[],
  rows: SampleScoreRow[],
): ExamItemsSampleAnalysisResult {
  const readiness = validateAnalysisReadiness(context, items, rows);
  if (!readiness.valid) {
    throw new ExamItemsSampleValidationError(readiness);
  }

  const reliability = evaluateSampleReliability(context.totalPapers, context.sampleSize, context.sampleSelectionMethod);
  const { results: itemResults, validCells, invalidCells } = buildItemResults(items, rows);
  const skills = buildSkillResults(itemResults);
  const summary = buildSummary(context, itemResults, 0);
  const skillBalance = groupBalance(items);
  const dataCompleteness = buildDataCompleteness(validCells, invalidCells);
  const balanceReading = buildBalanceReading(skillBalance);
  const decision = buildDecision(itemResults, skills, reliability, dataCompleteness);
  const diagnostics = buildExamDiagnostics(itemResults, skills, reliability, dataCompleteness);

  return {
    context,
    items: itemResults,
    skills,
    skillBalance,
    reliability,
    dataCompleteness,
    summary,
    balanceReading,
    decision,
    diagnostics,
    validation: {
      valid: true,
      issues: [],
      validScoreCells: validCells,
      invalidScoreCells: invalidCells,
    },
  };
}

export function createDefaultItems(count: number): ExamItemDefinition[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) => ({
    id: `q${index + 1}`,
    label: `س${index + 1}`,
    maxScore: '',
    skill: ['المعرفة', 'الفهم', 'التطبيق', 'الاستدلال', 'القدرات العليا'][index % 5],
  }));
}

export function createDefaultSampleRows(sampleSize: number, items: ExamItemDefinition[]): SampleScoreRow[] {
  return Array.from({ length: Math.max(1, Math.floor(sampleSize)) }, (_, rowIndex) => ({
    id: `paper${rowIndex + 1}`,
    label: `ورقة ${rowIndex + 1}`,
    scores: Object.fromEntries(items.map((item) => [item.id, ''])),
  }));
}
