import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
let server, analyze;
before(async () => { server = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' }); ({ runIndividualPerformanceAnalysis: analyze } = await server.ssrLoadModule('/individualPerformance/analytics.ts')); });
after(async () => server?.close());
function evidence(errors) {
  const questions = errors.map((_, i) => ({ id: `q${i}`, label: `س${i}`, maxScore: 2, skill: 'المعرفة' }));
  const inputs = errors.map((errorType, i) => ({ questionId: `q${i}`, score: errorType === 'ترك السؤال' ? 0 : 1, errorType, otherErrorDetail: '', teacherNote: '' }));
  return analyze({}, questions, inputs).diagnostics.fishbone.categories.find((item) => item.title === 'فهم المطلوب').evidence;
}
test('لا يسمي خطأ واحدًا بأنه الأبرز عند تعادل الأنماط', () => {
  const value = evidence(['ترك السؤال', 'خطأ في قراءة المطلوب']);
  assert.match(value, /متساو/);
  assert.doesNotMatch(value, /النمط الأبرز:/);
});
test('يعرض النمط الأبرز عند انفراده بأعلى تكرار', () => {
  assert.match(evidence(['ترك السؤال', 'ترك السؤال', 'خطأ في قراءة المطلوب']), /النمط الأبرز: ترك السؤال/);
});

test('يحسب الدرجة الفردية مع الصفر ونصف الدرجة وحد الإتقان', () => {
 const questions=[{id:'a',label:'س1',maxScore:2,skill:'الفهم'},{id:'b',label:'س2',maxScore:2,skill:'التطبيق'}];
 const inputs=[{questionId:'a',score:1.5,errorType:'لم يرمز نوع الخطأ',teacherNote:''},{questionId:'b',score:0,errorType:'ترك السؤال',teacherNote:''}];
 const result=analyze({},questions,inputs);
 assert.equal(result.summary.studentScore,1.5);
 assert.equal(result.summary.percent,37.5);
 assert.equal(result.summary.achievedMastery,false);
});
test('لا يحلل درجة فردية تتجاوز الدرجة المتاحة', () => {
 const questions=[{id:'a',label:'س1',maxScore:2,skill:'الفهم'}];
 assert.throws(()=>analyze({},questions,[{questionId:'a',score:3,errorType:'لم يرمز نوع الخطأ',teacherNote:''}]));
});
