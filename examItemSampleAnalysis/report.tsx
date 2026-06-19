import React from 'react';
import { printUnifiedReport, UnifiedOfficialReportHeader, UnifiedPrintStyles, UnifiedReportToolbar } from '../shared/UnifiedReport';
import { buildExecutiveSummaryText, buildMethodologyText, buildOverallReadingText, buildPaperReviewDecisionText, buildPriorityItemRecommendation, buildSampleLimitText, buildTeachingDecisionText } from './reportText';
import type { BalanceEntry, ExamItemsSampleAnalysisResult, ItemAnalysisResult, SkillAnalysisResult } from './types';

export function ExamItemsSampleReports({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const printReport = (target: 'executive' | 'detailed') => {
    void printUnifiedReport({
      targetValue: `exam-items-${target}`,
      areaId: `exam-items-${target}-report`,
      documentTitle: `بوصلة الإتقان - تحليل مفردات الورقة - ${target === 'executive' ? 'تقرير تنفيذي' : 'تقرير تفصيلي'}`,
    });
  };

  return (
    <div className="space-y-5">
      <PrintStyles />
      <UnifiedReportToolbar
        noPrintClassName="exam-items-no-print"
        title="التقرير الختامي"
        description="تتوفر نسخة تنفيذية مختصرة ونسخة تفصيلية توثيقية للطباعة الرسمية على A4."
        actions={[
          { label: 'طباعة التنفيذي', onClick: () => printReport('executive') },
          { label: 'طباعة التفصيلي', onClick: () => printReport('detailed'), variant: 'blue' },
        ]}
      />

      <ExecutiveReport result={result} />
      <DetailedReport result={result} />
    </div>
  );
}

function OfficialHeader({ result, title, subtitle }: { result: ExamItemsSampleAnalysisResult; title: string; subtitle: string }) {
  return (
    <UnifiedOfficialReportHeader
      directorate={valueOrDash(result.context.educationDirectorate)}
      trackLabel="بوصلة الإتقان — مسار تحليل مفردات الورقة من عينة"
      title={title}
      subtitle={subtitle}
    />
  );
}

function ReportDataGrid({ result, compact = false }: { result: ExamItemsSampleAnalysisResult; compact?: boolean }) {
  const cells: Array<[string, React.ReactNode]> = [
    ['المدرسة', result.context.schoolName],
    ['المادة', result.context.subject],
    ['الصف', result.context.grade],
    ['عنوان الورقة', result.context.paperTitle],
    ['نوع أداة القياس', result.context.assessmentType],
    ['المعلم', result.context.teacherName],
    ['العام الدراسي', result.context.academicYear],
    ['تاريخ التحليل', result.context.analysisDate],
    ['إجمالي الأوراق', result.reliability.totalPapers],
    ['عدد أوراق العينة', result.reliability.sampleSize],
    ['نسبة العينة', `${result.reliability.samplePercent}%`],
    ['موثوقية القراءة', formatReliabilityLabel(result)],
    ['اكتمال البيانات', `${result.dataCompleteness.completionPercent}%`],
    ['حالة الاكتمال', result.dataCompleteness.label],
  ];

  const visibleCells = compact ? cells.slice(0, 12) : cells;

  return (
    <section className="report-section mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
      {visibleCells.map(([label, value]) => <InfoCell key={label} label={label} value={valueOrDash(value)} />)}
    </section>
  );
}

export function ExecutiveReport({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <article id="exam-items-executive-report" className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <OfficialHeader
        result={result}
        title="تقرير تنفيذي مختصر لتحليل مفردات الورقة"
        subtitle="خلاصة موجهة للمعلم والإشراف ولجنة التحصيل حول أهم مؤشرات العينة والقرارات الأساسية."
      />
      <MissingDataNotice result={result} />
      <ReportDataGrid result={result} compact />

      <section className="report-section mt-5">
        <SectionTitle number="1" title="الملخص التنفيذي" />
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <Metric label="متوسط أداء المفردات" value={`${result.summary.averagePaperPercent}%`} />
          <Metric label="الفقد الكلي" value={result.summary.totalLoss} />
          <Metric label="مفردات عالية الأولوية" value={getHighPriorityItems(result).length} />
          <Metric label="اكتمال البيانات" value={`${result.dataCompleteness.completionPercent}%`} />
          <Metric label="موثوقية القراءة" value={formatReliabilityLabel(result)} />
        </div>
        <Narrative title="الخلاصة" text={buildExecutiveSummaryText(result)} compact />
        <Narrative title="قرار تربوي أولي" text={`${buildTeachingDecisionText(result)} ${buildPaperReviewDecisionText(result)}`} compact />
      </section>

      <section className="report-section mt-4">
        <SectionTitle number="2" title="أبرز المفردات والمهارات" />
        <CompactTables result={result} />
      </section>

      <section className="report-section mt-4">
        <SectionTitle number="3" title="التوصيات التنفيذية" />
        <BulletList items={compactTeachingRecommendations(result).slice(0, 4)} compact />
        <SampleLimitNote result={result} compact />
      </section>

      <SignatureSection />
    </article>
  );
}

export function DetailedReport({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <article id="exam-items-detailed-report" className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <OfficialHeader
        result={result}
        title="تقرير تفصيلي توثيقي لتحليل مفردات الورقة"
        subtitle="توثيق شامل للعينة، منهجية التحليل، أداء المفردات والمهارات، توازن الورقة، التوصيات، وحدود التفسير."
      />
      <MissingDataNotice result={result} />
      <ReportDataGrid result={result} />

      <section className="report-section mt-5">
        <SectionTitle number="1" title="منهجية التحليل وحدود العينة" />
        <Narrative title="منهجية التحليل" text={buildMethodologyText(result)} />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Narrative title="جودة العينة" text={formatReliabilityNarrative(result)} />
          <Narrative title="حدود التفسير" text={buildSampleLimitText(result)} />
        </div>
      </section>

      <section className="report-page-break">
        <SectionTitle number="2" title="المؤشرات العامة وتحليل المفردات" />
        <TwoColumnTable rows={[
          ['عدد المفردات', result.summary.totalItems],
          ['الدرجة الكلية للورقة', result.summary.paperTotalScore],
          ['متوسط الدرجة المرصودة في العينة', `${result.summary.averagePaperScore} من ${result.summary.paperTotalScore}`],
          ['متوسط أداء المفردات', `${result.summary.averagePaperPercent}%`],
          ['الفقد الكلي في العينة', result.summary.totalLoss],
          ['حد الإتقان', `${result.summary.masteryCutoffPercent}% = ${result.summary.masteryCutoffScore} درجة`],
          ['عدد خلايا الدرجات الصحيحة', result.validation.validScoreCells],
          ['عدد خلايا الدرجات غير الصالحة/الفارغة', result.validation.invalidScoreCells],
          ['نسبة اكتمال بيانات الدرجات', `${result.dataCompleteness.completionPercent}%`],
          ['حالة اكتمال البيانات', result.dataCompleteness.label],
        ]} />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <MiniItemTable title="أقل المفردات أداءً" items={result.decision.lowestPerformanceItems} mode="performance" />
          <MiniItemTable title="أعلى المفردات فقدًا" items={result.decision.highestLossItems} mode="loss" />
        </div>
        <FullItemsTable result={result} />
        <Narrative title="مفردات تحتاج مراجعة" text={buildPriorityItemRecommendation(result)} />
      </section>

      <section className="report-page-break">
        <SectionTitle number="3" title="تحليل المهارات وتوازن الورقة" />
        <FullSkillsTable result={result} />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Narrative title="قراءة توازن المهارات" text={normalizeOfficialText(result.balanceReading.skillReading)} />
          <Narrative title="قراءة توازن مستويات السؤال" text={normalizeOfficialText(result.balanceReading.levelReading)} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <BalanceTable title="توزيع الدرجات حسب المهارات" rows={result.skillBalance} />
          <BalanceTable title="توزيع الدرجات حسب مستويات السؤال" rows={result.levelBalance} />
        </div>
      </section>

      <section className="report-page-break firefox-exam-charts-page">
        <SectionTitle number="4" title="الرسوم البيانية التوثيقية" />
        <SimpleCharts result={result} />
      </section>

      <section className="report-page-break firefox-tight-section exam-firefox-final-page">
        <SectionTitle number="5" title="القرار والتوصيات" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Narrative title="القراءة العامة" text={buildOverallReadingText(result)} />
          <Narrative title="القرار التدريسي" text={buildTeachingDecisionText(result)} />
          <Narrative title="مراجعة الورقة القادمة" text={buildPaperReviewDecisionText(result)} />
        </div>
        <BulletList items={compactTeachingRecommendations(result)} />
        <SignatureSection />
      </section>
    </article>
  );
}

function CompactTables({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
      <MiniItemTable title="أقل المفردات أداءً" items={result.decision.lowestPerformanceItems.slice(0, 3)} mode="performance" />
      <MiniItemTable title="أعلى المفردات فقدًا" items={result.decision.highestLossItems.slice(0, 3)} mode="loss" />
      <MiniSkillTable skills={result.skills.slice(0, 5)} />
    </div>
  );
}

function MiniItemTable({ title, items, mode }: { title: string; items: ItemAnalysisResult[]; mode: 'performance' | 'loss' }) {
  return (
    <div className="report-section overflow-hidden rounded-2xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black text-slate-900">{title}</h3>
      <table className="w-full text-xs">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-2 py-1.5 text-right">المفردة</th>
            <th className="px-2 py-1.5 text-right">المهارة</th>
            <th className="px-2 py-1.5 text-right">{mode === 'performance' ? 'الأداء' : 'الفقد'}</th>
            <th className="px-2 py-1.5 text-right">الأولوية</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? items.map((item) => (
            <tr key={`${title}-${item.itemId}`} className="border-t border-slate-100">
              <td className="px-2 py-1.5 font-bold">{item.label}</td>
              <td className="px-2 py-1.5">{item.skill}</td>
              <td className="px-2 py-1.5">{mode === 'performance' ? `${item.performancePercent}%` : item.totalLoss}</td>
              <td className="px-2 py-1.5">{formatItemPriorityLabel(item)}</td>
            </tr>
          )) : <tr><td className="px-2 py-3 text-slate-500" colSpan={4}>لا توجد بيانات كافية.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MiniSkillTable({ skills }: { skills: SkillAnalysisResult[] }) {
  return (
    <div className="report-section overflow-hidden rounded-2xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black text-slate-900">خلاصة المهارات</h3>
      <table className="w-full text-xs">
        <thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الحكم</th></tr></thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.skill} className="border-t border-slate-100"><td className="px-2 py-1.5">{skill.skill}</td><td className="px-2 py-1.5">{skill.performancePercent}%</td><td className="px-2 py-1.5">{normalizeOfficialText(skill.judgement)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FullItemsTable({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="report-section report-flow mt-4 overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-[11px]">
        <thead className="bg-slate-900 text-white">
          <tr>
            {['المفردة', 'المهارة', 'الدرجة', 'الأداء', 'الفقد', 'صفر', 'كاملة', 'جزئية', 'الأولوية'].map((head) => <th key={head} className="px-2 py-1.5 text-right">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {result.items.map((item) => (
            <tr key={item.itemId} className="border-t border-slate-100">
              <td className="px-2 py-1.5 font-bold">{item.label}</td>
              <td className="px-2 py-1.5">{item.skill}</td>
              <td className="px-2 py-1.5">{item.maxScore}</td>
              <td className="px-2 py-1.5">{item.performancePercent}%</td>
              <td className="px-2 py-1.5">{item.totalLoss}</td>
              <td className="px-2 py-1.5">{item.zeroPercent}%</td>
              <td className="px-2 py-1.5">{item.fullPercent}%</td>
              <td className="px-2 py-1.5">{item.partialPercent}%</td>
              <td className="px-2 py-1.5">{formatItemPriorityLabel(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FullSkillsTable({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="report-section mt-3 overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">عدد المفردات</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الفقد</th><th className="px-2 py-1.5 text-right">الحكم</th><th className="px-2 py-1.5 text-right">التوصية</th></tr></thead>
        <tbody>
          {result.skills.map((skill) => (
            <tr key={skill.skill} className="border-t border-slate-100"><td className="px-2 py-1.5 font-bold">{skill.skill}</td><td className="px-2 py-1.5">{skill.itemCount}</td><td className="px-2 py-1.5">{skill.performancePercent}%</td><td className="px-2 py-1.5">{skill.totalLoss}</td><td className="px-2 py-1.5">{normalizeOfficialText(skill.judgement)}</td><td className="px-2 py-1.5">{skill.recommendation}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BalanceTable({ title, rows }: { title: string; rows: BalanceEntry[] }) {
  return (
    <div className="report-section overflow-hidden rounded-2xl border border-slate-200">
      <h4 className="bg-slate-100 px-3 py-2 text-xs font-black text-slate-900">{title}</h4>
      <table className="w-full text-xs">
        <thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">الفئة</th><th className="px-2 py-1.5 text-right">عدد المفردات</th><th className="px-2 py-1.5 text-right">وزن الدرجات</th><th className="px-2 py-1.5 text-right">النسبة</th></tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.name} className="border-t border-slate-100"><td className="px-2 py-1.5">{normalizeOfficialText(row.name)}</td><td className="px-2 py-1.5">{row.itemCount}</td><td className="px-2 py-1.5">{row.scoreWeight}</td><td className="px-2 py-1.5">{row.scoreWeightPercent}%</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

function SimpleCharts({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const performanceRows = result.items.map((item) => <HorizontalBar key={item.itemId} label={item.label} value={item.performancePercent} max={100} suffix="%" />);
  const zeroRows = result.items.map((item) => <HorizontalBar key={item.itemId} label={item.label} value={item.zeroPercent} max={100} suffix="%" />);

  return (
    <div className="exam-items-charts-grid mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <ChartCard title="حجم العينة من مجتمع التحليل" description={formatReliabilityLabel(result)} className="exam-items-chart-compact">
        <HorizontalBar label="نسبة العينة" value={result.reliability.samplePercent} max={100} suffix="%" />
      </ChartCard>
      <ChartCard title="الفقد حسب المفردات" description="المفردات الأعلى أثرًا في فقد الدرجات." className="exam-items-chart-compact">
        {result.decision.highestLossItems.map((item) => <HorizontalBar key={item.itemId} label={item.label} value={item.totalLoss} max={Math.max(1, ...result.items.map((entry) => entry.totalLoss))} />)}
      </ChartCard>
      <ChartCard title="أداء المفردات" description="نسبة أداء العينة في كل مفردة." className="exam-items-chart-long exam-items-chart-full">
        <SplitBarList rows={performanceRows} />
      </ChartCard>
      <ChartCard title="نسبة الصفر لكل مفردة" description="المفردات التي ارتفعت فيها نسبة الصفر." className="exam-items-chart-long exam-items-chart-full">
        <SplitBarList rows={zeroRows} />
      </ChartCard>
      <ChartCard title="أداء المهارات" description="أداء العينة حسب المهارات المرتبطة بمفردات الورقة." className="exam-items-chart-compact">
        {result.skills.map((skill) => <HorizontalBar key={skill.skill} label={skill.skill} value={skill.performancePercent} max={100} suffix="%" />)}
      </ChartCard>
      <ChartCard title="توزيع درجات الورقة حسب المهارات" description="وزن كل مهارة من الدرجة الكلية للورقة." className="exam-items-chart-compact">
        {result.skillBalance.map((row) => <HorizontalBar key={row.name} label={normalizeOfficialText(row.name)} value={row.scoreWeightPercent} max={100} suffix="%" />)}
      </ChartCard>
    </div>
  );
}

function formatReliabilityLabel(result: ExamItemsSampleAnalysisResult): string {
  if (result.dataCompleteness.completionPercent < 90) {
    return `${result.reliability.label} مع حذر`;
  }
  return result.reliability.label;
}

function formatReliabilityNarrative(result: ExamItemsSampleAnalysisResult): string {
  const base = `${result.reliability.label}: ${result.reliability.message}${result.reliability.warning ? ` ${result.reliability.warning}` : ''}`;
  if (result.dataCompleteness.completionPercent < 90) {
    return `${base} تقرأ النتائج مع حذر بسبب اكتمال بيانات الدرجات بنسبة ${result.dataCompleteness.completionPercent}%.`;
  }
  return base;
}


function getItemPriorityLabel(item: ItemAnalysisResult): ItemAnalysisResult['priority'] {
  return item.priority;
}

function formatItemPriorityLabel(item: ItemAnalysisResult): string {
  return getItemPriorityLabel(item);
}

function getHighPriorityItems(result: ExamItemsSampleAnalysisResult): ItemAnalysisResult[] {
  return [...result.items]
    .filter((item) => getItemPriorityLabel(item) === 'عالية')
    .sort((a, b) => b.totalLoss - a.totalLoss || a.performancePercent - b.performancePercent);
}

function compactTeachingRecommendations(result: ExamItemsSampleAnalysisResult): string[] {
  const prioritySkills = result.skills
    .filter((skill) => skill.performancePercent < 70 || skill.judgement.includes('تحتاج'))
    .sort((a, b) => a.performancePercent - b.performancePercent)
    .slice(0, 3)
    .map((skill) => skill.skill)
    .join('، ');

  const recommendations = [
    prioritySkills
      ? buildPrioritySkillsRecommendation(result)
      : 'توجيه الدعم نحو المهارات ذات الأداء الأدنى في العينة.',
    'قراءة المفردات الأقل أداءً مع المفردات الأعلى فقدًا قبل إصدار حكم على جودة الورقة.',
    'ربط نتائج المفردات بتحليل المهارات لتحديد هل الحاجة في مفردة محددة أم في مهارة ممتدة.',
    'تنفيذ خطة تدريسية قصيرة ثم إعادة قياس المهارات أو المفردات ذات الأولوية.',
  ];

  if (result.validation.invalidScoreCells > 0) {
    recommendations.unshift('مراجعة خلايا الدرجات غير المكتملة أو غير الصالحة قبل اعتماد التقرير النهائي.');
  }

  return recommendations;
}

function normalizeOfficialText(text: string): string {
  const marks = '[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u200C\\u200D\\u0640\\s]*';
  const advancedPattern = new RegExp(`م${marks}ت${marks}ق${marks}د${marks}م`, 'g');

  return String(text ?? '')
    .replace(advancedPattern, 'متقدم')
    .replace(/(^|[^ء-ي])(عا[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]*ل[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]*)(?=$|[^ء-ي])/g, '$1متقدم')
    .replace(/(^|[^ء-ي])(عال[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]+)(?=$|[^ء-ي])/g, '$1متقدم')
    .replace(/متقد[\u064B-\u065F\u0670]*م/g, 'متقدم')
    .replace(/متقد\u064Dم/g, 'متقدم');
}

function buildPrioritySkillsRecommendation(result: ExamItemsSampleAnalysisResult): string {
  if (!result.skills.length) return 'توجيه الدعم نحو المهارات ذات الأداء الأدنى في العينة.';

  const sorted = [...result.skills].sort((a, b) => a.performancePercent - b.performancePercent || b.totalLoss - a.totalLoss);
  const minPerformance = sorted[0]?.performancePercent ?? 0;
  const lowestSkills = sorted.filter((skill) => Math.abs(skill.performancePercent - minPerformance) < 0.05);
  const lowestNames = lowestSkills.map((skill) => skill.skill).join('، ');

  const highestLoss = [...result.skills].sort((a, b) => b.totalLoss - a.totalLoss)[0];
  const highestLossName = highestLoss?.skill;
  const includeLossNote = highestLossName && !lowestSkills.some((skill) => skill.skill === highestLossName);

  if (includeLossNote) {
    return `توجيه الدعم نحو أقل المهارات أداءً: ${lowestNames}، مع مراجعة مهارة ${highestLossName} لارتفاع الفقد فيها.`;
  }

  return `توجيه الدعم نحو أقل المهارات أداءً: ${lowestNames}.`;
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return <h2 className="report-section border-b border-slate-200 pb-2 text-lg font-black text-slate-950">{number}. {title}</h2>;
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"><div className="text-[11px] font-bold text-slate-500">{label}</div><div className="mt-1 text-xs font-black text-slate-900">{value}</div></div>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm"><div className="text-[11px] font-bold text-slate-500">{label}</div><div className="mt-1 text-base font-black text-slate-900">{value}</div></div>;
}

function Narrative({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return <div className={`report-section mt-3 rounded-2xl border border-slate-200 bg-white ${compact ? 'p-3 text-xs leading-6' : 'p-4 text-xs leading-6'}`}><h3 className="mb-1 font-black text-slate-900">{title}</h3><p className="whitespace-pre-line text-slate-700">{normalizeOfficialText(text)}</p></div>;
}

function TwoColumnTable({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-xs"><tbody>{rows.map(([label, value]) => <tr key={label} className="border-t border-slate-100 first:border-t-0"><td className="w-1/3 bg-slate-50 px-3 py-2 font-bold text-slate-600">{label}</td><td className="px-3 py-2 font-black text-slate-900">{value}</td></tr>)}</tbody></table></div>;
}

function BulletList({ items, compact = false }: { items: string[]; compact?: boolean }) {
  return <ul className={`report-section mt-3 space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 ${compact ? 'p-3 text-xs leading-6' : 'p-4 text-xs leading-6'} text-slate-700`}>{items.map((item) => <li key={item}>• {item}</li>)}</ul>;
}

function SampleLimitNote({ result, compact = false }: { result: ExamItemsSampleAnalysisResult; compact?: boolean }) {
  return <div className={`report-section mt-3 rounded-2xl border border-amber-200 bg-amber-50 ${compact ? 'p-3' : 'p-4'} text-xs leading-6 text-amber-950`}>{buildSampleLimitText(result)}</div>;
}

function ChartCard({ title, description, children, className = '' }: { title: string; description: string; children: React.ReactNode; className?: string }) {
  return <div className={`chart-card exam-items-chart-card rounded-2xl border border-slate-200 bg-white p-4 ${className}`}><h3 className="text-sm font-black text-slate-900">{title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p><div className="mt-3 space-y-2">{children}</div></div>;
}

function SplitBarList({ rows }: { rows: React.ReactNode[] }) {
  if (rows.length <= 16) return <div className="space-y-2">{rows}</div>;
  const midpoint = Math.ceil(rows.length / 2);
  return (
    <div className="exam-items-print-bar-columns space-y-2">
      <div className="space-y-2">{rows.slice(0, midpoint)}</div>
      <div className="space-y-2">{rows.slice(midpoint)}</div>
    </div>
  );
}

function HorizontalBar({ label, value, max, suffix = '' }: { label: string; value: number; max: number; suffix?: string }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return <div><div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-700"><span>{label}</span><span>{value}{suffix}</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-slate-800" style={{ width: `${percent}%` }} /></div></div>;
}

function SignatureSection() {
  return (
    <section className="signature-section mt-5 grid grid-cols-3 gap-3 text-center text-xs">
      {['المعلم', 'المعلم الأول / المشرف', 'إدارة المدرسة'].map((label) => <div key={label} className="rounded-2xl border border-slate-200 p-4"><div className="font-black text-slate-900">{label}</div><div className="mt-10 border-t border-slate-300 pt-2 text-slate-500">الاسم والتوقيع</div></div>)}
    </section>
  );
}

function MissingDataNotice({ result }: { result: ExamItemsSampleAnalysisResult }) {
  const missing = [
    ['المدرسة', result.context.schoolName],
    ['المادة', result.context.subject],
    ['الصف', result.context.grade],
    ['عنوان الورقة', result.context.paperTitle],
    ['المعلم', result.context.teacherName],
  ].filter(([, value]) => !String(value ?? '').trim() || String(value).trim() === 'غير محدد' || String(value).trim() === '—');

  if (!missing.length) return null;

  return <section className="report-section mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950">تنبيه اعتماد: توجد بيانات تعريفية غير مكتملة ({missing.map(([label]) => label).join('، ')}). يفضل إكمالها قبل الطباعة الرسمية النهائية.</section>;
}

function valueOrDash(value: React.ReactNode) {
  if (value === undefined || value === null || value === '') return 'لم يحدد';
  const text = String(value).trim();
  if (!text || text === '—' || text === 'غير محدد') return 'لم يحدد';
  return value;
}

function PrintStyles() {
  return (
    <UnifiedPrintStyles
      noPrintClassName="exam-items-no-print"
      dataPrintTargets={[
        { value: 'exam-items-executive', areaId: 'exam-items-executive-report' },
        { value: 'exam-items-detailed', areaId: 'exam-items-detailed-report' },
      ]}
      pageMarginMm={10}
      fontSizePx={10.1}
      lineHeight={1.42}
      extraCss={`
        #exam-items-executive-report,
        #exam-items-detailed-report { direction: rtl; }
        .workspace-current-header,
        .recharts-tooltip-wrapper { display: none !important; visibility: hidden !important; opacity: 0 !important; }
        #exam-items-executive-report .signature-section { margin-top: 10px !important; }
        #exam-items-executive-report .chart-card,
        #exam-items-detailed-report .chart-card { min-height: 0 !important; }
        #exam-items-detailed-report .exam-items-charts-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 8px !important;
          align-items: start !important;
        }
        #exam-items-detailed-report .exam-items-chart-full { grid-column: 1 / -1 !important; }
        #exam-items-detailed-report .exam-items-print-bar-columns {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 12px !important;
          align-items: start !important;
        }
        #exam-items-detailed-report .exam-items-chart-card { padding: 8px !important; border-radius: 12px !important; }
        #exam-items-detailed-report .exam-items-chart-card h3 { font-size: 10.5px !important; }
        #exam-items-detailed-report .exam-items-chart-card p { font-size: 8.5px !important; line-height: 1.3 !important; }
        #exam-items-detailed-report .exam-items-chart-card .h-3 { height: 6px !important; }
        #exam-items-detailed-report .exam-items-chart-card .text-\[11px\] { font-size: 8.5px !important; }
        html[data-print-browser="firefox"] #exam-items-detailed-report .exam-items-print-bar-columns { gap: 8px !important; }
        html[data-print-browser="firefox"] #exam-items-detailed-report .exam-items-chart-card { padding: 7px !important; }

        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-charts-grid {
          gap: 5px !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card {
          padding: 5px !important;
          border-radius: 9px !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card h3 {
          font-size: 9px !important;
          line-height: 1.15 !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card p {
          margin-top: 1px !important;
          font-size: 7px !important;
          line-height: 1.15 !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card .mt-3,
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card .space-y-2 {
          margin-top: 3px !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card .space-y-2 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 3px !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card .mb-1 {
          margin-bottom: 1px !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-chart-card .h-3 {
          height: 5px !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .firefox-exam-charts-page .exam-items-print-bar-columns {
          gap: 6px !important;
        }
        html[data-print-browser="firefox"] #exam-items-detailed-report .exam-firefox-final-page .signature-section > div > div:last-child {
          margin-top: 14px !important;
        }
        html[data-print-target="exam-items-executive"] #exam-items-executive-report { font-size: 9.7px !important; line-height: 1.35 !important; }
      `}
    />
  );
}
