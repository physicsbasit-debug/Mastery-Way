import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { PdfExport } from '../shared/PdfExport';
import { ChartCard, OutsideLabelBarChart } from '../shared/UnifiedVisuals';
import { RadarSkillChart } from '../shared/RadarSkillChart';
import { ItemStatusChart, StudentMasteryPositionChart, TopLossItemsChart } from '../individualPerformance/charts';
import type { IndividualPerformanceAnalysisResult } from '../individualPerformance/types';

const skills = [
  { skill: 'المعرفة', percent: 83.3, itemCount: 1 },
  { skill: 'الفهم', percent: 61.1, itemCount: 1 },
  { skill: 'التطبيق', percent: 58.3, itemCount: 1 },
  { skill: 'الاستدلال', percent: 38.9, itemCount: 1 },
  { skill: 'القدرات العليا', percent: 27.8, itemCount: 1 },
];
const values = skills.map((entry) => ({ name: entry.skill, value: entry.percent }));
const loss = skills.map((entry, i) => ({ name: entry.skill, value: [4, 14, 20, 22, 26][i] }));
const ind = {
  summary: { percent: 70, masteryCutoffPercent: 75 },
  itemStatus: { correctCount: 1, partialCount: 3, wrongCount: 0, omittedCount: 0 },
  topLossItems: [
    { label: 'س1', loss: 2 },
    { label: 'س3', loss: 1 },
    { label: 'س4', loss: 1 },
  ],
} as unknown as IndividualPerformanceAnalysisResult;

function App() {
  const [route, setRoute] = React.useState<'exam' | 'individual'>('exam');
  return <div dir="rtl" style={{ background: '#f8fafc', padding: 24, fontFamily: 'Tahoma, Arial, sans-serif' }}>
    <nav style={{ marginBottom: 20 }}>
      <button id="route-exam" type="button" onClick={() => setRoute('exam')}>تحليل المفردات</button>
      <button id="route-individual" type="button" onClick={() => setRoute('individual')}>الأداء الفردي</button>
    </nav>
    <PdfExport areaId="fixture-report" filename={`fixture-${route}.pdf`} />
    <article id="fixture-report" className={`premium-report-document mw-print-report mw-print-report--${route} rounded-3xl bg-white p-6`} dir="rtl" style={{ boxSizing: 'border-box', width: 794, maxWidth: 'none', margin: '20px auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>اختبار تدقيق الرسوم في PDF: {route}</h1>
      {route === 'exam' ? <>
        <div className="exam-documentary-chart-grid grid gap-3 lg:grid-cols-2">
          <ChartCard title="أداء المفردات" compact><OutsideLabelBarChart data={values} valueKey="value" valueSuffix="%" fill="#a87526" domain={[0, 100]} /></ChartCard>
          <ChartCard title="الفقد حسب المفردات" compact><OutsideLabelBarChart data={loss} valueKey="value" fill="#dc2626" /></ChartCard>
          <ChartCard title="نسبة الصفر لكل مفردة" compact><OutsideLabelBarChart data={values} valueKey="value" valueSuffix="%" fill="#f97316" domain={[0, 100]} /></ChartCard>
          <ChartCard title="توزيع الدرجات" compact><OutsideLabelBarChart data={values} valueKey="value" valueSuffix="%" fill="#956a36" domain={[0, 100]} /></ChartCard>
          <ChartCard title="أداء المهارات" compact><OutsideLabelBarChart data={values} valueKey="value" valueSuffix="%" fill="#0f766e" domain={[0, 100]} /></ChartCard>
        </div>
        <div className="exam-diagnostic-comparison-grid mt-4 grid gap-3 lg:grid-cols-2"><RadarSkillChart title="رادار أداء المهارات" data={skills} compact /></div>
      </> : <>
        <div className="individual-radar-comparison-grid mt-4 grid gap-3 lg:grid-cols-2">
          <RadarSkillChart title="رادار مهارات الطالب" data={skills} compact />
          <TopLossItemsChart result={ind} compact />
        </div>
        <div className="individual-print-chart-grid mt-4 grid gap-3 lg:grid-cols-2">
          <StudentMasteryPositionChart result={ind} compact />
          <ItemStatusChart result={ind} compact />
        </div>
      </>}
    </article>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
