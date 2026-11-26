import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { runMasterySpreadAnalysis } from '../masterySpread/analytics';
import { MasterySpreadReportView } from '../masterySpread/report';
import { createDefaultIndividualContext, runIndividualPerformanceAnalysis } from '../individualPerformance/analytics';
import { IndividualPerformanceReportView } from '../individualPerformance/report';
import { runExamItemsSampleAnalysis } from '../examItemSampleAnalysis/analytics';
import { ExamItemsSampleReports } from '../examItemSampleAnalysis/report';

const spread = runMasterySpreadAnalysis({
  scores: [0, 20, 29.5, 30, 40],
  settings: { totalScore: 40, masteryCutoffPercent: 75 },
  context: { schoolName: 'مدرسة اختبار محلي', teacherName: 'معلم اختبار', subject: 'العلوم', grade: 'الصف التاسع' },
});
const individual = runIndividualPerformanceAnalysis(
  { ...createDefaultIndividualContext(), schoolName: 'مدرسة اختبار محلي', studentName: 'طالب تجريبي', paperTitle: 'اختبار',
    teacherName: 'معلم اختبار' },
  [{ id: 'q1', label: 'س1', maxScore: 2, skill: 'المعرفة' }, { id: 'q2', label: 'س2', maxScore: 0, skill: '' }],
  [{ questionId: 'q1', score: 1, errorType: '', teacherNote: '' }, { questionId: 'q2', score: '', errorType: '', teacherNote: '' }],
);
const sample = runExamItemsSampleAnalysis(
  { educationDirectorate: 'جنوب الباطنة', schoolName: 'مدرسة اختبار محلي', subject: 'العلوم', grade: 'الصف التاسع',
    paperTitle: 'ورقة اختبارية', assessmentType: 'اختبار قصير', teacherName: 'معلم اختبار',
    academicYear: '2026/2027', analysisDate: '2026-11-26', masteryCutoffPercent: 75,
    totalPapers: 3, sampleSize: 3, analysisMethod: 'تحليل جميع الأوراق', sampleSelectionMethod: 'عشوائية' },
  [{ id: 'q1', label: 'س1', maxScore: 2, skill: 'المعرفة' }, { id: 'q2', label: 'س2', maxScore: 0, skill: '' }],
  [{ id: 'p1', label: 'ورقة 1', scores: { q1: 2, q2: '' } }, { id: 'p2', label: 'ورقة 2', scores: { q1: 1, q2: '' } },
    { id: 'p3', label: 'ورقة 3', scores: { q1: 1, q2: '' } }],
);

function Fixture() {
  const [route, setRoute] = React.useState<'spread' | 'individual' | 'exam'>('spread');
  return (
    <main dir="rtl" style={{ padding: 24, fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <nav aria-label="مسارات اختبار التقارير" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button id="route-spread" type="button" onClick={() => setRoute('spread')}>انتشار الإتقان</button>
        <button id="route-individual" type="button" onClick={() => setRoute('individual')}>الأداء الفردي</button>
        <button id="route-exam" type="button" onClick={() => setRoute('exam')}>تحليل مفردات الورقة</button>
      </nav>
      <aside id="fixture-arithmetic" data-route={route}
        data-mastered={spread.summary.masteryCount}
        data-individual-total={individual.summary.totalScore}
        data-exam-total={sample.summary.paperTotalScore}
        data-individual-excluded={individual.validation.excludedQuestionCount}
        data-exam-excluded={sample.summary.excludedItems} />
      {route === 'spread' ? <MasterySpreadReportView result={spread} /> : null}
      {route === 'individual' ? <IndividualPerformanceReportView result={individual} /> : null}
      {route === 'exam' ? <ExamItemsSampleReports result={sample} /> : null}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
