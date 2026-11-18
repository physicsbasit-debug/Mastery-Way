import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
let server, validate, analyze;
before(async () => { server = await createServer({configFile:'./vite.config.ts',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'}); ({validateMasterySpreadReadiness:validate,runMasterySpreadAnalysis:analyze}=await server.ssrLoadModule('/masterySpread/analytics.ts')); });
after(async () => server?.close());
const settings = {totalScore:40, masteryCutoffPercent:75};
test('يحسب الإتقان عند الحد مع الصفر ونصف الدرجة', () => {
 const input={scores:[0,29.5,30,40],settings};
 const result=analyze(input);
 assert.equal(result.summary.totalStudents,4);
 assert.equal(result.summary.masteryCount,2);
 assert.equal(result.summary.masterySpreadPercent,50);
 assert.equal(result.statistics.meanPercent,62.2);
});
test('يرفض الدرجة السالبة أو الأعلى من النهاية ولا ينتج تقريرًا', () => {
 for (const scores of [[-1,30],[41,30]]) {
  const input={scores,settings};
  assert.equal(validate(input).validation.valid,false);
  assert.throws(()=>analyze(input));
 }
});
