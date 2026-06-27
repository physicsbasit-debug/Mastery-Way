import React from 'react';
import { printUnifiedReport, UnifiedOfficialReportHeader, UnifiedPrintStyles, UnifiedReportToolbar } from '../shared/UnifiedReport';
import { DiagnosticDecisionReportBlock, FishboneReportBlock, ParetoReportBlock, RadarReportBlock } from '../shared/DiagnosticReportBlocks';
import { ItemLossChart, ItemPerformanceChart, ReliabilityBadgeChart, SkillBalanceChart, SkillPerformanceChart, ZeroRateChart } from './charts';
import {
  buildMethodologyText,
  buildOverallReadingText,
  buildPaperReviewDecisionText,
  buildPriorityItemRecommendation,
  buildSampleLimitText,
  buildTeachingDecisionText,
  buildTeachingRecommendations,
} from './reportText';
import type { ExamItemsSampleAnalysisResult } from './types';
import { PremiumReportSummary, ReportStatusChip, toneFromText } from '../shared/ReportVisualElements';

export function ExamItemsSampleReports({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const printReport = () => {
    void printUnifiedReport({
      targetValue: 'exam-items-detailed',
      areaId: 'exam-items-detailed-report',
      documentTitle: 'بوصلة الإتقان - تحليل مفردات الورقة - تقرير تفصيلي',
    });
  };

  return (
    <div className="space-y-5">
      <PrintStyles />
      <UnifiedReportToolbar
        noPrintClassName="exam-items-no-print"
        title="التقرير الختامي"
        description="تقرير تفصيلي توثيقي للطباعة الرسمية على A4."
        actions={[{ label: 'طباعة التقرير التفصيلي', onClick: printReport, variant: 'blue' }]}
      />
      <DetailedReport result={result} />
    </div>
  );
}

function DetailedReport({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <article id="exam-items-detailed-report" className="premium-report-document mw-print-report mw-print-report--exam rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm" dir="rtl">
      <UnifiedOfficialReportHeader
        directorate={result.context.educationDirectorate}
        schoolName={result.context.schoolName}
        trackLabel="بوصلة الإتقان — مسار تحليل مفردات الورقة من عينة"
        title="تقرير تفصيلي توثيقي لتحليل مفردات الورقة"
        subtitle="توثيق شامل للعينة، أداء المفردات والمهارات، التوصيات، وحدود التفسير."
      />
      <MissingDataNotice result={result} />
      <ReportDataGrid result={result} />
      <PremiumReportSummary
        eyebrow="ملخص تنفيذي داخل التقرير"
        title="نظرة سريعة على مفردات الورقة"
        description={result.decision.overallReading || result.balanceReading.overallReading}
        items={[
          { label: 'متوسط الأداء', value: `${result.summary.averagePaperPercent}%`, note: `${result.summary.averagePaperScore} من ${result.summary.paperTotalScore}`, tone: 'royal' },
          { label: 'موثوقية العينة', value: <ReportStatusChip tone={toneFromText(result.reliability.label)}>{result.reliability.label}</ReportStatusChip>, note: `${result.reliability.sampleSize} من ${result.reliability.totalPapers} ورقة`, tone: toneFromText(result.reliability.label) },
          { label: 'اكتمال البيانات', value: `${result.dataCompleteness.completionPercent}%`, note: result.dataCompleteness.label, tone: toneFromText(result.dataCompleteness.label) },
          { label: 'مفردات أولوية', value: result.decision.priorityItems.length, note: result.decision.priorityItems.length ? 'تحتاج متابعة تعليمية' : 'لا توجد مفردات عالية وفق المعيار', tone: result.decision.priorityItems.length ? 'amber' : 'success' },
        ]}
      />

      <ReportSection number="1" title="منهجية التحليل وحدود العينة">
        <Narrative title="منهجية التحليل" text={buildMethodologyText(result)} />
        <Narrative title="جودة العينة" text={`${result.reliability.label}: ${result.reliability.message}`} />
        <Narrative title="حدود التفسير" text={buildSampleLimitText(result)} />
      </ReportSection>

      <ReportSection number="2" title="المؤشرات العامة وتحليل المفردات" pageBreak>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="المفردات المحتسبة" value={result.summary.totalItems} />
          <Metric label="الدرجة الكلية" value={result.summary.paperTotalScore} />
          <Metric label="متوسط الأداء" value={`${result.summary.averagePaperPercent}%`} />
          <Metric label="متوسط الدرجة" value={`${result.summary.averagePaperScore} من ${result.summary.paperTotalScore}`} />
          <Metric label="الفقد الكلي" value={result.summary.totalLoss} />
          <Metric label="اكتمال البيانات" value={`${result.dataCompleteness.completionPercent}%`} />
          <Metric label="حد الإتقان" value={`${result.summary.masteryCutoffPercent}%`} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <DataTable title="أقل المفردات أداءً" headers={['المفردة', 'المهارة', 'الأداء', 'الأولوية']} rows={result.decision.lowestPerformanceItems.map((item) => [item.label, item.skill, `${item.performancePercent}%`, item.priority])} />
          <DataTable title="أعلى المفردات فقدًا" headers={['المفردة', 'المهارة', 'الفقد', 'الأولوية']} rows={result.decision.highestLossItems.map((item) => [item.label, item.skill, item.totalLoss, item.priority])} />
        </div>
        <div className="mt-4"><DataTable headers={['المفردة', 'المهارة', 'الدرجة', 'الأداء', 'الفقد', 'صفر', 'كاملة', 'جزئية', 'الأولوية']} rows={result.items.map((item) => [item.label, item.skill, item.maxScore, `${item.performancePercent}%`, item.totalLoss, `${item.zeroPercent}%`, `${item.fullPercent}%`, `${item.partialPercent}%`, item.priority])} /></div>
        <Narrative title="مفردات تحتاج مراجعة" text={buildPriorityItemRecommendation(result)} />
      </ReportSection>

      <ReportSection number="3" title="تحليل المهارات وتوازن الورقة" pageBreak>
        <DataTable headers={['المهارة', 'عدد المفردات', 'الأداء', 'الفقد', 'الحكم', 'التوصية']} rows={result.skills.map((skill) => [skill.skill, skill.itemCount, `${skill.performancePercent}%`, skill.totalLoss, skill.judgement, skill.recommendation])} />
        <Narrative title="قراءة توازن المهارات" text={result.balanceReading.skillReading} />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <SkillBalanceChart result={result} />
          <DataTable title="توزيع درجات الورقة حسب المهارات" headers={['المهارة', 'عدد المفردات', 'وزن الدرجات', 'النسبة']} rows={result.skillBalance.map((row) => [row.name, row.itemCount, row.scoreWeight, `${row.scoreWeightPercent}%`])} />
        </div>
      </ReportSection>

      <ReportSection number="4" title="تحليل الأولويات والأسباب المحتملة" pageBreak>
        <DiagnosticDecisionReportBlock decision={result.diagnostics.decision} />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <ParetoReportBlock title="باريتو الفقد حسب المفردات" description="يرتب المفردات حسب مساهمتها في الفقد الكلي لتحديد نقطة البدء." entries={result.diagnostics.itemLossPareto} valueLabel="الفقد" />
          <ParetoReportBlock title="باريتو الفقد حسب المهارات" description="يوضح المهارات الأكثر مساهمة في الفقد داخل العينة." entries={result.diagnostics.skillLossPareto} valueLabel="الفقد" />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <RadarReportBlock title="رادار أداء المهارات" description="يعرض صورة عامة لتوازن أداء المهارات في العينة." data={result.diagnostics.skillRadar} />
          <FishboneReportBlock diagnostic={result.diagnostics.fishbone} />
        </div>
      </ReportSection>

      <ReportSection number="5" title="الرسوم البيانية التوثيقية" pageBreak>
        <div className="grid gap-3 lg:grid-cols-2">
          <ReliabilityBadgeChart result={result} />
          <ItemPerformanceChart result={result} />
          <ItemLossChart result={result} />
          <ZeroRateChart result={result} />
          <SkillPerformanceChart result={result} />
        </div>
      </ReportSection>

      <ReportSection number="6" title="القرار والتوصيات" pageBreak>
        <div className="grid gap-3 lg:grid-cols-2">
          <Narrative title="القراءة العامة" text={buildOverallReadingText(result)} />
          <Narrative title="القرار التدريسي" text={buildTeachingDecisionText(result)} />
          <Narrative title="مراجعة الورقة القادمة" text={buildPaperReviewDecisionText(result)} />
        </div>
        <BulletList items={buildTeachingRecommendations(result)} />
        <SignatureSection />
      </ReportSection>
    </article>
  );
}

function ReportDataGrid({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const cells: Array<[string, React.ReactNode]> = [
    ['المدرسة', result.context.schoolName || 'لم يحدد'],
    ['المادة', result.context.subject],
    ['الصف', result.context.grade],
    ['عنوان الورقة', result.context.paperTitle],
    ['نوع أداة القياس', result.context.assessmentType],
    ['اسم المعلم', result.context.teacherName || 'لم يحدد'],
    ['العام الدراسي', result.context.academicYear],
    ['تاريخ التحليل', result.context.analysisDate],
    ['إجمالي الأوراق', result.reliability.totalPapers],
    ['عدد أوراق العينة', result.reliability.sampleSize],
    ['نسبة العينة', `${result.reliability.samplePercent}%`],
    ['موثوقية القراءة', result.reliability.label],
  ];
  return <section className="report-section mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">{cells.map(([label, value]) => <InfoCell key={label} label={label} value={value} />)}</section>;
}

function MissingDataNotice({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const missing = [
    ['المدرسة', result.context.schoolName],
    ['المعلم', result.context.teacherName],
    ['عنوان الورقة', result.context.paperTitle],
  ].filter(([, value]) => !String(value || '').trim());
  if (!missing.length) return null;
  return <section className="report-section mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">تنبيه اعتماد: توجد بيانات تعريفية غير مكتملة ({missing.map(([label]) => label).join('، ')}). يفضل إكمالها قبل الطباعة الرسمية النهائية.</section>;
}

function ReportSection({ number, title, children, pageBreak = false }: { number: string; title: string; children: React.ReactNode; pageBreak?: boolean }) {
  return <section className={`report-flow mt-5 ${pageBreak ? 'report-page-break' : ''}`}><h2 className="premium-report-section-title mb-3 text-lg font-black"><span>{number}</span>{title}</h2>{children}</section>;
}
function InfoCell({ label, value }: { label: string; value: React.ReactNode }) { return <div className="premium-report-info-cell rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="font-bold text-slate-500">{label}</div><div className="mt-1 font-black text-slate-900">{value ?? 'لم يحدد'}</div></div>; }
function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <div className="premium-report-metric rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"><div className="text-xs font-bold text-slate-500">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>; }
function Narrative({ title, text }: { title: string; text: string }) { return <div className="premium-report-narrative report-section mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><h3 className="font-black">{title}</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{text}</p></div>; }
function DataTable({ headers, rows, title }: { headers: string[]; rows: React.ReactNode[][]; title?: string }) { return <div className="premium-report-table overflow-hidden rounded-xl border border-slate-200">{title ? <h3 className="bg-slate-100 px-3 py-2 font-black">{title}</h3> : null}<table className="w-full text-xs"><thead className="bg-slate-900 text-white"><tr>{headers.map((head) => <th key={head} className="px-2 py-1.5 text-right">{head}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-slate-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-1.5">{cell}</td>)}</tr>)}</tbody></table></div>; }
function BulletList({ items }: { items: string[] }) { return <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul>; }
function SignatureSection() { return <section className="signature-section mt-6 grid grid-cols-3 gap-3 text-center text-xs"><Signature label="المعلم" /><Signature label="المعلم الأول / المشرف" /><Signature label="إدارة المدرسة" /></section>; }
function Signature({ label }: { label: string }) { return <div className="premium-report-signature rounded-xl border border-slate-200 p-3"><div className="font-black">{label}</div><div className="mt-8 border-t border-slate-300 pt-2">الاسم والتوقيع</div></div>; }

function PrintStyles() {
  return <UnifiedPrintStyles printAreaId="exam-items-detailed-report" noPrintClassName="exam-items-no-print" pageMarginMm={8} fontSizePx={9.4} lineHeight={1.36} extraCss={`
    #exam-items-detailed-report .unified-chart-card { min-height: 0 !important; }
    #exam-items-detailed-report .diagnostic-report-visual .unified-chart-card { break-inside: avoid !important; page-break-inside: avoid !important; }
    #exam-items-detailed-report .diagnostic-report-fishbone,
    #exam-items-detailed-report .diagnostic-report-block { break-inside: avoid !important; page-break-inside: avoid !important; }
    #exam-items-detailed-report table { table-layout: auto !important; }
  `} />;
}
