import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let runExamItemsSampleAnalysis;

before(async () => {
  server = await createServer({
    configFile: './vite.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  ({ runExamItemsSampleAnalysis } = await server.ssrLoadModule('/examItemSampleAnalysis/analytics.ts'));
});

after(async () => {
  await server?.close();
});

const bandBoundaries = [
  [100, 'سهلة جدًا / تحتاج مراجعة مستوى التحدي'],
  [85, 'سهلة جدًا / تحتاج مراجعة مستوى التحدي'],
  [84.5, 'مناسبة غالبًا'],
  [60, 'مناسبة غالبًا'],
  [59.5, 'متوسطة الصعوبة وتحتاج متابعة'],
  [40, 'متوسطة الصعوبة وتحتاج متابعة'],
  [39.5, 'صعبة وتحتاج مراجعة'],
  [20, 'صعبة وتحتاج مراجعة'],
  [19.5, 'حرجة وتحتاج فحصًا تربويًا'],
  [0, 'حرجة وتحتاج فحصًا تربويًا'],
];

for (const [score, expectedBand] of bandBoundaries) {
  test(`يصنف أداء المفردة عند ${score}% ضمن الفئة الصحيحة`, () => {
    const result = runExamItemsSampleAnalysis(
      {
        schoolName: 'مدرسة اختبار',
        paperTitle: 'اختبار حدود الفئات',
        totalPapers: 1,
        sampleSize: 1,
        masteryCutoffPercent: 75,
        sampleSelectionMethod: 'عشوائية',
      },
      [{ id: 'q1', label: 'س1', maxScore: 100, skill: 'المعرفة' }],
      [{ id: 'p1', label: 'ورقة 1', scores: { q1: score } }],
    );

    assert.equal(result.items[0].performancePercent, score);
    assert.equal(result.items[0].bandLabel, expectedBand);
  });
}
