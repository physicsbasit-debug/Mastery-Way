import { PdfExport } from '../shared/PdfExport';
import { compareFollowup, type ParentRecord } from './parentCommunication';
import React from 'react';
import { UnifiedOfficialReportHeader, UnifiedPrintStyles } from '../shared/UnifiedReport';
import { DiagnosticDecisionReportBlock, FishboneReportBlock, ParetoReportBlock, RadarReportBlock } from '../shared/DiagnosticReportBlocks';
import {
  ItemStatusChart,
  StudentMasteryPositionChart,
  TopLossItemsChart,
} from './charts';
import type { IndividualPerformanceAnalysisResult, ValidatedQuestionResult } from './types';
import { PremiumReportSummary, ReportStatusChip, toneFromText } from '../shared/ReportVisualElements';
import { InterventionFollowupReport } from '../shared/InterventionFollowupReport';
import { followupIdentity } from '../shared/interventionFollowup';

export function IndividualPerformanceReportView({ result, parentRecord }: { result: IndividualPerformanceAnalysisResult; parentRecord?: ParentRecord }) {

  return (
    <div className="space-y-5">
      <PrintStyles />
      <PdfExport areaId="individual-performance-detailed-report" filename="individual-report.pdf" />
    <DetailedReport result={result} parentRecord={parentRecord} />
    </div>
  );
}

function DetailedReport({ result, parentRecord }: { result: IndividualPerformanceAnalysisResult; parentRecord?: ParentRecord }) {
  return (
    <article id="individual-performance-detailed-report" className="premium-report-document mw-print-report mw-print-report--individual individual-report-print-polish rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm" dir="rtl">
      <UnifiedOfficialReportHeader
        directorate={result.context.educationDirectorate}
        schoolName={result.context.schoolName}
        trackLabel="بوصلة الإتقان — مسار تحليل الأداء الفردي"
        title="تقرير تفصيلي توثيقي للأداء الفردي"
        subtitle="توثيق شامل للمفردات والمهارات وأنماط الأخطاء وملاحظات المعلم وخطة المتابعة."
      />
      <MissingDataNotice result={result} />
      <ReportDataGrid result={result} />
      <PremiumReportSummary
        eyebrow="ملخص تنفيذي داخل التقرير"
        title="نظرة سريعة على أداء الطالب"
        description={result.narratives.executiveSummary || result.narratives.educationalMeaning}
        items={[
          { label: 'نسبة الطالب', value: `${result.summary.percent}%`, note: `${result.summary.studentScore} من ${result.summary.totalScore}`, tone: toneFromText(result.level.label) },
          { label: 'مستوى الطالب', value: <ReportStatusChip tone={toneFromText(result.level.label)}>{result.level.label}</ReportStatusChip>, note: result.level.planType, tone: toneFromText(result.level.label) },
          { label: 'جودة القراءة', value: result.readingQuality.label, note: `${result.readingQuality.representedSkills} مهارة ممثلة`, tone: toneFromText(result.readingQuality.label) },
          { label: 'أولوية البداية', value: result.priorities[0]?.skill ?? 'لا توجد أولوية محددة', note: result.priorities[0] ? `${result.priorities[0].percent}% أداء / فقد ${result.priorities[0].loss}` : 'لا تظهر أولوية وفق البيانات', tone: result.priorities[0] ? 'amber' : 'success' },
        ]}
      />

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
        <DataTable headers={['المهارة', 'عدد المفردات', 'الدرجة', 'الأداء', 'الفقد', 'الحكم']} rows={result.skills.map((skill) => [skill.skill, skill.questionCount, `${skill.score} من ${skill.maxScore}`, `${skill.percent}%`, skill.loss, skill.judgement])} />
        {result.skills.some((skill) => skill.questionCount === 1) && <p className="mt-2 text-xs leading-6 text-slate-700">المهارة الممثلة بمفردة واحدة تُقرأ نتيجتها بوصفها إشارة أولية، وتحتاج إلى شواهد إضافية.</p>}
      </ReportSection>

      <ReportSection number="4" title="أنماط الأخطاء وملاحظات المعلم" pageBreak className="individual-diagnostics-section">
        <div className="grid gap-3 lg:grid-cols-2">
          <DataTable title="أنماط الأخطاء المرمزة" headers={['نوع الخطأ', 'التكرار', 'النسبة', 'المفردات', 'المهارات']} rows={result.errorPatterns.map((pattern) => [pattern.errorType, pattern.count, `${pattern.percent}%`, pattern.questionLabels.join('، '), pattern.skills.join('، ')])} />
          <DataTable title="ملاحظات المعلم الداعمة للتشخيص" headers={['المفردة', 'المهارة', 'الأداء', 'نوع الخطأ', 'الملاحظة']} rows={result.teacherNotes.map((note) => [note.questionLabel, note.skill, `${note.percent}%`, note.errorType, note.note])} emptyText="لم تُدخل ملاحظات للمعلم." />
        </div>
        <Narrative title="مؤشر التشخيص" text={result.narratives.diagnosisIndicator} />
        <Narrative title="ملاحظات المعلم بوصفها دليلًا داعمًا" text={result.narratives.teacherNotesReading} />
      </ReportSection>

      <ReportSection number="5" title="خريطة التشخيص وأولويات التدخل" pageBreak className="individual-diagnostic-insights-section" headingContent={<DiagnosticDecisionReportBlock decision={result.diagnostics.decision} />}>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <ParetoReportBlock title="باريتو الفقد حسب المهارات" description="يرتب المهارات حسب مساهمتها في فقد الطالب." entries={result.diagnostics.skillLossPareto} valueLabel="الفقد" />
          <ParetoReportBlock title="باريتو أنماط الأخطاء" description="يرتب أنماط الأخطاء المرمزة حسب التكرار." entries={result.diagnostics.errorPareto} valueLabel="التكرار" />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <RadarReportBlock title="رادار مهارات الطالب" description="يعرض صورة عامة للفجوات بين مهارات الطالب في هذه الورقة." data={result.diagnostics.skillRadar} />
          <TopLossItemsChart result={result} compact />
        </div>
        <div className="mt-4"><FishboneReportBlock diagnostic={result.diagnostics.fishbone} /></div>
      </ReportSection>

      <ReportSection number="6" title="الرسوم البيانية التوثيقية" pageBreak className="individual-charts-section">
        <div className="individual-print-chart-grid grid gap-3 lg:grid-cols-2">
          <StudentMasteryPositionChart result={result} compact />
          <ItemStatusChart result={result} compact />
        </div>
      </ReportSection>

      <ReportSection number="7" title="القرار والخطة وإعادة القياس" pageBreak className="individual-decision-section">
        <div className="grid gap-3 lg:grid-cols-3">
          <Narrative title="القرار التربوي" text={result.narratives.proposedAction} />
          <Narrative title="رسالة إلى الطالب" text={result.plan.studentMessage} />
          <Narrative title="دليل التحسن" text={result.plan.evidenceOfImprovement} />
        </div>
        <div className="individual-priority-table mt-4"><DataTable headers={['الترتيب', 'المهارة', 'الأداء', 'الفقد', 'سبب الترتيب']} rows={result.priorities.map((priority) => [priority.rank, priority.skill, `${priority.percent}%`, priority.loss, priority.reason])} /></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3"><BulletCard title="دور الطالب" items={result.plan.studentActions} /><BulletCard title="دور المعلم / المدرسة" items={result.plan.teacherRole} /><BulletCard title="دور ولي الأمر" items={result.plan.parentRole} /></div>
        <InterventionFollowupReport identity={followupIdentity('individual', result.context, [result.settings, result.questions])} metrics={result.skills.map(s => ({skill:s.skill,value:s.percent}))} />
      </ReportSection>
      {parentRecord?.contacts?.length ? <ReportSection number="8" title="توثيق التواصل مع ولي الأمر والمتابعة" className="individual-parent-followup-section">
        {parentRecord.contacts.map(entry => {
          const comparison = compareFollowup(entry.baseline, entry.followupPercent);
          return <div key={entry.id} className="premium-report-narrative report-section mt-3 rounded-xl border border-slate-200 p-3 text-sm leading-7">
            <p><strong>التاريخ:</strong> {entry.date} · <strong>الوسيلة:</strong> {entry.method} · <strong>النتيجة:</strong> {entry.status}</p>
            {entry.agreement && <p><strong>الإجراء المتفق عليه:</strong> {entry.agreement}</p>}
            {entry.evidence && <p><strong>ملاحظة أو مرجع الشاهد:</strong> {entry.evidence}</p>}
            {entry.skill && <p><strong>المهارة:</strong> {entry.skill} · <strong>النتيجة قبل المتابعة:</strong> {entry.baseline}%</p>}
            <p><strong>المتابعة:</strong> {comparison ? `بعد: ${comparison.after}%، الفرق: ${comparison.difference > 0 ? '+' : ''}${comparison.difference} نقطة مئوية${entry.followupDate ? `، التاريخ: ${entry.followupDate}` : ''}` : 'بانتظار إعادة القياس'}</p>
            {entry.followupNote && <p><strong>ملاحظة المتابعة:</strong> {entry.followupNote}</p>}
          </div>;
        })}
      </ReportSection> : null}
      <SignatureSection />
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
  return <section className="report-section mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">تنبيه اعتماد: توجد بيانات تعريفية غير مكتملة ({missing.map(([label]) => label).join('، ')}). يفضل إكمالها قبل تصدير التقرير النهائي.</section>;
}

function QuestionTable({ rows }: { rows: ValidatedQuestionResult[] }) {
  return <DataTable headers={['المفردة', 'المهارة', 'الدرجة', 'الأداء', 'الفقد', 'نوع الخطأ', 'ملاحظة المعلم']} rows={rows.map((item) => [item.label, item.skill, `${item.score} من ${item.maxScore}`, `${item.percent}%`, item.loss, formatErrorTypeForReport(item), item.teacherNote || '—'])} />;
}
function formatErrorTypeForReport(item: ValidatedQuestionResult) { return item.errorType || 'لم يرمز نوع الخطأ'; }
function ReportSection({ number, title, children, pageBreak = false, className = '', headingContent, keepTogether = false }: { number: string; title: string; children: React.ReactNode; pageBreak?: boolean; className?: string; headingContent?: React.ReactNode; keepTogether?: boolean }) {
  const heading = <h2 className="premium-report-section-title mb-3 text-lg font-black"><span>{number}</span>{title}</h2>;
  return <section className={`report-flow mt-5 ${pageBreak ? 'report-page-break' : ''} ${className}`} data-pdf-keep={keepTogether ? 'true' : undefined}>{headingContent ? <div data-pdf-keep="true">{heading}{headingContent}</div> : heading}{children}</section>;
}
function InfoCell({ label, value }: { label: string; value: React.ReactNode }) { return <div className="premium-report-info-cell rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="font-bold text-slate-500">{label}</div><div className="mt-1 font-black text-slate-900">{value}</div></div>; }
function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <div className="premium-report-metric rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"><div className="text-xs font-bold text-slate-500">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>; }
function Narrative({ title, text }: { title: string; text: string }) { return <div className="premium-report-narrative report-section mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><h3 className="font-black">{title}</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{text}</p></div>; }
function DataTable({ headers, rows, title, emptyText = 'لا توجد بيانات للعرض.' }: { headers: string[]; rows: React.ReactNode[][]; title?: string; emptyText?: string }) { return <div className="premium-report-table individual-data-table overflow-hidden rounded-xl border border-slate-200">{title ? <h3 className="bg-slate-100 px-3 py-2 font-black">{title}</h3> : null}<table className="w-full text-xs"><thead className="bg-slate-900 text-white"><tr>{headers.map((head) => <th key={head} className="px-2 py-1.5 text-right">{head}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index} className="border-t border-slate-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-1.5">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-3 py-4 text-center text-slate-500">{emptyText}</td></tr>}</tbody></table></div>; }
function BulletCard({ title, items }: { title: string; items: string[] }) { return <div className="premium-report-narrative rounded-xl border border-slate-200 p-3"><h3 className="font-black">{title}</h3><ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>; }
function SignatureSection() { return <section className="signature-section mt-6 grid grid-cols-4 gap-3 text-center text-xs"><Signature label="ولي الأمر" /><Signature label="المعلم" /><Signature label="المعلم الأول / المشرف" /><Signature label="إدارة المدرسة" /></section>; }
function Signature({ label }: { label: string }) { return <div className="premium-report-signature rounded-xl border border-slate-200 p-3"><div className="font-black">{label}</div><div className="mt-8 border-t border-slate-300 pt-2">الاسم والتوقيع</div></div>; }
function PrintStyles() { return <UnifiedPrintStyles printAreaId="individual-performance-detailed-report" noPrintClassName="individual-performance-no-print" pageMarginMm={8} fontSizePx={11} lineHeight={1.45} extraCss={`
  #unified-print-root #individual-performance-detailed-report .official-report-header { background: #fff !important; color: #33482d !important; border: 1px solid #d5dfce !important; border-bottom: 3px solid #5f6f3a !important; }
  #unified-print-root #individual-performance-detailed-report .official-report-header p,
  #unified-print-root #individual-performance-detailed-report .official-report-header h1,
  #unified-print-root #individual-performance-detailed-report .official-report-header div,
  #unified-print-root #individual-performance-detailed-report .official-report-header .space-y-0\\.5,
  #unified-print-root #individual-performance-detailed-report .official-report-header p:nth-last-child(1) { color: #33482d !important; }
  #unified-print-root #individual-performance-detailed-report .official-report-header p.mt-1\\.5,
  #unified-print-root #individual-performance-detailed-report .official-report-header p[class*="text-[11px]"] { background: #f5f2e5 !important; color: #67542a !important; }
  #unified-print-root #individual-performance-detailed-report .premium-report-summary,
  #unified-print-root #individual-performance-detailed-report .premium-report-narrative,
  #unified-print-root #individual-performance-detailed-report .diagnostic-report-block,
  #unified-print-root #individual-performance-detailed-report .diagnostic-report-fishbone,
  #unified-print-root #individual-performance-detailed-report .unified-chart-card { background: #fff !important; border-color: #d5dfce !important; }
  #unified-print-root #individual-performance-detailed-report .premium-report-narrative::before,
  #unified-print-root #individual-performance-detailed-report .diagnostic-report-block::before,
  #unified-print-root #individual-performance-detailed-report .diagnostic-report-fishbone::before,
  #unified-print-root #individual-performance-detailed-report .unified-chart-card::before { background: #5f6f3a !important; }
  #unified-print-root #individual-performance-detailed-report .premium-report-table th,
  #unified-print-root #individual-performance-detailed-report .premium-report-table td { font-size: 10.5px !important; line-height: 1.5 !important; }
  #unified-print-root #individual-performance-detailed-report .premium-report-section-title { break-after: avoid-page; page-break-after: avoid; }
  #unified-print-root #individual-performance-detailed-report .report-page-break,
  html[data-print-browser="firefox"] #unified-print-root #individual-performance-detailed-report .report-page-break { break-before: auto !important; page-break-before: auto !important; }
  #unified-print-root #individual-performance-detailed-report .report-page-break::before { display: none !important; content: none !important; }
  #unified-print-root #individual-performance-detailed-report table { table-layout: fixed !important; }
  #unified-print-root #individual-performance-detailed-report th { white-space: normal !important; overflow-wrap: normal !important; word-break: keep-all !important; }
  #unified-print-root #individual-performance-detailed-report td { overflow-wrap: break-word !important; word-break: normal !important; }
  #unified-print-root #individual-performance-detailed-report .diagnostic-report-visual .unified-chart-card { break-inside: avoid !important; page-break-inside: avoid !important; }
  #unified-print-root #individual-performance-detailed-report .diagnostic-report-fishbone,
  #unified-print-root #individual-performance-detailed-report .diagnostic-report-block { break-inside: avoid !important; page-break-inside: avoid !important; }
`} />; }
