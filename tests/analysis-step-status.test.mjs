import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let getAnalysisStepStatus;

before(async () => {
  server = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom' });
  ({ getAnalysisStepStatus } = await server.ssrLoadModule('/shared/AnalysisStepAccordion.tsx'));
});

after(async () => server?.close());

test('لا يصف زيارة الخطوة بأنها إنجاز مكتمل', () => {
  assert.equal(getAnalysisStepStatus({ active: false, locked: false, visited: true, showVisitedStatus: false }), 'متاحة');
});

test('يحافظ على حالة الخطوة الحالية والقفل', () => {
  assert.equal(getAnalysisStepStatus({ active: true, locked: false, visited: false }), 'الخطوة الحالية');
  assert.equal(getAnalysisStepStatus({ active: false, locked: true, visited: false }), 'مقفل');
});
