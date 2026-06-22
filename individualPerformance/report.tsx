import React from 'react';
import { printUnifiedReport, UnifiedOfficialReportHeader, UnifiedPrintStyles, UnifiedReportToolbar } from '../shared/UnifiedReport';
import {
  ErrorPatternsChart,
  ItemStatusChart,
  PriorityLineChart,
  SkillLossChart,
  SkillPerformanceChart,
  StudentMasteryPositionChart,
  TopLossItemsChart,
} from './charts';
import type { IndividualPerformanceAnalysisResult, ValidatedQuestionResult } from './types';

export function IndividualPerformanceReportView({ result }: { result: IndividualPerformanceAnalysisResult }) {
  const printReport = () => {
    void printUnifiedReport({
      targetValue: 'individual-performance-detailed',
      areaId: 'individual-performance-detailed-report',
      documentTitle: 'بوصلة الإتقان - تحليل الأداء الفردي - تقرير تفصيلي',
    });
  };

  return (
    <div className="space-y-5">
      <PrintStyles />
      <UnifiedReportToolbar
        noPrintClassName="individual-performance-no-print"
        title="الخطة والتقرير الختامي"
        description="تقرير تفصيلي توثيقي للطباعة الرسمية على A4."
        actions={[{ label: 'طباعة التقرير التفصيلي', onClick: printReport, variant: 'blue' }]}
      />
      <DetailedReport result={result} />
    </div>
  );
}

function DetailedReport({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <article id="individual-performance-detailed-report" className="individual-report-print-polish rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm" dir="rtl">
      <UnifiedOfficialReportHeader
        directorate={result.context.educationDirectorate}
        schoolName={result.context.schoolName}
        trackLabel="بوصلة الإتقان — مسار تحليل الأداء الفردي"
        title="تقرير تفصيلي توثيقي للأداء الفردي"
        subtitle="توثيق شامل للمفردات والمهارات وأنماط الأخطاء وملاحظات المعلم وخطة المتابعة."
      />
      <MissingDataNotice result={result} />
      <ReportDataGrid result={result} />

      <ReportSection number="1" title="منهجية التحليل وحدود القراءة">
        <Narrative title="منهجية التحليل" text="حُسب أداء الطالب في كل مفردة بمقارنة درجته بالدرجة المتاحة، ثم جُمعت النتائج حسب المهارة، وحُللت أنماط الخطأ وملاحظات المعلم، وربطت النتائج بحدود النجاح والإتقان والتميز المعتمدة. لا يبدأ التحليل إلا بعد إدخال الدرجة الكلية لكل مفردة واستكمال درجات الطالب." />
        <Narrative title="جودة القراءة الفردية" text={result.readingQuality.message} />
        <Narrative title="حدود التفسير" text={result.narratives.limitationsNote} />
      </ReportSection>

      <ReportSection number="2" title="المؤشرات العامة وتحليل المفردات" pageBreak>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="درجة الطالب" value={`${result.summary.studentScore} من ${result.summary.totalScore}`} />
          <Metric label="النسبة" value={`${result.summary.percent}%`} />
          <Metric label="مستوى الطالب" value={result.level.label} />
          <Metric label="نوع الخطة" value={result.level.planType} />
          <Metric label="حد النجاح" value={`${result.summary.passCutoffPercent}%`} />
          <Metric label="حد الإتقان" value={`${result.summary.masteryCutoffPercent}%`} />
          <Metric label="حد التميز" value={`${result.summary.excellenceCutoffPercent}%`} />
          <Metric label="الفجوة عن الإتقان" value={`${result.summary.gapToMasteryPoints} درجة`} />
        </div>
        <div className="mt-4"><QuestionTable rows={result.questions} /></div>
      </ReportSection>

      <ReportSection number="3" title="تحليل المهارات" pageBreak>
        <DataTable headers={['المهارة', 'عدد المفردات', 'الدرجة', 'الأداء', 'الفقد', 'الحكم', 'حدود القراءة']} rows={result.skills.map((skill) => [skill.skill, skill.questionCount, `${skill.score} من ${skill.maxScore}`, `${skill.percent}%`, skill.loss, skill.judgement, skill.representationNote])} />
        <div className="mt-4 grid gap-3 lg:grid-cols-2"><SkillPerformanceChart result={result} compact /><SkillLossChart result={result} compact /></div>
      </ReportSection>

      <ReportSection number="4" title="أنماط الأخطاء وملاحظات المعلم" pageBreak className="individual-diagnostics-section">
        <div className="grid gap-3 lg:grid-cols-2">
          <DataTable title="أنماط الأخطاء المرمزة" headers={['نوع الخطأ', 'التكرار', 'النسبة', 'المفردات', 'المهارات']} rows={result.errorPatterns.map((pattern) => [pattern.errorType, pattern.count, `${pattern.percent}%`, pattern.questionLabels.join('، '), pattern.skills.join('، ')])} />
          <DataTable title="ملاحظات المعلم الداعمة للتشخيص" headers={['المفردة', 'المهارة', 'الأداء', 'نوع الخطأ', 'الملاحظة']} rows={result.teacherNotes.map((note) => [note.questionLabel, note.skill, `${note.percent}%`, note.errorType, note.note])} emptyText="لم تُدخل ملاحظات للمعلم." />
        </div>
        <Narrative title="مؤشر التشخيص" text={result.narratives.diagnosisIndicator} />
        <Narrative title="ملاحظات المعلم بوصفها دليلًا داعمًا" text={result.narratives.teacherNotesReading} />
        <div className="individual-print-chart-grid mt-4 grid gap-3 lg:grid-cols-2"><ErrorPatternsChart result={result} compact /></div>
      </ReportSection>

      <ReportSection number="5" title="الرسوم البيانية التوثيقية" pageBreak className="individual-charts-section">
        <div className="individual-print-chart-grid grid gap-3 lg:grid-cols-2">
          <StudentMasteryPositionChart result={result} compact />
          <ItemStatusChart result={result} compact />
          <TopLossItemsChart result={result} compact />
          <SkillPerformanceChart result={result} compact />
          <PriorityLineChart result={result} compact />
        </div>
      </ReportSection>

      <ReportSection number="6" title="القرار والخطة وإعادة القياس" pageBreak className="individual-decision-section">
        <div className="grid gap-3 lg:grid-cols-3">
          <Narrative title="القرار التربوي" text={result.narratives.proposedAction} />
          <Narrative title="رسالة إلى الطالب" text={result.plan.studentMessage} />
          <Narrative title="دليل التحسن" text={result.plan.evidenceOfImprovement} />
        </div>
        <div className="individual-priority-table mt-4"><DataTable headers={['الترتيب', 'المهارة', 'الأداء', 'الفقد', 'سبب الترتيب']} rows={result.priorities.map((priority) => [priority.rank, priority.skill, `${priority.percent}%`, priority.loss, priority.reason])} /></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3"><BulletCard title="دور الطالب" items={result.plan.studentActions} /><BulletCard title="دور المعلم / المدرسة" items={result.plan.teacherRole} /><BulletCard title="دور ولي الأمر" items={result.plan.parentRole} /></div>
        <SignatureSection />
      </ReportSection>
    </article>
  );
}

function ReportDataGrid({ result }: { result: IndividualPerformanceAnalysisResult }) {
  const cells: Array<[string, React.ReactNode]> = [
    ['اسم الطالب', result.context.studentName || 'لم يحدد'],
    ['المادة', result.context.subject],
    ['الصف / الشعبة', `${result.context.grade} / ${result.context.section || 'لم يحدد'}`],
    ['عنوان الورقة', result.context.paperTitle || 'لم يحدد'],
    ['نوع أداة القياس', result.context.assessmentType],
    ['اسم المعلم', result.context.teacherName || 'لم يحدد'],
    ['العام الدراسي', result.context.academicYear],
    ['تاريخ التحليل', result.context.analysisDate],
    ['عدد المفردات المحتسبة', result.questions.length],
    ['الدرجة الكلية', result.summary.totalScore],
    ['جودة القراءة', result.readingQuality.label],
  ];
  return <section className="report-section mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">{cells.map(([label, value]) => <InfoCell key={label} label={label} value={value} />)}</section>;
}

function MissingDataNotice({ result }: { result: IndividualPerformanceAnalysisResult }) {
  const missing = [
    ['اسم الطالب', result.context.studentName],
    ['المدرسة', result.context.schoolName],
    ['المعلم', result.context.teacherName],
    ['عنوان الورقة', result.context.paperTitle],
  ].filter(([, value]) => !String(value || '').trim());
  if (!missing.length) return null;
  return <section className="report-section mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">تنبيه اعتماد: توجد بيانات تعريفية غير مكتملة ({missing.map(([label]) => label).join('، ')}). يفضل إكمالها قبل الطباعة الرسمية النهائية.</section>;
}

function QuestionTable({ rows }: { rows: ValidatedQuestionResult[] }) {
  return <DataTable headers={['المفردة', 'المهارة', 'الدرجة', 'الأداء', 'الفقد', 'نوع الخطأ', 'ملاحظة المعلم']} rows={rows.map((item) => [item.label, item.skill, `${item.score} من ${item.maxScore}`, `${item.percent}%`, item.loss, formatErrorTypeForReport(item), item.teacherNote || '—'])} />;
}
function formatErrorTypeForReport(item: ValidatedQuestionResult) { return item.errorType || 'لم يرمز نوع الخطأ'; }
function ReportSection({ number, title, children, pageBreak = false, className = '' }: { number: string; title: string; children: React.ReactNode; pageBreak?: boolean; className?: string }) { return <section className={`report-flow mt-5 ${pageBreak ? 'report-page-break' : ''} ${className}`}><h2 className="mb-3 text-lg font-black">{number}. {title}</h2>{children}</section>; }
function InfoCell({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="font-bold text-slate-500">{label}</div><div className="mt-1 font-black text-slate-900">{value}</div></div>; }
function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"><div className="text-xs font-bold text-slate-500">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>; }
function Narrative({ title, text }: { title: string; text: string }) { return <div className="report-section mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><h3 className="font-black">{title}</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{text}</p></div>; }
function DataTable({ headers, rows, title, emptyText = 'لا توجد بيانات للعرض.' }: { headers: string[]; rows: React.ReactNode[][]; title?: string; emptyText?: string }) { return <div className="individual-data-table overflow-hidden rounded-xl border border-slate-200">{title ? <h3 className="bg-slate-100 px-3 py-2 font-black">{title}</h3> : null}<table className="w-full text-xs"><thead className="bg-slate-900 text-white"><tr>{headers.map((head) => <th key={head} className="px-2 py-1.5 text-right">{head}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index} className="border-t border-slate-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-1.5">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-3 py-4 text-center text-slate-500">{emptyText}</td></tr>}</tbody></table></div>; }
function BulletCard({ title, items }: { title: string; items: string[] }) { return <div className="rounded-xl border border-slate-200 p-3"><h3 className="font-black">{title}</h3><ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>; }
function SignatureSection() { return <section className="signature-section mt-6 grid grid-cols-4 gap-3 text-center text-xs"><Signature label="ولي الأمر" /><Signature label="المعلم" /><Signature label="المعلم الأول / المشرف" /><Signature label="إدارة المدرسة" /></section>; }
function Signature({ label }: { label: string }) { return <div className="rounded-xl border border-slate-200 p-3"><div className="font-black">{label}</div><div className="mt-8 border-t border-slate-300 pt-2">الاسم والتوقيع</div></div>; }
function PrintStyles() { return <UnifiedPrintStyles printAreaId="individual-performance-detailed-report" noPrintClassName="individual-performance-no-print" pageMarginMm={8} fontSizePx={9.05} lineHeight={1.32} extraCss={`
  #unified-print-root #individual-performance-detailed-report table { table-layout: fixed !important; }
  #unified-print-root #individual-performance-detailed-report th { white-space: normal !important; overflow-wrap: normal !important; word-break: keep-all !important; }
  #unified-print-root #individual-performance-detailed-report td { overflow-wrap: break-word !important; word-break: normal !important; }
`} />; }
