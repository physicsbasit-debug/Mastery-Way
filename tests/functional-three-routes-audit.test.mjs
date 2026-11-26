import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

// Independent arithmetic oracles for the three educational analysis routes.
// These tests deliberately avoid building expectations from app helper functions.
let server, spread, individual, exam;
before(async () => {
  server = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  spread = await server.ssrLoadModule('/masterySpread/analytics.ts');
  individual = await server.ssrLoadModule('/individualPerformance/analytics.ts');
  exam = await server.ssrLoadModule('/examItemSampleAnalysis/analytics.ts');
});
after(async () => server?.close());

const ctx = { schoolName: 'مدرسة تجريبية', paperTitle: 'اختبار', totalPapers: 3, sampleSize: 3, masteryCutoffPercent: 75, sampleSelectionMethod: 'عشوائية' };
const item = (id, maxScore, skill = 'المعرفة') => ({ id, label: id, maxScore, skill });

test('انتشار الإتقان: تطابق مستقل للنسب والوسيط والفئات والحدود', () => {
  const scores = [0, 20, 24, 28, 29.5, 30, 35, 40];
  const result = spread.runMasterySpreadAnalysis({ scores, settings: { totalScore: 40, masteryCutoffPercent: 75, nearMasteryMargin: 5, deepGapMargin: 15 } });
  const mastered = scores.filter(x => x >= 30).length;
  assert.equal(mastered, 3);
  assert.equal(result.summary.masteryCount, mastered);
  assert.equal(result.summary.masterySpreadPercent, 37.5);
  assert.equal(result.summary.totalStudents, 8);
  assert.equal(result.summary.nonMasteryCount, 5);
  assert.equal(result.statistics.meanPercent, 64.5);
  assert.equal(result.statistics.medianPercent, 71.9);
  const counts = Object.fromEntries(result.distribution.map(x => [x.key, x.count]));
  assert.deepEqual(counts, { mastery: 3, near_mastery: 2, moderate_gap: 1, deep_gap: 2 });
  assert.equal(result.distribution.reduce((sum, x) => sum + x.count, 0), scores.length);
  assert.equal(result.histogram.reduce((sum, x) => sum + x.count, 0), scores.length);
  assert.equal(result.gapToNextLevel.additionalStudentsNeeded, 1);
  assert.equal(result.judgement.code, 'rapid_intervention');
});

test('انتشار الإتقان: حدود ورفض إدخالات غير سليمة دون تقرير', () => {
  const base = { totalScore: 40, masteryCutoffPercent: 75 };
  assert.equal(spread.runMasterySpreadAnalysis({ scores: [29.5, 30], settings: base }).summary.masteryCount, 1);
  for (const scores of [[-0.5, 20], [40.5, 30], [NaN, 10]]) {
    assert.equal(spread.validateMasterySpreadReadiness({ scores, settings: base }).validation.valid, false);
    assert.throws(() => spread.runMasterySpreadAnalysis({ scores, settings: base }));
  }
  const arabic = spread.runMasterySpreadAnalysis({ rawScoresText: '٢٩٫٥؛ ٣٠؛ ٤٠', settings: base });
  assert.deepEqual(arabic.validScores.map(r => r.score), [29.5, 30, 40]);
});

test('الأداء الفردي: مجموع الدرجات ومهارات مختلفة وحالات الترميز', () => {
  const blueprint = [item('q1', 2, 'المعرفة'), item('q2', 2, 'التطبيق'), item('q3', 2, 'المعرفة')];
  const inputs = [
    { questionId: 'q1', score: 2, errorType: 'خطأ في قراءة المطلوب', teacherNote: '' },
    { questionId: 'q2', score: 1, errorType: '', teacherNote: '' },
    { questionId: 'q3', score: 0, errorType: 'خطأ في قراءة المطلوب', teacherNote: '' },
  ];
  const out = individual.runIndividualPerformanceAnalysis({}, blueprint, inputs);
  assert.equal(out.summary.studentScore, 3);
  assert.equal(out.summary.totalScore, 6);
  assert.equal(out.summary.percent, 50);
  assert.deepEqual([out.itemStatus.correctCount, out.itemStatus.partialCount, out.itemStatus.wrongCount, out.itemStatus.omittedCount], [1, 1, 1, 0]);
  assert.equal(out.questions[0].errorType, 'إجابة متقنة');
  assert.equal(out.questions[1].errorType, 'لم يرمز نوع الخطأ');
  assert.equal(out.codingCompleteness.incompleteItemsCount, 2);
  assert.equal(out.codingCompleteness.codedIncompleteItemsCount, 1);
  const skills = Object.fromEntries(out.skills.map(s => [s.skill, s]));
  assert.equal(skills['المعرفة'].percent, 50);
  assert.equal(skills['التطبيق'].percent, 50);
  assert.equal(out.topLossItems[0].id, 'q3');
});

test('تحليل المفردات: تحقق مستقل لدرجات الأنصاف والفقد والأداء', () => {
  const items = [item('q1', 2, 'المعرفة'), item('q2', 1.5, 'التطبيق'), item('q3', 1, 'الاستدلال')];
  const rows = [
    { id: 'p1', scores: { q1: 0, q2: 1.5, q3: 1 } },
    { id: 'p2', scores: { q1: 2, q2: 1, q3: 0.5 } },
    { id: 'p3', scores: { q1: 1, q2: 0, q3: 1 } },
  ];
  const out = exam.runExamItemsSampleAnalysis(ctx, items, rows);
  assert.equal(out.summary.paperTotalScore, 4.5);
  assert.equal(out.summary.totalAvailable, 13.5);
  assert.equal(out.summary.totalAchieved, 8);
  assert.equal(out.summary.totalLoss, 5.5);
  assert.equal(out.summary.averagePaperPercent, 59.3);
  assert.equal(out.summary.totalItems, 3);
  assert.equal(out.validation.valid, true);
  assert.equal(out.items.find(x => x.itemId === 'q1').zeroCount, 1);
  assert.equal(out.items.reduce((sum, x) => sum + x.totalLoss, 0), out.summary.totalLoss);
  assert.equal(out.skillBalance.reduce((sum, x) => sum + x.scoreWeight, 0), 4.5);
});

test('تحليل المفردات: لا يسمح بتكرار معرف المفردة أو غياب المهارة فعليا', () => {
  const rows = [{ id: 'p1', scores: { q1: 1 } }, { id: 'p2', scores: { q1: 1 } }, { id: 'p3', scores: { q1: 1 } }];
  const duplicates = [item('q1', 2, 'المعرفة'), item('q1', 2, 'التطبيق')];
  assert.equal(exam.validateAnalysisReadiness(ctx, duplicates, rows).valid, false, 'duplicate ID must never count one cell twice');
  const whitespaceSkill = [item('q1', 2, '   ')];
  assert.equal(exam.validateAnalysisReadiness(ctx, whitespaceSkill, rows).valid, false, 'whitespace-only skill must not pass');
});

test('الأداء الفردي: يمنع تكرار مدخل الطالب للمفردة نفسها', () => {
  const blueprint = [item('q1', 2)];
  const inputs = [{ questionId: 'q1', score: 0, errorType: '' }, { questionId: 'q1', score: 2, errorType: '' }];
  assert.equal(individual.validateIndividualAnalysisReadiness(blueprint, inputs).isValid, false);
});

test('المفردة ذات الدرجة الكلية صفر غير محتسبة في مساري التحليل ولا تخفض النسبة', () => {
  const items = [item('q1', 2), item('q2', 0, '')];
  const rows = [
    { id: 'p1', scores: { q1: 2, q2: '' } },
    { id: 'p2', scores: { q1: 1, q2: '' } },
    { id: 'p3', scores: { q1: 1, q2: '' } },
  ];
  const ready = exam.validateAnalysisReadiness(ctx, items, rows);
  assert.equal(ready.valid, true);
  const output = exam.runExamItemsSampleAnalysis(ctx, items, rows);
  assert.equal(output.summary.totalItems, 2);
  assert.equal(output.summary.excludedItems, 1);
  assert.equal(output.summary.paperTotalScore, 2);
  assert.equal(output.summary.totalAvailable, 6);
  assert.equal(output.items.length, 1);
  const blueprint = [item('q1', 2), item('q2', 0, '')];
  const inputs = [{ questionId: 'q1', score: 1, errorType: '' }, { questionId: 'q2', score: '', errorType: '' }];
  assert.equal(individual.validateIndividualAnalysisReadiness(blueprint, inputs).isValid, true);
  const student = individual.runIndividualPerformanceAnalysis({}, blueprint, inputs);
  assert.equal(student.summary.percent, 50);
  assert.equal(student.validation.excludedQuestionCount, 1);
  assert.equal(student.questions.length, 1);
});
