import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let validate;
let analyze;

before(async () => {
  server = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ validateAnalysisReadiness: validate, runExamItemsSampleAnalysis: analyze } = await server.ssrLoadModule('/examItemSampleAnalysis/analytics.ts'));
});
after(async () => server?.close());

const context = { schoolName: 'مدرسة تجريبية', paperTitle: 'اختبار', totalPapers: 3, sampleSize: 3, masteryCutoffPercent: 75, sampleSelectionMethod: 'عشوائية' };
const items = [
  { id: 'q1', label: 'س1', maxScore: 2, skill: 'المعرفة' },
  { id: 'q2', label: 'س2', maxScore: 1.5, skill: 'الفهم' },
  { id: 'q3', label: 'س3', maxScore: 1, skill: 'التطبيق' },
];
const papers = () => [
  { id: 'p1', label: 'ورقة 1', scores: { q1: 0, q2: 1.5, q3: 1 } },
  { id: 'p2', label: 'ورقة 2', scores: { q1: 2, q2: 1, q3: 0.5 } },
  { id: 'p3', label: 'ورقة 3', scores: { q1: 1, q2: 0, q3: 1 } },
];

test('يحتسب الصفر ودرجات أنصاف الدرجات ويعطي متوسط العينة والفقد الصحيحين', () => {
  const rows = papers();
  const readiness = validate(context, items, rows);
  assert.equal(readiness.valid, true);
  assert.equal(readiness.completedCells, 9);
  const result = analyze(context, items, rows);
  assert.equal(result.summary.paperTotalScore, 4.5);
  assert.equal(result.summary.totalAchieved, 8);
  assert.equal(result.summary.totalLoss, 5.5);
  assert.equal(result.summary.averagePaperPercent, 59.3);
  assert.equal(result.items[0].zeroCount, 1);
});

test('يمنع التحليل عند ترك خلية فارغة دون اعتبارها صفرًا', () => {
  const rows = papers();
  rows[0].scores.q1 = '';
  const readiness = validate(context, items, rows);
  assert.equal(readiness.valid, false);
  assert.equal(readiness.emptyCells, 1);
  assert.equal(readiness.cellIssues[0].type, 'empty');
  assert.throws(() => analyze(context, items, rows));
});

for (const [value, expected] of [[3, 'above_max'], [-0.5, 'negative'], [0.25, 'invalid_increment']]) {
  test(`يرفض الدرجة غير الصالحة ${value}`, () => {
    const rows = papers();
    rows[0].scores.q1 = value;
    const readiness = validate(context, items, rows);
    assert.equal(readiness.valid, false);
    assert.equal(readiness.invalidCells, 1);
    assert.equal(readiness.cellIssues[0].type, expected);
    assert.throws(() => analyze(context, items, rows));
  });
}

test('يمنع التحليل عند عدم تطابق عدد الأوراق مع حجم العينة', () => {
  const readiness = validate(context, items, papers().slice(0, 2));
  assert.equal(readiness.valid, false);
  assert.ok(readiness.issues.some((issue) => issue.message.includes('لا يطابق عدد أوراق العينة')));
});
