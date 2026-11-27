import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let sameItemRanking;

before(async () => {
  server = await createServer({
    configFile: './vite.config.ts',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });
  ({ sameItemRanking } = await server.ssrLoadModule('/examItemSampleAnalysis/utils.ts'));
});

after(async () => {
  await server?.close();
});

const items = (...labels) => labels.map((label) => ({ label }));

test('يدمج جدولي أقل أداء وأعلى فقد عندما يذكران المفردات نفسها بالترتيب نفسه', () => {
  assert.equal(sameItemRanking(items('س5', 'س4', 'س3'), items('س5', 'س4', 'س3')), true);
});

test('يبقي الجدولين منفصلين عند اختلاف الترتيب أو المفردات أو العدد', () => {
  assert.equal(sameItemRanking(items('س5', 'س4'), items('س4', 'س5')), false);
  assert.equal(sameItemRanking(items('س5', 'س4'), items('س5', 'س2')), false);
  assert.equal(sameItemRanking(items('س5', 'س4'), items('س5')), false);
});
