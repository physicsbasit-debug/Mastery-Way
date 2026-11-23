import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pdf = read('shared/PdfExport.tsx');
const individual = read('individualPerformance/report.tsx');
const exam = read('examItemSampleAnalysis/report.tsx');
const individualCharts = read('individualPerformance/charts.tsx');
const examCharts = read('examItemSampleAnalysis/charts.tsx');
const visuals = read('shared/UnifiedVisuals.tsx');

test('PDF export clones existing chart SVGs rather than remounting React charts', () => {
  assert.match(pdf, /source\.cloneNode\(true\)/);
  assert.match(pdf, /clone\.classList\.add\('pdf-export-render'\)/);
  assert.match(visuals, /<ResponsiveContainer\s+width="100%"\s+height=\{computedHeight\}>/);
});

test('individual loss comparison uses the real chart height and does not stretch its cloned wrapper', () => {
  assert.match(individual, /individual-radar-comparison-grid/);
  assert.match(individualCharts, /individual-top-loss-chart/);
  assert.match(individualCharts, /height=\{compact \? 175 : 250\}/);
  assert.match(pdf, /individual-top-loss-chart \.recharts-responsive-container\s*\{\s*height: 175px !important;/);
  assert.doesNotMatch(pdf, /individual-top-loss-chart \.recharts-responsive-container\s*\{\s*height: 300px/);
});

test('exam documentary skill chart remains full-row and preserves its actual chart component', () => {
  assert.match(exam, /exam-documentary-chart-grid/);
  assert.match(exam, /<SkillPerformanceChart result=\{result\}/);
  assert.match(examCharts, /<OutsideLabelBarChart data=\{data\} valueKey="value"/);
  assert.match(pdf, /exam-documentary-chart-grid > :last-child:nth-child\(odd\)/);
});

test('mastery PDF is not targeted by the individual and exam chart sizing overrides', () => {
  const block = pdf.slice(pdf.indexOf('/* Final visual balance:'), pdf.indexOf('/* Final A4 layout polish:'));
  assert.ok(block.length > 0);
  assert.doesNotMatch(block, /mw-print-report--mastery/);
});
