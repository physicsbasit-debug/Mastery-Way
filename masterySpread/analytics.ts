import {
  DEFAULT_DECIMAL_PLACES,
  DEFAULT_DEEP_GAP_MARGIN,
  DEFAULT_MASTERY_CUTOFF_PERCENT,
  DEFAULT_NEAR_MASTERY_MARGIN,
  DEFAULT_TOTAL_SCORE,
  getAcademicYearFromDate,
  getLocalDateString,
  GROUP_SHAPE_THRESHOLDS,
  IMPROVEMENT_OPPORTUNITY_LABELS,
  JUDGEMENT_LABELS,
  MASTERY_JUDGEMENT_SCALE,
  PERCENT_HISTOGRAM_BUCKETS,
  VALIDATION_REASON_LABELS,
} from './constants';
import {
  buildEducationalDecision,
  buildProposedPlan,
  buildReport,
} from './reportText';
import {
  formatAdditionalStudents,
  formatPercentagePointAmount,
  formatScoreCount,
  formatStudentCount,
  roundPercentagesToHundred,
  roundTo,
  toFiniteNumber,
  tokenizeScoresText,
} from './utils';
import type {
  BasicStatistics,
  EducationalDecision,
  GapToNextLevel,
  GroupDataQuality,
  GroupShapeAnalysis,
  HistogramBucket,
  InvalidScoreReason,
  InvalidScoreRecord,
  MasteryDistributionBand,
  MasteryJudgement,
  MasteryJudgementCode,
  MasterySpreadAnalysisInput,
  MasterySpreadAnalysisResult,
  MasterySpreadContext,
  MasterySpreadReadiness,
  MasterySpreadSettings,
  MasterySpreadSummary,
  MasterySpreadValidationIssue,
  NormalizedMasterySpreadSettings,
  ValidScoreRecord,
  ValidationSummary,
  MasterySpreadDiagnosticInsights,
} from './types';
import { buildDiagnosticDecision, buildFishboneDiagnostic, buildParetoEntries, confidenceFromSignals, getParetoTopSummary } from '../shared/diagnosticText';

export class MasterySpreadValidationError extends Error {
  validation: ValidationSummary;

  constructor(validation: ValidationSummary) {
    super(validation.issues[0]?.message || 'تعذر بدء تحليل انتشار الإتقان بسبب بيانات غير صالحة.');
    this.name = 'MasterySpreadValidationError';
    this.validation = validation;
  }
}

function normalizeContext(context?: MasterySpreadContext): Required<MasterySpreadContext> {
  return {
    educationDirectorate: context?.educationDirectorate?.trim() || 'غير محدد',
    schoolName: context?.schoolName?.trim() || 'غير محدد',
    teacherName: context?.teacherName?.trim() || 'غير محدد',
    academicYear: context?.academicYear?.trim() || getAcademicYearFromDate(),
    analysisDate: context?.analysisDate?.trim() || getLocalDateString(),
    groupDescription: context?.groupDescription?.trim() || 'غير محدد',
    subject: context?.subject?.trim() || 'غير محدد',
    grade: context?.grade?.trim() || 'غير محدد',
    assessmentName: context?.assessmentName?.trim() || 'غير محدد',
  };
}

export function parseScoresText(rawText: string): string[] {
  return tokenizeScoresText(rawText);
}

function extractRawScoreTokens(input: MasterySpreadAnalysisInput): string[] {
  if (Array.isArray(input.scores) && input.scores.length > 0) {
    return input.scores.map((score) => String(score));
  }
  return input.rawScoresText ? parseScoresText(input.rawScoresText) : [];
}

function issue(code: MasterySpreadValidationIssue['code'], message: string): MasterySpreadValidationIssue {
  return { code, message };
}

function normalizeAndValidateSettings(settings: MasterySpreadSettings): {
  normalized: NormalizedMasterySpreadSettings | null;
  issues: MasterySpreadValidationIssue[];
} {
  const issues: MasterySpreadValidationIssue[] = [];
  const totalScore = toFiniteNumber(settings.totalScore);
  const masteryCutoffPercent = toFiniteNumber(settings.masteryCutoffPercent);
  const nearMasteryMargin = toFiniteNumber(settings.nearMasteryMargin ?? DEFAULT_NEAR_MASTERY_MARGIN);
  const deepGapMargin = toFiniteNumber(settings.deepGapMargin ?? DEFAULT_DEEP_GAP_MARGIN);
  const expectedStudentCountRaw = settings.expectedStudentCount === '' || settings.expectedStudentCount === undefined
    ? null
    : toFiniteNumber(settings.expectedStudentCount);
  const decimalPlacesRaw = toFiniteNumber(settings.decimalPlaces ?? DEFAULT_DECIMAL_PLACES);

  if (totalScore === null || totalScore <= 0) {
    issues.push(issue('invalid_total_score', 'الدرجة الكلية يجب أن تكون رقمًا أكبر من صفر.'));
  }
  if (masteryCutoffPercent === null || masteryCutoffPercent <= 0 || masteryCutoffPercent > 100) {
    issues.push(issue('invalid_mastery_cutoff', 'حد الإتقان يجب أن يكون أكبر من 0% وأقل من أو يساوي 100%.'));
  }
  if (nearMasteryMargin === null || nearMasteryMargin <= 0) {
    issues.push(issue('invalid_near_margin', 'هامش القرب من الإتقان يجب أن يكون رقمًا أكبر من صفر.'));
  }
  if (deepGapMargin === null || deepGapMargin <= 0) {
    issues.push(issue('invalid_deep_gap_margin', 'هامش الفجوة العميقة يجب أن يكون رقمًا أكبر من صفر.'));
  }
  if (nearMasteryMargin !== null && deepGapMargin !== null && deepGapMargin <= nearMasteryMargin) {
    issues.push(issue('overlapping_gap_margins', 'هامش الفجوة العميقة يجب أن يكون أكبر من هامش القرب؛ حتى ينتمي كل طالب إلى فئة واحدة فقط.'));
  }
  if (masteryCutoffPercent !== null && deepGapMargin !== null && deepGapMargin > masteryCutoffPercent) {
    issues.push(issue('deep_gap_margin_above_cutoff', 'هامش الفجوة العميقة لا يجوز أن يتجاوز حد الإتقان.'));
  }
  if (settings.expectedStudentCount !== '' && settings.expectedStudentCount !== undefined) {
    if (expectedStudentCountRaw === null || !Number.isInteger(expectedStudentCountRaw) || expectedStudentCountRaw <= 0) {
      issues.push(issue('invalid_expected_count', 'العدد المتوقع للطلبة يجب أن يكون عددًا صحيحًا أكبر من صفر، أو يترك فارغًا.'));
    }
  }

  if (issues.length > 0 || totalScore === null || masteryCutoffPercent === null || nearMasteryMargin === null || deepGapMargin === null) {
    return { normalized: null, issues };
  }

  return {
    normalized: {
      totalScore,
      masteryCutoffPercent,
      nearMasteryMargin,
      deepGapMargin,
      expectedStudentCount: expectedStudentCountRaw ?? undefined,
      decimalPlaces: Math.max(0, Math.min(3, Math.round(decimalPlacesRaw ?? DEFAULT_DECIMAL_PLACES))),
    },
    issues,
  };
}

function createInvalidRecord(index: number, rawValue: string, reason: InvalidScoreReason, totalScore?: number): InvalidScoreRecord {
  const reasonText = VALIDATION_REASON_LABELS[reason];
  let message = `القيمة رقم ${index + 1} «${rawValue || 'فارغة'}»: ${reasonText}.`;
  if (reason === 'above_total_score' && totalScore !== undefined) {
    message = `القيمة رقم ${index + 1} «${rawValue}» تتجاوز الدرجة الكلية (${totalScore}).`;
  } else if (reason === 'negative_score') {
    message = `القيمة رقم ${index + 1} «${rawValue}» سالبة، والدرجات السالبة غير مقبولة.`;
  } else if (reason === 'not_numeric') {
    message = `القيمة رقم ${index + 1} «${rawValue}» غير رقمية.`;
  }
  return { index, position: index + 1, rawValue, reason, message };
}

export function validateMasterySpreadReadiness(input: MasterySpreadAnalysisInput): MasterySpreadReadiness {
  const rawTokens = extractRawScoreTokens(input);
  const { normalized, issues: settingIssues } = normalizeAndValidateSettings(input.settings);
  const invalidRecords: InvalidScoreRecord[] = [];
  const validScores: ValidScoreRecord[] = [];

  if (rawTokens.length === 0) {
    settingIssues.push(issue('no_scores', 'أدخل درجة واحدة على الأقل قبل بدء التحليل.'));
  }

  rawTokens.forEach((token, index) => {
    const stripped = token.replace(/%/g, '').trim();
    if (!stripped) {
      invalidRecords.push(createInvalidRecord(index, token, 'empty_value', normalized?.totalScore));
      return;
    }
    const numericValue = Number(stripped);
    if (!Number.isFinite(numericValue)) {
      invalidRecords.push(createInvalidRecord(index, token, 'not_numeric', normalized?.totalScore));
      return;
    }
    if (numericValue < 0) {
      invalidRecords.push(createInvalidRecord(index, token, 'negative_score', normalized?.totalScore));
      return;
    }
    if (normalized && numericValue > normalized.totalScore) {
      invalidRecords.push(createInvalidRecord(index, token, 'above_total_score', normalized.totalScore));
      return;
    }
    if (!normalized) return;

    const rawPercent = (numericValue / normalized.totalScore) * 100;
    const rawGap = Math.max(0, normalized.masteryCutoffPercent - rawPercent);
    validScores.push({
      index,
      score: numericValue,
      rawPercent,
      percent: roundTo(rawPercent, normalized.decimalPlaces),
      isMastery: rawPercent >= normalized.masteryCutoffPercent,
      rawGapToMasteryPercent: rawGap,
      gapToMasteryPercent: roundTo(rawGap, normalized.decimalPlaces),
    });
  });

  const validationIssues = [...settingIssues];
  if (invalidRecords.length > 0) {
    validationIssues.push(issue('invalid_scores_present', `توجد ${invalidRecords.length} قيمة غير صالحة. صحح جميع القيم قبل إصدار الحكم والتقرير.`));
  }

  const expected = normalized?.expectedStudentCount;
  let missingScoresCount = 0;
  let extraScoresCount = 0;
  if (expected !== undefined) {
    missingScoresCount = Math.max(0, expected - rawTokens.length);
    extraScoresCount = Math.max(0, rawTokens.length - expected);
    if (rawTokens.length !== expected) {
      validationIssues.push(issue(
        'expected_count_mismatch',
        rawTokens.length < expected
          ? `العدد المتوقع ${expected} طالبًا، بينما تم إدخال ${rawTokens.length} درجة فقط.`
          : `العدد المتوقع ${expected} طالبًا، بينما تم إدخال ${rawTokens.length} درجة.`
      ));
    }
  }

  const denominator = expected ?? rawTokens.length;
  const completionPercent = denominator > 0 ? roundTo(Math.min(validScores.length, denominator) / denominator * 100, 1) : 0;
  const warnings: string[] = [];
  if (validationIssues.length === 0 && validScores.length > 0 && validScores.length < 5) {
    warnings.push(`حجم المجموعة صغير؛ يؤدي انتقال طالب واحد إلى تغيير نسبة الانتشار بمقدار نحو ${formatPercentagePointAmount(roundTo(100 / validScores.length, 1))}.`);
  }

  const validation: ValidationSummary = {
    valid: validationIssues.length === 0 && validScores.length > 0,
    totalTokens: rawTokens.length,
    validCount: validScores.length,
    invalidCount: invalidRecords.length,
    invalidRecords,
    issues: validationIssues,
    warnings,
    expectedStudentCount: expected,
    missingScoresCount,
    extraScoresCount,
    completionPercent,
  };

  return { validation, validScores, normalizedSettings: normalized };
}

function calculateStatistics(validScores: ValidScoreRecord[], decimals: number): BasicStatistics {
  const values = validScores.map((record) => record.rawPercent).sort((a, b) => a - b);
  const total = values.reduce((sum, value) => sum + value, 0);
  const mean = total / values.length;
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle];
  const min = values[0];
  const max = values[values.length - 1];
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {
    meanPercent: roundTo(mean, decimals),
    medianPercent: roundTo(median, decimals),
    minPercent: roundTo(min, decimals),
    maxPercent: roundTo(max, decimals),
    rangePercent: roundTo(max - min, decimals),
    standardDeviationPercent: roundTo(Math.sqrt(variance), decimals),
  };
}

function getJudgement(rawSpreadPercent: number): MasteryJudgement {
  return MASTERY_JUDGEMENT_SCALE.find((item) =>
    item.code === 'distinguished'
      ? rawSpreadPercent >= item.minPercent
      : rawSpreadPercent >= item.minPercent && rawSpreadPercent < item.maxPercent
  ) ?? MASTERY_JUDGEMENT_SCALE[MASTERY_JUDGEMENT_SCALE.length - 1];
}

function getNextJudgement(judgement: MasteryJudgement): MasteryJudgement | undefined {
  return [...MASTERY_JUDGEMENT_SCALE]
    .sort((a, b) => a.rank - b.rank)
    .find((item) => item.rank === judgement.rank + 1);
}

function calculateSummary(validScores: ValidScoreRecord[], settings: NormalizedMasterySpreadSettings): MasterySpreadSummary {
  const totalStudents = validScores.length;
  const masteryCount = validScores.filter((record) => record.isMastery).length;
  const rawMasterySpreadPercent = (masteryCount / totalStudents) * 100;
  const masteryCutoffScoreRaw = settings.masteryCutoffPercent / 100 * settings.totalScore;
  return {
    totalStudents,
    masteryCount,
    nonMasteryCount: totalStudents - masteryCount,
    rawMasterySpreadPercent,
    masterySpreadPercent: roundTo(rawMasterySpreadPercent, settings.decimalPlaces),
    masteryCutoffPercent: settings.masteryCutoffPercent,
    totalScore: settings.totalScore,
    masteryCutoffScore: roundTo(masteryCutoffScoreRaw, settings.decimalPlaces),
    minimumWholeScoreForMastery: Math.ceil(masteryCutoffScoreRaw),
  };
}

function calculateGapToNextLevel(summary: MasterySpreadSummary, judgement: MasteryJudgement, decimals: number): GapToNextLevel {
  const next = getNextJudgement(judgement);
  if (!next) {
    return {
      hasNextLevel: false,
      currentJudgement: judgement.code,
      rawCurrentSpreadPercent: summary.rawMasterySpreadPercent,
      currentSpreadPercent: summary.masterySpreadPercent,
      rawGapPoints: 0,
      gapPoints: 0,
      additionalStudentsNeeded: 0,
      message: 'لا يوجد مستوى أعلى في سلم الحكم المعتمد. تركز الخطة على تثبيت انتشار الإتقان، ودعم غير المتقنين، وتقديم الإثراء المناسب.',
    };
  }

  const requiredSpreadPercent = next.minPercent;
  const requiredMasteryCount = Math.ceil(requiredSpreadPercent / 100 * summary.totalStudents);
  const additionalStudentsNeeded = Math.max(0, requiredMasteryCount - summary.masteryCount);
  const rawGapPoints = Math.max(0, requiredSpreadPercent - summary.rawMasterySpreadPercent);
  return {
    hasNextLevel: true,
    currentJudgement: judgement.code,
    nextJudgement: next.code,
    nextJudgementLabel: JUDGEMENT_LABELS[next.code as MasteryJudgementCode],
    requiredSpreadPercent,
    rawCurrentSpreadPercent: summary.rawMasterySpreadPercent,
    currentSpreadPercent: summary.masterySpreadPercent,
    rawGapPoints,
    gapPoints: roundTo(rawGapPoints, decimals),
    requiredMasteryCount,
    additionalStudentsNeeded,
    message: additionalStudentsNeeded === 0
      ? `بلغت المجموعة الحد العددي المطلوب لمستوى «${next.label}».`
      : `تحتاج المجموعة إلى ${formatAdditionalStudents(additionalStudentsNeeded)} إلى فئة الإتقان للخروج من المستوى الحالي «${judgement.label}» وبلوغ الحد الأدنى للمستوى التالي «${next.label}».`,
  };
}

function calculateDistribution(validScores: ValidScoreRecord[], settings: NormalizedMasterySpreadSettings): MasteryDistributionBand[] {
  const nearStart = Math.max(0, settings.masteryCutoffPercent - settings.nearMasteryMargin);
  const deepStart = Math.max(0, settings.masteryCutoffPercent - settings.deepGapMargin);
  const definitions = [
    {
      key: 'mastery' as const,
      label: 'حققوا حد الإتقان',
      test: (percent: number) => percent >= settings.masteryCutoffPercent,
      minPercent: settings.masteryCutoffPercent,
      maxPercent: 100,
      interpretation: 'يمثلون حجم انتشار الإتقان الحالي داخل المجموعة.',
    },
    {
      key: 'near_mastery' as const,
      label: 'قريبون من الإتقان',
      test: (percent: number) => percent >= nearStart && percent < settings.masteryCutoffPercent,
      minPercent: nearStart,
      maxPercent: settings.masteryCutoffPercent,
      interpretation: 'يمثلون فرصة رفع قريبة إذا نُفذ تدخل قصير وموجه.',
    },
    {
      key: 'moderate_gap' as const,
      label: 'فجوة متوسطة',
      test: (percent: number) => percent >= deepStart && percent < nearStart,
      minPercent: deepStart,
      maxPercent: nearStart,
      interpretation: 'يحتاجون دعمًا جماعيًا موجهًا قبل بلوغ حد الإتقان.',
    },
    {
      key: 'deep_gap' as const,
      label: 'فجوة عميقة',
      test: (percent: number) => percent < deepStart,
      minPercent: 0,
      maxPercent: deepStart,
      interpretation: 'تشير هذه الفئة إلى حاجة علاجية أعمق على مستوى المجموعة.',
    },
  ];
  const counts = definitions.map((definition) => validScores.filter((record) => definition.test(record.rawPercent)).length);
  const rawPercents = counts.map((count) => count / validScores.length * 100);
  const displayed = roundPercentagesToHundred(rawPercents, settings.decimalPlaces);
  return definitions.map((definition, index) => ({
    key: definition.key,
    label: definition.label,
    count: counts[index],
    rawPercent: rawPercents[index],
    percent: displayed[index],
    minPercent: definition.minPercent,
    maxPercent: definition.maxPercent,
    interpretation: definition.interpretation,
  }));
}

function calculateHistogram(validScores: ValidScoreRecord[], decimals: number): HistogramBucket[] {
  const counts = PERCENT_HISTOGRAM_BUCKETS.map((bucket) => validScores.filter((record) => record.rawPercent >= bucket.min && record.rawPercent < bucket.max).length);
  const rawPercents = counts.map((count) => count / validScores.length * 100);
  const displayed = roundPercentagesToHundred(rawPercents, decimals);
  return PERCENT_HISTOGRAM_BUCKETS.map((bucket, index) => ({
    key: bucket.key,
    label: bucket.label,
    minPercent: bucket.min,
    maxPercent: Math.min(100, bucket.max),
    count: counts[index],
    rawPercent: rawPercents[index],
    percent: displayed[index],
  }));
}

function calculateGroupShape(distribution: MasteryDistributionBand[], statistics: BasicStatistics, decimals: number): GroupShapeAnalysis {
  const nearBand = distribution.find((band) => band.key === 'near_mastery');
  const deepBand = distribution.find((band) => band.key === 'deep_gap');
  const nearMasteryPercent = nearBand?.percent ?? 0;
  const deepGapPercent = deepBand?.percent ?? 0;
  let dispersionLevel: GroupShapeAnalysis['dispersionLevel'] = 'medium';
  if (statistics.standardDeviationPercent < GROUP_SHAPE_THRESHOLDS.lowDispersionMax) dispersionLevel = 'low';
  if (statistics.standardDeviationPercent >= GROUP_SHAPE_THRESHOLDS.highDispersionMin) dispersionLevel = 'high';
  const dispersionLabel = dispersionLevel === 'low' ? 'منخفض' : dispersionLevel === 'high' ? 'مرتفع' : 'متوسط';
  let improvementOpportunity: GroupShapeAnalysis['improvementOpportunity'] = 'none';
  if (nearMasteryPercent >= GROUP_SHAPE_THRESHOLDS.highOpportunityNearPercent) improvementOpportunity = 'high';
  else if (nearMasteryPercent >= GROUP_SHAPE_THRESHOLDS.mediumOpportunityNearPercent) improvementOpportunity = 'medium';
  else if (nearMasteryPercent > 0) improvementOpportunity = 'limited';
  return {
    dispersionLevel,
    dispersionLabel,
    nearMasteryCount: nearBand?.count ?? 0,
    nearMasteryPercent: roundTo(nearMasteryPercent, decimals),
    deepGapCount: deepBand?.count ?? 0,
    deepGapPercent: roundTo(deepGapPercent, decimals),
    improvementOpportunity,
    interpretation: `مستوى التشتت ${dispersionLabel}. بلغت نسبة القريبين من الإتقان ${roundTo(nearMasteryPercent, decimals)}%، وبلغت نسبة الفجوة العميقة ${roundTo(deepGapPercent, decimals)}%. وتُصنف فرصة التحسن القريب بأنها «${IMPROVEMENT_OPPORTUNITY_LABELS[improvementOpportunity]}».`,
  };
}

function calculateDataQuality(summary: MasterySpreadSummary, validation: ValidationSummary, decimals: number): GroupDataQuality {
  const singleStudentImpactPoints = roundTo(100 / summary.totalStudents, decimals);
  const smallGroup = summary.totalStudents < 5;
  const expectedText = validation.expectedStudentCount
    ? `تم إدخال ${formatScoreCount(summary.totalStudents)}. العدد المتوقع: ${formatStudentCount(validation.expectedStudentCount)}.`
    : `تم إدخال ${formatScoreCount(summary.totalStudents)} صحيحة.`;
  return {
    label: smallGroup ? 'بيانات مكتملة لمجموعة صغيرة' : 'بيانات مكتملة',
    expectedStudentCount: validation.expectedStudentCount,
    enteredStudentCount: summary.totalStudents,
    completenessPercent: validation.completionPercent,
    singleStudentImpactPoints,
    interpretation: smallGroup
      ? `${expectedText} حجم المجموعة: ${formatStudentCount(summary.totalStudents)}؛ لذلك يؤدي انتقال طالب واحد إلى تغيير نسبة انتشار الإتقان بمقدار نحو ${formatPercentagePointAmount(singleStudentImpactPoints)}، وتُقرأ الفروق الصغيرة بحذر.`
      : `${expectedText} لا توجد قيم غير صالحة. يؤدي انتقال طالب واحد إلى تغيير نسبة الانتشار بمقدار نحو ${formatPercentagePointAmount(singleStudentImpactPoints)}.`,
  };
}


function buildMasterySpreadDiagnostics(
  distribution: MasteryDistributionBand[],
  groupShape: GroupShapeAnalysis,
  gapToNextLevel: GapToNextLevel,
  dataQuality: GroupDataQuality,
  educationalDecision: EducationalDecision,
): MasterySpreadDiagnosticInsights {
  const gapBands = distribution.filter((band) => band.key !== 'mastery');
  const gapPareto = buildParetoEntries(
    gapBands,
    (band) => band.label,
    (band) => band.count,
    { note: (band) => band.interpretation },
  );
  const topGap = gapPareto[0];
  const confidence = confidenceFromSignals({
    lowReliability: dataQuality.enteredStudentCount < 5,
    singleItemSkills: false,
    completeData: dataQuality.completenessPercent >= 100,
    strongEvidence: dataQuality.enteredStudentCount >= 10,
  });
  const fishbone = buildFishboneDiagnostic(
    'خريطة أسباب محتملة لفجوة انتشار الإتقان',
    'هذا المسار لا يحدد المهارات أو أسباب الانخفاض من الدرجة النهائية وحدها؛ الخريطة تعرض محاور فحص قبل بناء تفسير سببي.',
    [
      {
        title: 'شكل المجموعة',
        evidence: groupShape.interpretation,
        prompts: [
          'هل الفجوة متركزة في فئة عميقة أم قريبة من الإتقان؟',
          'هل يحتاج التدخل إلى دعم قصير أم خطة علاجية أوسع؟',
          'هل التشتت يسمح بتدخل جماعي موحد أم مجموعات مرنة؟',
        ],
      },
      {
        title: 'القرب من الإتقان',
        evidence: `القريبون من الإتقان: ${groupShape.nearMasteryCount}.`,
        prompts: [
          'هل يمكن رفع القريبين بتدخل قصير؟',
          'هل معيار النجاح في الخطة يستهدف الانتقال للمستوى التالي؟',
          'هل تكفي أنشطة دعم مركزة قبل إعادة القياس؟',
        ],
      },
      {
        title: 'الفجوة العميقة',
        evidence: `الفجوة العميقة: ${groupShape.deepGapCount}.`,
        prompts: [
          'هل توجد حاجة لخطة علاجية أعمق؟',
          'هل ينبغي تقسيم الطلبة إلى مجموعات دعم؟',
          'هل يحتاج بعض الطلبة إلى تدخل سابق لحد الإتقان؟',
        ],
      },
      {
        title: 'أداة القياس',
        prompts: [
          'هل أداة القياس مناسبة لحد الإتقان المختار؟',
          'هل تغطي المهارات أو المفاهيم المستهدفة؟',
          'هل نحتاج تحليل مفردات الورقة لتحديد مواضع الضعف؟',
        ],
      },
      {
        title: 'بيانات إضافية',
        evidence: dataQuality.interpretation,
        prompts: [
          'هل عدد الدرجات يمثل المجموعة المقصودة؟',
          'هل توجد بيانات تشخيصية داعمة؟',
          'هل يلزم إعادة القياس بعد التدخل لا قبل إصدار حكم نهائي؟',
        ],
      },
    ],
  );
  const decision = buildDiagnosticDecision({
    priorityTitle: 'أولوية فجوة انتشار الإتقان',
    priorityTarget: topGap ? topGap.label : 'لا توجد فجوة ظاهرة خارج فئة الإتقان',
    reason: topGap ? getParetoTopSummary(gapPareto, 'فئات غير المتقنين') : 'غالبية المجموعة حققت حد الإتقان ولا توجد فئة فجوة بارزة.',
    recommendedAction: educationalDecision.decisionLabel,
    retestEvidence: gapToNextLevel.hasNextLevel
      ? `إعادة القياس بعد تدخل قصير للتحقق من ${formatAdditionalStudents(gapToNextLevel.additionalStudentsNeeded)} إلى حد الإتقان أو بلوغ ${gapToNextLevel.requiredSpreadPercent}%.`
      : 'إعادة القياس للتحقق من تثبيت المستوى ودعم غير المتقنين.',
    confidence,
    caution: 'لا يستنتج هذا المسار مهارات الضعف من الدرجة النهائية؛ عند الحاجة يوصى بالرجوع إلى تحليل مفردات الورقة أو أداة تشخيصية إضافية.',
  });
  return { gapPareto, fishbone, decision };
}

export function runMasterySpreadAnalysis(input: MasterySpreadAnalysisInput): MasterySpreadAnalysisResult {
  const readiness = validateMasterySpreadReadiness(input);
  if (!readiness.validation.valid || !readiness.normalizedSettings) {
    throw new MasterySpreadValidationError(readiness.validation);
  }
  const settings = readiness.normalizedSettings;
  const context = normalizeContext(input.context);
  const validScores = readiness.validScores;
  const summary = calculateSummary(validScores, settings);
  const statistics = calculateStatistics(validScores, settings.decimalPlaces);
  const judgement = getJudgement(summary.rawMasterySpreadPercent);
  const distribution = calculateDistribution(validScores, settings);
  const histogram = calculateHistogram(validScores, settings.decimalPlaces);
  const gapToNextLevel = calculateGapToNextLevel(summary, judgement, settings.decimalPlaces);
  const groupShape = calculateGroupShape(distribution, statistics, settings.decimalPlaces);
  const dataQuality = calculateDataQuality(summary, readiness.validation, settings.decimalPlaces);
  const educationalDecision = buildEducationalDecision(judgement, summary, gapToNextLevel, groupShape);
  const proposedPlan = buildProposedPlan(judgement, groupShape, gapToNextLevel);
  const report = buildReport(summary, judgement, gapToNextLevel, groupShape, educationalDecision, proposedPlan);
  const diagnostics = buildMasterySpreadDiagnostics(distribution, groupShape, gapToNextLevel, dataQuality, educationalDecision);

  return {
    context,
    settings,
    validation: readiness.validation,
    validScores,
    summary,
    statistics,
    judgement,
    distribution,
    histogram,
    gapToNextLevel,
    groupShape,
    dataQuality,
    educationalDecision,
    proposedPlan,
    diagnostics,
    report,
  };
}
