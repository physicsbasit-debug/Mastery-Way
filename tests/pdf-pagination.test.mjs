import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('تقسيم التقرير يختار الفواصل الآمنة ويغطي المحتوى كاملًا', async () => {
  const server = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { paginateReport } = await server.ssrLoadModule('/shared/pdfPagination.ts');
    assert.deepEqual(paginateReport(2350, 1000, [[850, 1100], [1780, 2060]]), [[0, 850], [850, 1780], [1780, 2350]]);
    assert.deepEqual(paginateReport(500, 1000, []), [[0, 500]]);
  } finally { await server.close(); }
});

test('يحمي الرسم والتوقيعات ويضمن استمرار تقسيم العناصر الأطول من الصفحة', async () => {
  const server = await createServer({configFile:'./vite.config.ts',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  try {
    const {paginateReport}=await server.ssrLoadModule('/shared/pdfPagination.ts');
    assert.deepEqual(paginateReport(1600,1000,[[820,1200],[1450,1600]]),[[0,820],[820,1600]]);
    assert.deepEqual(paginateReport(1800,1000,[[100,1500],[920,980]]),[[0,1000],[1000,1800]]);
    assert.deepEqual(paginateReport(1200,1000,[[100,1050]]),[[0,100],[100,1100],[1100,1200]]);
  } finally {await server.close();}
});
