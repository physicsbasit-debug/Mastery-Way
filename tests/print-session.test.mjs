import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let prepareUnifiedPrintSession;

before(async () => {
  server = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ prepareUnifiedPrintSession } = await server.ssrLoadModule('/shared/UnifiedReport.tsx'));
});

after(async () => server?.close());

function makeEnvironment() {
  const elements = new Map();
  const htmlAttributes = new Map();
  const classes = new Set();
  const html = {
    setAttribute: (key, value) => htmlAttributes.set(key, value),
    removeAttribute: (key) => htmlAttributes.delete(key),
    getAttribute: (key) => htmlAttributes.get(key),
    classList: { add: (value) => classes.add(value), remove: (value) => classes.delete(value) },
  };
  const makeElement = () => ({
    id: '',
    attributes: new Map(),
    classList: { add() {} },
    setAttribute(key, value) { this.attributes.set(key, value); },
    getAttribute(key) { return this.attributes.get(key) ?? null; },
    appendChild(child) { this.child = child; },
    remove() { elements.delete(this.id); },
    cloneNode() { return makeElement(); },
  });
  const source = makeElement();
  source.id = 'report';
  elements.set(source.id, source);
  const document = {
    title: 'التطبيق',
    documentElement: html,
    createElement: () => makeElement(),
    getElementById: (id) => elements.get(id) ?? null,
    createTreeWalker: () => ({ nextNode: () => null }),
    body: { appendChild: (element) => elements.set(element.id, element) },
  };
  let printCalls = 0;
  const window = { print: () => { printCalls += 1; } };
  return { document, window, html, classes, getPrintCalls: () => printCalls };
}

test('تُستدعى الطباعة مباشرة ويبقى التقرير جاهزًا للمشاركة إذا لم تفتح النافذة', () => {
  const original = { document: globalThis.document, window: globalThis.window, NodeFilter: globalThis.NodeFilter };
  const env = makeEnvironment();
  Object.assign(globalThis, { document: env.document, window: env.window, NodeFilter: { SHOW_TEXT: 4 } });
  try {
    const session = prepareUnifiedPrintSession({ targetValue: 'mastery', areaId: 'report', documentTitle: 'تقرير' });
    assert.ok(session);
    assert.equal(env.html.getAttribute('data-print-target'), 'mastery');
    assert.ok(env.document.getElementById('unified-print-root'));
    session.print();
    assert.equal(env.getPrintCalls(), 1, 'يجب استدعاء الطباعة خلال ضغطة المستخدم');
    assert.ok(env.document.getElementById('unified-print-root'), 'يجب إبقاء نسخة التقرير متاحة للمشاركة');
    session.dispose();
    assert.equal(env.document.getElementById('unified-print-root'), null);
    assert.equal(env.document.title, 'التطبيق');
    assert.equal(env.html.getAttribute('data-print-target'), undefined);
    session.dispose();
    session.print();
    assert.equal(env.getPrintCalls(), 1, 'لا تُفتح الطباعة بعد إغلاق الجلسة');
  } finally {
    Object.assign(globalThis, original);
  }
});

test('يبقى التقرير جاهزًا للمشاركة إذا رفض المتصفح فتح الطباعة', () => {
  const original = { document: globalThis.document, window: globalThis.window, NodeFilter: globalThis.NodeFilter };
  const env = makeEnvironment();
  env.window.print = () => { throw new Error('print unavailable'); };
  Object.assign(globalThis, { document: env.document, window: env.window, NodeFilter: { SHOW_TEXT: 4 } });
  try {
    const session = prepareUnifiedPrintSession({ targetValue: 'mastery', areaId: 'report' });
    assert.throws(() => session.print(), /print unavailable/);
    assert.ok(env.document.getElementById('unified-print-root'));
    session.dispose();
    assert.equal(env.document.getElementById('unified-print-root'), null);
  } finally {
    Object.assign(globalThis, original);
  }
});

test('لا يغير الصفحة عندما يتعذر العثور على التقرير', () => {
  const original = { document: globalThis.document, window: globalThis.window, NodeFilter: globalThis.NodeFilter };
  const env = makeEnvironment();
  Object.assign(globalThis, { document: env.document, window: env.window, NodeFilter: { SHOW_TEXT: 4 } });
  try {
    assert.equal(prepareUnifiedPrintSession({ targetValue: 'mastery', areaId: 'missing' }), null);
    assert.equal(env.document.title, 'التطبيق');
    assert.equal(env.getPrintCalls(), 0);
  } finally {
    Object.assign(globalThis, original);
  }
});
