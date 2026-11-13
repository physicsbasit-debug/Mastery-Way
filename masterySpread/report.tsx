import React from 'react';
import { prepareUnifiedPrintSession, UnifiedOfficialReportHeader, UnifiedPrintStyles, UnifiedReportToolbar } from '../shared/UnifiedReport';
import { DiagnosticDecisionReportBlock, FishboneReportBlock, ParetoReportBlock } from '../shared/DiagnosticReportBlocks';
import { GROUP_SHAPE_THRESHOLDS, MASTERY_JUDGEMENT_SCALE } from './constants';
import { formatPercentagePointAmount, formatStudentCount } from './utils';
import { PremiumReportSummary, ReportStatusChip, toneFromText } from '../shared/ReportVisualElements';
import type { MasterySpreadAnalysisResult } from './types';

export interface MasterySpreadReportViewProps { result: MasterySpreadAnalysisResult; }

export function MasterySpreadReportView({ result }: MasterySpreadReportViewProps) {
  const printSession = React.useRef<ReturnType<typeof prepareUnifiedPrintSession>>(null);
  const [showPrintHelp, setShowPrintHelp] = React.useState(false);
  const [printError, setPrintError] = React.useState('');

  React.useEffect(() => () => printSession.current?.dispose(), []);

  const tryPrint = () => {
    try {
      printSession.current?.print();
      setPrintError('');
    } catch {
      setPrintError('تعذر فتح نافذة الطباعة من هذا المتصفح.');
    }
  };

  const printReport = () => {
    printSession.current?.dispose();
    try {
      printSession.current = prepareUnifiedPrintSession({
        targetValue: 'mastery-spread-detailed',
        areaId: 'mastery-spread-detailed-report',
        documentTitle: 'بوصلة الإتقان - تحليل انتشار الإتقان - تقرير تفصيلي',
      });
      if (!printSession.current) {
        setShowPrintHelp(false);
        setPrintError('تعذر تجهيز التقرير للطباعة. حاول مرة أخرى.');
        return;
      }
      setShowPrintHelp(true);
      tryPrint();
    } catch {
      setShowPrintHelp(false);
      setPrintError('تعذر تجهيز التقرير للطباعة. حاول مرة أخرى.');
    }
  };

  const closePrintHelp = () => {
    printSession.current?.dispose();
    printSession.current = null;
    setShowPrintHelp(false);
    setPrintError('');
  };

  return <div className="space-y-5">
    <PrintStyles />
    <UnifiedReportToolbar
      noPrintClassName="mastery-spread-no-print"
      title="التقرير الختامي"
      description="تقرير تفصيلي توثيقي للطباعة الرسمية على A4."
      actions={[{ label: 'طباعة التقرير التفصيلي', onClick: printReport, variant: 'blue' }]}
      suppressBrowserHeaders
    />
    {showPrintHelp ? <div role="status" className="mastery-spread-no-print rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
      <p className="font-black">التقرير جاهز للطباعة</p>
      <p>{printError || 'إذا لم تظهر نافذة الطباعة، استخدم زر المشاركة في المتصفح ثم اختر «طباعة».'}</p>
      {printError ? <p>يمكنك أيضًا استخدام زر المشاركة في المتصفح ثم اختيار «طباعة».</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={tryPrint} className="rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white">إعادة محاولة الطباعة</button>
        <button type="button" onClick={closePrintHelp} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 font-bold text-emerald-950">إغلاق</button>
      </div>
    </div> : printError ? <div role="alert" className="mastery-spread-no-print rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{printError}</div> : null}
    <DetailedReport result={result} />
  </div>;
}

function Header({ result, title, subtitle }: { result: MasterySpreadAnalysisResult; title: string; subtitle: string }) {
  return <UnifiedOfficialReportHeader
    directorate={displayValue(result.context.educationDirectorate)}
    schoolName={displayValue(result.context.schoolName)}
    trackLabel="بوصلة الإتقان — مسار تحليل انتشار الإتقان"
    title={title}
    subtitle={subtitle}
  />;
}

function DetailedReport({ result }: { result: MasterySpreadAnalysisResult }) {
  return <article id="mastery-spread-detailed-report" className="premium-report-document mw-print-report mw-print-report--mastery rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
    <Header result={result} title="تقرير تفصيلي توثيقي لانتشار الإتقان" subtitle="توثيق شامل لجودة البيانات والمؤشرات والتوزيع والفجوة والقرار والخطة وحدود التفسير." />
    <MissingDataNotice result={result} />
    <DataGrid result={result} />
    <PremiumReportSummary
      eyebrow="ملخص تنفيذي داخل التقرير"
      title="نظرة سريعة على انتشار الإتقان"
      description={result.report.summaryText || result.educationalDecision.interpretation}
      items={[
        { label: 'نسبة الإتقان', value: `${result.summary.masterySpreadPercent}%`, note: `${formatStudentCount(result.summary.masteryCount)} من أصل ${formatStudentCount(result.summary.totalStudents)}`, tone: 'royal' },
        { label: 'الحكم العام', value: <ReportStatusChip tone={toneFromText(result.judgement.label)}>{result.judgement.label}</ReportStatusChip>, note: result.judgement.shortDescription, tone: toneFromText(result.judgement.label) },
        { label: 'القرار التربوي', value: result.educationalDecision.decisionLabel, note: result.educationalDecision.priorityLabel, tone: toneFromText(result.educationalDecision.priorityLabel) },
        { label: 'الفجوة للمستوى التالي', value: result.gapToNextLevel.hasNextLevel ? `${result.gapToNextLevel.additionalStudentsNeeded} طالب` : 'لا توجد فجوة', note: result.gapToNextLevel.hasNextLevel ? result.gapToNextLevel.nextJudgementLabel : 'المجموعة في أعلى سلم الحكم', tone: result.gapToNextLevel.hasNextLevel ? 'amber' : 'success' },
      ]}
    />
    <section className="report-section mastery-report-methodology mt-5">
      <SectionTitle number="1" title="منهجية التحليل وجودة البيانات" />
      <div className="mastery-print-grid-two mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <SmallBox title="منهجية التحليل" text="حُسب بلوغ الإتقان من الدرجة الأصلية لكل طالب مقارنة بحد الإتقان، واستُخدمت القيم الخام في الحكم والتوزيع والإحصاءات، بينما استُخدم التقريب للعرض فقط." />
        <SmallBox title="جودة بيانات المجموعة" text={result.dataQuality.interpretation} />
        <SmallBox title="المعايير الإجرائية" text={`يُعد التشتت منخفضًا إذا كان الانحراف المعياري أقل من ${GROUP_SHAPE_THRESHOLDS.lowDispersionMax} نقاط، ومرتفعًا إذا بلغ ${GROUP_SHAPE_THRESHOLDS.highDispersionMin} نقطة فأكثر. وتُعد فرصة التحسن القريب عالية عند بلوغ فئة القرب ${GROUP_SHAPE_THRESHOLDS.highOpportunityNearPercent}%، ومتوسطة عند بلوغ ${GROUP_SHAPE_THRESHOLDS.mediumOpportunityNearPercent}%. هذه معايير إجرائية داخل التطبيق وليست قانونًا قياسيًا عامًا.`} />
      </div>
      <LimitsNote />
    </section>

    <section className="report-page-break">
      <SectionTitle number="2" title="المؤشرات العامة وسلم الحكم" />
      <KeyIndicators result={result} />
      <JudgementTable current={result.judgement.code} />
      <DistributionTable result={result} />
    </section>

    <section className="report-page-break">
      <SectionTitle number="3" title="الرسوم البيانية التوثيقية" />
      <div className="mastery-print-grid-two mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ChartBox title="انتشار الإتقان على السلم"><ScaleBar value={result.summary.masterySpreadPercent} /></ChartBox>
        <ChartBox title="المتقنون وغير المتقنين"><BarList rows={[['حققوا الإتقان', result.summary.masteryCount, result.summary.totalStudents], ['لم يحققوا الإتقان', result.summary.nonMasteryCount, result.summary.totalStudents]]} /></ChartBox>
        <ChartBox title="الفئات حول حد الإتقان"><BarList rows={result.distribution.map((band) => [band.label, band.count, result.summary.totalStudents])} /></ChartBox>
        <ChartBox title="المتوسط والوسيط وحد الإتقان"><PercentBarList rows={[['المتوسط', result.statistics.meanPercent], ['الوسيط', result.statistics.medianPercent], ['حد الإتقان', result.summary.masteryCutoffPercent]]} /></ChartBox>
      </div>
      <div className="report-section mt-3"><ChartBox title="المدرج التكراري"><BarList rows={result.histogram.map((bucket) => [bucket.key, bucket.count, result.summary.totalStudents])} columns={5} /></ChartBox></div>
    </section>

    <section className="report-flow mt-5">
      <SectionTitle number="4" title="قراءة الفجوة وشكل المجموعة" />
      <div className="mastery-print-grid-two mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <SmallBox title="الفجوة إلى المستوى التالي" text={result.gapToNextLevel.message} />
        <SmallBox title="شكل المجموعة" text={result.groupShape.interpretation} />
        <SmallBox title="القريبون من الإتقان" text={`${formatStudentCount(result.groupShape.nearMasteryCount)}، بنسبة ${result.groupShape.nearMasteryPercent}%.`} />
        <SmallBox title="الفجوة العميقة" text={`${formatStudentCount(result.groupShape.deepGapCount)}، بنسبة ${result.groupShape.deepGapPercent}%.`} />
      </div>
      {result.gapToNextLevel.hasNextLevel ? <ChartBox title="الحالي والمطلوب"><PercentBarList rows={[['الحالي', result.summary.masterySpreadPercent], ['المطلوب', result.gapToNextLevel.requiredSpreadPercent ?? 0]]} /></ChartBox> : null}
    </section>

    <section className="report-flow mt-5 mastery-diagnostic-insights-section">
      <div className="mastery-print-heading-group">
        <SectionTitle number="5" title="تحليل فجوة الانتشار والأسباب المحتملة" />
        <DiagnosticDecisionReportBlock decision={result.diagnostics.decision} />
      </div>
      <div className="mastery-print-diagnostics mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ParetoReportBlock title="باريتو فئات الفجوة" description="يرتب فئات غير المتقنين حسب حجمها لتحديد نوع التدخل." entries={result.diagnostics.gapPareto} valueLabel="العدد" />
        <FishboneReportBlock diagnostic={result.diagnostics.fishbone} />
      </div>
    </section>

    <section className="report-page-break firefox-tight-section mastery-firefox-final-page">
      <SectionTitle number="6" title="القرار والخطة وإعادة القياس" />
      <div className="mastery-print-grid-three mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SmallBox title="القرار" text={result.educationalDecision.decisionLabel} />
        <SmallBox title="أولوية التدخل" text={result.educationalDecision.priorityLabel} />
        <SmallBox title="الخطة" text={result.proposedPlan.title} />
      </div>
      <Narrative title="القراءة التربوية" text={result.educationalDecision.interpretation} />
      <ListBox title="التوصيات" items={result.educationalDecision.recommendations} />
      <PlanTable result={result} />
      <Narrative title="إعادة القياس" text={result.educationalDecision.retestRecommendation} />
      <SignatureSection />
    </section>
  </article>;
}

function DataGrid({ result }: { result: MasterySpreadAnalysisResult }) {
  const cells: Array<[string, React.ReactNode]> = [
    ['المديرية', result.context.educationDirectorate], ['المدرسة', result.context.schoolName], ['اسم المعلم', result.context.teacherName], ['المادة', result.context.subject], ['الصف', result.context.grade],
    ['المجموعة', result.context.groupDescription], ['أداة القياس', result.context.assessmentName], ['العام الدراسي', result.context.academicYear], ['تاريخ التحليل', result.context.analysisDate],
    ['الدرجة الكلية', result.summary.totalScore], ['حد الإتقان', `${result.summary.masteryCutoffPercent}%`], ['الحد الحسابي', result.summary.masteryCutoffScore], ['أقل درجة صحيحة تحقق الإتقان', result.summary.minimumWholeScoreForMastery],
  ];
  return <section className="report-section mastery-print-data-grid mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">{cells.map(([label, value]) => <InfoCell key={label} label={label} value={displayValue(value)} />)}</section>;
}

function KeyIndicators({ result }: { result: MasterySpreadAnalysisResult }) {
  const rows: Array<[string, React.ReactNode]> = [
    ['عدد الطلبة', result.summary.totalStudents], ['عدد المتقنين', result.summary.masteryCount], ['عدد غير المتقنين', result.summary.nonMasteryCount], ['نسبة الانتشار', `${result.summary.masterySpreadPercent}%`],
    ['الحكم', result.judgement.label], ['المتوسط', `${result.statistics.meanPercent}%`], ['الوسيط', `${result.statistics.medianPercent}%`], ['الانحراف المعياري', `${result.statistics.standardDeviationPercent}%`],
    ['أعلى نسبة', `${result.statistics.maxPercent}%`], ['أدنى نسبة', `${result.statistics.minPercent}%`], ['المدى', `${result.statistics.rangePercent} نقطة`], ['أثر الطالب الواحد', `نحو ${formatPercentagePointAmount(result.dataQuality.singleStudentImpactPoints)}`],
  ];
  return <TwoColumnTable rows={rows} />;
}

function JudgementTable({ current }: { current: string }) {
  return <section className="report-section mt-4"><h3 className="premium-report-subtitle">سلم الحكم</h3><div className="premium-report-table mt-2 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-xs"><thead className="bg-slate-900 text-white"><tr><th className="px-3 py-2 text-right">الحكم</th><th className="px-3 py-2 text-right">النطاق</th></tr></thead><tbody>{MASTERY_JUDGEMENT_SCALE.map((item) => <tr key={item.code} className={item.code === current ? 'bg-emerald-50 font-black' : ''}><td className="border-b px-3 py-2">{item.label}</td><td className="border-b px-3 py-2">{item.code === 'distinguished' ? '70% فأكثر' : item.code === 'rapid_intervention' ? 'أقل من 40%' : `${item.minPercent}% إلى أقل من ${item.maxPercent}%`}</td></tr>)}</tbody></table></div></section>;
}

function DistributionTable({ result }: { result: MasterySpreadAnalysisResult }) {
  return <section className="report-section mt-4"><h3 className="premium-report-subtitle">توزيع المجموعة حول حد الإتقان</h3><div className="premium-report-table mt-2 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-xs"><thead className="bg-slate-100"><tr><th className="px-3 py-2 text-right">الفئة</th><th className="px-3 py-2 text-right">العدد</th><th className="px-3 py-2 text-right">النسبة</th><th className="px-3 py-2 text-right">الدلالة</th></tr></thead><tbody>{result.distribution.map((band) => <tr key={band.key}><td className="border-b px-3 py-2 font-bold">{band.label}</td><td className="border-b px-3 py-2">{band.count}</td><td className="border-b px-3 py-2">{band.percent}%</td><td className="border-b px-3 py-2 leading-6">{band.interpretation}</td></tr>)}</tbody></table></div></section>;
}

function PlanTable({ result }: { result: MasterySpreadAnalysisResult }) {
  const rows: Array<[string, string]> = [['المدة', result.proposedPlan.duration], ['آلية التنفيذ', result.proposedPlan.implementationMode], ['أداة القياس', result.proposedPlan.assessmentTool], ['معيار النجاح', result.proposedPlan.successCriterion], ['المتابعة', result.proposedPlan.followUp]];
  return <section className="report-flow mastery-plan-table mt-4"><h3 className="premium-report-subtitle">الخطة التنفيذية</h3><TwoColumnTable rows={rows} /><ListBox title="الأنشطة" items={result.proposedPlan.activities} /></section>;
}

function MissingDataNotice({ result }: { result: MasterySpreadAnalysisResult }) {
  const missing = [['المديرية', result.context.educationDirectorate], ['المدرسة', result.context.schoolName], ['اسم المعلم', result.context.teacherName], ['المادة', result.context.subject], ['الصف', result.context.grade], ['المجموعة', result.context.groupDescription], ['أداة القياس', result.context.assessmentName]].filter(([, value]) => !value || value === 'غير محدد');
  if (!missing.length) return null;
  return <div className="report-section mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-950">تنبيه اعتماد: توجد بيانات تعريفية غير مكتملة ({missing.map(([label]) => label).join('، ')}). يفضل إكمالها قبل الطباعة الرسمية النهائية.</div>;
}

function LimitsNote() {
  return <div className="report-section mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-6 text-emerald-950">يعتمد التحليل على الدرجات النهائية المدخلة، ويصف انتشار بلوغ حد الإتقان داخل المجموعة. لا يحدد وحده المهارات أو المفاهيم المرتبطة بالنتيجة، ولا يثبت أسباب الانخفاض أو الارتفاع دون بيانات تشخيصية إضافية.</div>;
}

function ScaleBar({ value }: { value: number }) { return <div className="pt-4" dir="ltr"><div className="relative h-5 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500"><span className="absolute -top-1 h-7 w-1 bg-slate-950" style={{ left: `${Math.max(0, Math.min(100, value))}%` }} /></div><div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500">{[0, 40, 50, 60, 70, 100].map((item) => <span key={item}>{item}%</span>)}</div></div>; }
function BarList({ rows, columns = 1 }: { rows: Array<[string, number, number]>; columns?: number }) { return <div className={`grid gap-2 ${columns > 1 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-1'}`}>{rows.map(([label, value, max]) => <div key={label}><div className="flex justify-between gap-2 text-[11px] font-bold"><span>{label}</span><span>{value}</span></div><div className="mt-1 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-slate-800" style={{ width: `${max > 0 ? Math.min(100, value / max * 100) : 0}%` }} /></div></div>)}</div>; }
function PercentBarList({ rows }: { rows: Array<[string, number]> }) { return <div className="space-y-2">{rows.map(([label, value]) => <div key={label}><div className="flex justify-between text-[11px] font-bold"><span>{label}</span><span>{value}%</span></div><div className="mt-1 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-blue-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>)}</div>; }
function ChartBox({ title, children }: { title: string; children: React.ReactNode }) { return <div className="premium-report-chart-card chart-card rounded-2xl border border-slate-200 p-4"><h3 className="premium-report-subtitle">{title}</h3><div className="mt-3">{children}</div></div>; }
function InfoCell({ label, value }: { label: string; value: React.ReactNode }) { return <div className="premium-report-info-cell rounded-xl border border-slate-100 bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-1 font-black">{value}</p></div>; }
function SmallBox({ title, text }: { title: string; text: string }) { return <div className="premium-report-narrative rounded-2xl border border-slate-200 p-4"><h3 className="text-xs font-black">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-700">{text}</p></div>; }
function Narrative({ title, text }: { title: string; text: string }) { return <div className="premium-report-narrative report-section mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><h3 className="text-xs font-black">{title}</h3><p className="mt-2 text-xs leading-6">{text}</p></div>; }
function ListBox({ title, items }: { title: string; items: string[] }) { return <div className="premium-report-narrative report-section mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><h3 className="text-xs font-black">{title}</h3><ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-6">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function SectionTitle({ number, title }: { number: string; title: string }) { return <h2 className="premium-report-section-title text-lg font-black"><span>{number}</span>{title}</h2>; }
function TwoColumnTable({ rows }: { rows: Array<[string, React.ReactNode]> }) { return <div className="premium-report-table mt-3 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-xs"><tbody>{rows.map(([label, value]) => <tr key={label} className="border-t first:border-t-0"><td className="w-1/3 bg-slate-50 px-3 py-2 font-bold text-slate-600">{label}</td><td className="px-3 py-2 font-black">{value}</td></tr>)}</tbody></table></div>; }
function SignatureSection() { return <section className="signature-section mt-5 grid grid-cols-3 gap-3 text-center text-xs">{['المعلم', 'المعلم الأول / المشرف', 'إدارة المدرسة'].map((title) => <div key={title} className="premium-report-signature rounded-2xl border border-slate-200 p-4"><div className="font-black">{title}</div><div className="mt-10 border-t pt-2 text-slate-500">الاسم والتوقيع</div></div>)}</section>; }
function displayValue(value: unknown): string { if (value === null || value === undefined) return 'لم يحدد'; const text = String(value).trim(); return !text || text === 'غير محدد' || text === '—' ? 'لم يحدد' : text; }

function PrintStyles() {
  return <UnifiedPrintStyles
    noPrintClassName="mastery-spread-no-print"
    dataPrintTargets={[
      { value: 'mastery-spread-detailed', areaId: 'mastery-spread-detailed-report' },
    ]}
    pageMarginMm={8}
    suppressBrowserHeaders
    fontSizePx={11}
    lineHeight={1.45}
    extraCss={`
      #mastery-spread-detailed-report { direction: rtl; }
      #mastery-spread-detailed-report .chart-card { min-height: 85px !important; }
      #mastery-spread-detailed-report table { table-layout: fixed !important; }
      #mastery-spread-detailed-report th, #mastery-spread-detailed-report td { white-space: normal !important; overflow-wrap: anywhere !important; }
      #mastery-spread-detailed-report .diagnostic-report-block { break-inside: avoid !important; page-break-inside: avoid !important; }

      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page {
        font-size: 10.5px !important;
        line-height: 1.4 !important;
      }
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page .grid {
        gap: 5px !important;
      }
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page .rounded-2xl {
        border-radius: 9px !important;
      }
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page .mastery-plan-table {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page table {
        font-size: 10.5px !important;
      }
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page th,
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page td {
        padding: 3px 5px !important;
        line-height: 1.4 !important;
      }
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page ul {
        margin-top: 3px !important;
      }
      html[data-print-browser="firefox"] #mastery-spread-detailed-report .mastery-firefox-final-page li {
        line-height: 1.35 !important;
      }
    `}
  />;
}
