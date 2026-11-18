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
