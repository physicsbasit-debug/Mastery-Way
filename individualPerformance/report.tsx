import React from 'react';
import { printUnifiedReport, UnifiedOfficialReportHeader, UnifiedPrintStyles, UnifiedReportToolbar } from '../shared/UnifiedReport';
import {
  ErrorPatternsChart,
  ItemStatusChart,
  QuestionCategoryPerformanceChart,
  QuestionLevelPerformanceChart,
  SkillPerformanceChart,
  StudentMasteryPositionChart,
  TopLossItemsChart,
} from './charts';
import type {
  GroupPerformanceResult,
  IndividualPerformanceAnalysisResult,
  InterventionPriority,
  ValidatedQuestionResult,
} from './types';

export interface IndividualPerformanceReportViewProps {
  result: IndividualPerformanceAnalysisResult;
}

export function IndividualPerformanceReportView({ result }: IndividualPerformanceReportViewProps) {
  const printReport = (target: 'executive' | 'detailed') => {
    void printUnifiedReport({
      targetValue: `individual-performance-${target}`,
      areaId: `individual-performance-${target}-report`,
      documentTitle: `بوصلة الإتقان - تحليل الأداء الفردي - ${target === 'executive' ? 'تقرير تنفيذي' : 'تقرير تفصيلي'}`,
    });
  };

  return (
    <div className="space-y-5">
      <PrintStyles />
      <UnifiedReportToolbar
        noPrintClassName="individual-performance-no-print"
        title="الخطة والتقرير الختامي"
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

function OfficialHeader({ result, title, subtitle }: { result: IndividualPerformanceAnalysisResult; title: string; subtitle: string }) {
  return (
    <UnifiedOfficialReportHeader
      directorate={displayValue(result.context.educationDirectorate)}
      schoolName={displaySchoolName(result.context.schoolName)}
      trackLabel="بوصلة الإتقان — مسار تحليل الأداء الفردي"
      title={title}
      subtitle={subtitle}
    />
  );
}

function ReportDataGrid({ result, compact = false }: { result: IndividualPerformanceAnalysisResult; compact?: boolean }) {
  const cells: Array<[string, React.ReactNode]> = [
    ['اسم الطالب', result.context.studentName],
    ['المادة', result.context.subject],
    ['الصف / الشعبة', `${displayValue(result.context.grade)}${result.context.section ? ` / ${result.context.section}` : ''}`],
    ['عنوان الورقة', result.context.paperTitle],
    ['نوع أداة القياس', result.context.assessmentType],
    ['المعلم', result.context.teacherName],
    ['العام الدراسي', result.context.academicYear],
    ['تاريخ التحليل', result.context.analysisDate],
    ['عدد المفردات', result.itemStatus.totalQuestions],
    ['الدرجة الكلية', result.summary.totalScore],
    ['حد الإتقان', `${result.summary.masteryCutoffPercent}%`],
    ['جودة القراءة', result.readingQuality.label],
  ];
  const visibleCells = compact ? cells.slice(0, 10) : cells;
  return (
    <section className="report-section mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
      {visibleCells.map(([label, value]) => <InfoCell key={label} label={label} value={displayValue(value)} />)}
    </section>
  );
}

function ExecutiveReport({ result }: { result: IndividualPerformanceAnalysisResult }) {
  const topItems = result.topLossItems.slice(0, 3);
  const topSkills = result.skills.slice(0, 5);
  return (
    <article id="individual-performance-executive-report" className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <OfficialHeader
        result={result}
        title="تقرير تنفيذي مختصر للأداء الفردي"
        subtitle="خلاصة موجهة للطالب وولي الأمر والمعلم حول أهم المؤشرات والقرار التربوي وخطة المتابعة."
      />
      <MissingDataNotice result={result} />
      <ReportDataGrid result={result} compact />

      <section className="report-section mt-5">
        <SectionTitle number="1" title="الملخص التنفيذي" />
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
          <Metric label="درجة الطالب" value={`${result.summary.studentScore} من ${result.summary.totalScore}`} />
          <Metric label="النسبة" value={`${result.summary.percent}%`} />
          <Metric label="مستوى الطالب" value={result.level.label} />
          <Metric label="نوع الخطة" value={result.level.planType} />
          <Metric label="الفجوة عن الإتقان" value={`${result.summary.gapToMasteryPoints} درجة`} />
          <Metric label="جودة القراءة" value={result.readingQuality.label} />
        </div>
        <Narrative title="الخلاصة" text={result.narratives.executiveSummary} compact />
        <Narrative title="الدلالة التربوية" text={result.narratives.educationalMeaning} compact />
        <Narrative title="القرار التربوي الأولي" text={result.narratives.proposedAction} compact />
      </section>

      <section className="report-section mt-4">
        <SectionTitle number="2" title="أبرز المفردات والمهارات" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <MiniItemsTable items={topItems} />
          <MiniSkillsTable result={result} skills={topSkills} />
        </div>
      </section>

      <section className="report-section mt-4">
        <SectionTitle number="3" title="التوصيات التنفيذية" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <ListBox title="دور الطالب" items={result.plan.studentActions.slice(0, 3)} />
          <ListBox title="دور المعلم / المدرسة" items={result.plan.teacherRole.slice(0, 3)} />
          <ListBox title="دور ولي الأمر" items={result.plan.parentRole.slice(0, 3)} />
        </div>
        <Narrative title="إعادة القياس" text={result.plan.evidenceOfImprovement} compact />
        <LimitationsNote result={result} />
      </section>

      <SignatureSection />
    </article>
  );
}

function DetailedReport({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <article id="individual-performance-detailed-report" className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <OfficialHeader
        result={result}
        title="تقرير تفصيلي توثيقي للأداء الفردي"
        subtitle="توثيق شامل للمفردات والمهارات وأنواع الأسئلة ومستوياتها وأنماط الأخطاء وملاحظات المعلم وخطة المتابعة."
      />
      <MissingDataNotice result={result} />
      <ReportDataGrid result={result} />

      <section className="report-section mt-5">
        <SectionTitle number="1" title="منهجية التحليل وحدود القراءة" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Narrative title="منهجية التحليل" text="حُسب أداء الطالب في كل مفردة بمقارنة درجته بالدرجة المتاحة، ثم جُمعت النتائج حسب المهارة وتصنيف السؤال ومستواه، وحُللت أنماط الخطأ وملاحظات المعلم، وربطت النتائج بحدود النجاح والإتقان والتميز المعتمدة." />
          <Narrative title="جودة القراءة الفردية" text={result.readingQuality.message} />
        </div>
        <LimitationsNote result={result} />
      </section>

      <section className="report-page-break">
        <SectionTitle number="2" title="المؤشرات العامة وتحليل المفردات" />
        <TwoColumnTable rows={[
          ['درجة الطالب', `${result.summary.studentScore} من ${result.summary.totalScore}`],
          ['النسبة', `${result.summary.percent}%`],
          ['مستوى الطالب', result.level.label],
          ['نوع الخطة', result.level.planType],
          ['حد النجاح', `${result.summary.passCutoffPercent}%`],
          ['حد الإتقان', `${result.summary.masteryCutoffPercent}% = ${formatCutoffScoreForReport(result)}`],
          ['حد التميز', `${result.summary.excellenceCutoffPercent}%`],
          ['الفجوة عن الإتقان', `${result.summary.gapToMasteryPoints} درجة`],
          ['المفردات الصحيحة', result.itemStatus.correctCount],
          ['المفردات الجزئية', result.itemStatus.partialCount],
          ['المفردات الخاطئة', result.itemStatus.wrongCount],
          ['المفردات المتروكة', result.itemStatus.omittedCount],
        ]} />
        <FullQuestionsTable result={result} />
      </section>

      <section className="report-page-break">
        <SectionTitle number="3" title="تحليل المهارات وتصنيف الأسئلة ومستوياتها" />
        <FullSkillsTable result={result} />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <GroupTable title="الأداء حسب تصنيف السؤال" rows={result.questionCategories} />
          <GroupTable title="الأداء حسب مستوى السؤال" rows={result.questionLevels} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Narrative title="قراءة تصنيف السؤال" text={result.narratives.questionTypeReading} />
          <Narrative title="قراءة مستوى السؤال" text={result.narratives.questionLevelReading} />
        </div>
      </section>

      <section className="report-page-break">
        <SectionTitle number="4" title="أنماط الأخطاء وملاحظات المعلم" />
        <ErrorPatternsTable result={result} />
        <TeacherNotesTable result={result} />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Narrative title="مؤشر التشخيص" text={result.narratives.diagnosisIndicator} />
          <Narrative title="ملاحظات المعلم بوصفها دليلًا داعمًا" text={result.narratives.teacherNotesReading} />
        </div>
        <div className="individual-report-diagnosis-chart mt-3">
          <ErrorPatternsChart result={result} compact />
        </div>
      </section>

      <section className="report-page-break firefox-compact-charts individual-firefox-charts-page">
        <SectionTitle number="5" title="الرسوم البيانية التوثيقية" />
        <div className="individual-report-charts-grid mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <StudentMasteryPositionChart result={result} compact />
          <ItemStatusChart result={result} compact />
          <TopLossItemsChart result={result} compact />
          <SkillPerformanceChart result={result} compact />
          <QuestionCategoryPerformanceChart result={result} compact />
          <QuestionLevelPerformanceChart result={result} compact />
        </div>
      </section>

      <section className="report-page-break firefox-tight-section individual-firefox-final-page">
        <SectionTitle number="6" title="القرار والخطة وإعادة القياس" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Narrative title="القرار التربوي" text={result.narratives.proposedAction} />
          <Narrative title="رسالة إلى الطالب" text={result.plan.studentMessage} />
          <Narrative title="دليل التحسن" text={result.plan.evidenceOfImprovement} />
        </div>
        <PriorityTable priorities={result.priorities} />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <ListBox title="دور الطالب" items={result.plan.studentActions} />
          <ListBox title="دور المعلم / المدرسة" items={result.plan.teacherRole} />
          <ListBox title="دور ولي الأمر" items={result.plan.parentRole} />
        </div>
        <SignatureSection />
      </section>
    </article>
  );
}

function MiniItemsTable({ items }: { items: ValidatedQuestionResult[] }) {
  return (
    <div className="report-section overflow-hidden rounded-2xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black text-slate-900">أعلى المفردات فقدًا</h3>
      <table className="individual-report-table w-full text-xs">
        <thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">المفردة</th><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الفقد</th></tr></thead>
        <tbody>{items.length ? items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-2 py-1.5 font-bold">{item.label}</td><td className="px-2 py-1.5">{item.skill}</td><td className="px-2 py-1.5">{item.percent}%</td><td className="px-2 py-1.5">{item.loss}</td></tr>) : <tr><td colSpan={4} className="px-2 py-3 text-slate-500">لا توجد مفردات ذات فقد.</td></tr>}</tbody>
      </table>
    </div>
  );
}

function MiniSkillsTable({ result, skills }: { result: IndividualPerformanceAnalysisResult; skills: IndividualPerformanceAnalysisResult['skills'] }) {
  return (
    <div className="report-section overflow-hidden rounded-2xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black text-slate-900">خلاصة المهارات</h3>
      <table className="individual-report-table w-full text-xs">
        <thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الحكم</th></tr></thead>
        <tbody>{skills.map((skill) => <tr key={skill.skill} className="border-t border-slate-100"><td className="px-2 py-1.5">{skill.skill}</td><td className="px-2 py-1.5">{skill.percent}%</td><td className="px-2 py-1.5">{skill.judgement}</td></tr>)}</tbody>
      </table>
      <p className="px-3 py-2 text-[10px] leading-5 text-slate-500">حد الإتقان المعتمد: {result.summary.masteryCutoffPercent}%.</p>
    </div>
  );
}

function FullQuestionsTable({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <div className="report-section mt-4 overflow-hidden rounded-xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black">تفصيل أداء المفردات</h3>
      <div className="individual-report-table-scroll overflow-x-auto">
        <table className="individual-report-table individual-full-questions-table w-full min-w-[900px] text-[10px]">
          <colgroup>
            <col className="w-[6%]" /><col className="w-[10%]" /><col className="w-[17%]" /><col className="w-[9%]" />
            <col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[6%]" /><col className="w-[17%]" /><col className="w-[19%]" />
          </colgroup>
          <thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">المفردة</th><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">التصنيف</th><th className="px-2 py-1.5 text-right">المستوى</th><th className="px-2 py-1.5 text-right">الدرجة</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الفقد</th><th className="px-2 py-1.5 text-right">نوع الخطأ</th><th className="px-2 py-1.5 text-right">ملاحظة المعلم</th></tr></thead>
          <tbody>{result.questions.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-2 py-1.5 font-bold">{item.label}</td><td className="px-2 py-1.5">{item.skill}</td><td className="px-2 py-1.5">{item.questionCategory}</td><td className="px-2 py-1.5">{item.questionLevel}</td><td className="px-2 py-1.5">{item.score} من {item.maxScore}</td><td className="px-2 py-1.5">{item.percent}%</td><td className="px-2 py-1.5">{item.loss}</td><td className="px-2 py-1.5">{formatErrorTypeForReport(item)}</td><td className="px-2 py-1.5">{item.teacherNote || '—'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function FullSkillsTable({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <div className="report-section mt-3 overflow-hidden rounded-xl border border-slate-200">
      <table className="individual-report-table w-full text-xs">
        <thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">عدد المفردات</th><th className="px-2 py-1.5 text-right">الدرجة</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الفقد</th><th className="px-2 py-1.5 text-right">الحكم</th><th className="px-2 py-1.5 text-right">حدود القراءة</th></tr></thead>
        <tbody>{result.skills.map((skill) => <tr key={skill.skill} className="border-t border-slate-100"><td className="px-2 py-1.5 font-bold">{skill.skill}</td><td className="px-2 py-1.5">{skill.questionCount}</td><td className="px-2 py-1.5">{skill.score} من {skill.maxScore}</td><td className="px-2 py-1.5">{skill.percent}%</td><td className="px-2 py-1.5">{skill.loss}</td><td className="px-2 py-1.5">{skill.judgement}</td><td className="px-2 py-1.5">{skill.representationNote}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function GroupTable({ title, rows }: { title: string; rows: GroupPerformanceResult[] }) {
  return (
    <div className="report-section overflow-hidden rounded-xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black">{title}</h3>
      <table className="individual-report-table w-full text-xs"><thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">الفئة</th><th className="px-2 py-1.5 text-right">عدد المفردات</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الفقد</th><th className="px-2 py-1.5 text-right">الحكم</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key} className="border-t border-slate-100"><td className="px-2 py-1.5 font-bold">{row.label}</td><td className="px-2 py-1.5">{row.questionCount}</td><td className="px-2 py-1.5">{row.percent}%</td><td className="px-2 py-1.5">{row.loss}</td><td className="px-2 py-1.5">{row.judgement}</td></tr>)}</tbody></table>
    </div>
  );
}

function ErrorPatternsTable({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <div className="report-section mt-3 overflow-hidden rounded-xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black">أنماط الأخطاء المرمزة</h3>
      <table className="individual-report-table w-full text-xs"><thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">نوع الخطأ</th><th className="px-2 py-1.5 text-right">التكرار</th><th className="px-2 py-1.5 text-right">النسبة</th><th className="px-2 py-1.5 text-right">المفردات</th><th className="px-2 py-1.5 text-right">المهارات</th></tr></thead><tbody>{result.errorPatterns.length ? result.errorPatterns.map((pattern) => <tr key={pattern.errorType} className="border-t border-slate-100"><td className="px-2 py-1.5 font-bold">{pattern.errorType}</td><td className="px-2 py-1.5">{pattern.count}</td><td className="px-2 py-1.5">{pattern.percent}%</td><td className="px-2 py-1.5">{pattern.questionLabels.join('، ')}</td><td className="px-2 py-1.5">{pattern.skills.join('، ')}</td></tr>) : <tr><td colSpan={5} className="px-2 py-3 text-slate-500">لا توجد أنماط خطأ مرمزة كافية.</td></tr>}</tbody></table>
    </div>
  );
}

function TeacherNotesTable({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <div className="report-section mt-4 overflow-hidden rounded-xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black">ملاحظات المعلم الداعمة للتشخيص</h3>
      <table className="individual-report-table w-full text-xs"><thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">المفردة</th><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">نوع الخطأ</th><th className="px-2 py-1.5 text-right">الملاحظة</th></tr></thead><tbody>{result.teacherNotes.length ? result.teacherNotes.map((note) => <tr key={note.questionId} className="border-t border-slate-100"><td className="px-2 py-1.5 font-bold">{note.questionLabel}</td><td className="px-2 py-1.5">{note.skill}</td><td className="px-2 py-1.5">{note.percent}%</td><td className="px-2 py-1.5">{note.errorType}</td><td className="px-2 py-1.5">{note.note}</td></tr>) : <tr><td colSpan={5} className="px-2 py-3 text-slate-500">لم تُدخل ملاحظات للمعلم.</td></tr>}</tbody></table>
    </div>
  );
}

function PriorityTable({ priorities }: { priorities: InterventionPriority[] }) {
  return (
    <div className="report-section mt-4 overflow-hidden rounded-xl border border-slate-200">
      <h3 className="bg-slate-100 px-3 py-2 text-xs font-black">ترتيب أولويات المتابعة</h3>
      <table className="individual-report-table w-full text-xs"><thead className="bg-slate-900 text-white"><tr><th className="px-2 py-1.5 text-right">الترتيب</th><th className="px-2 py-1.5 text-right">المهارة</th><th className="px-2 py-1.5 text-right">الأداء</th><th className="px-2 py-1.5 text-right">الفقد</th><th className="px-2 py-1.5 text-right">سبب الترتيب</th></tr></thead><tbody>{priorities.length ? priorities.map((priority) => <tr key={priority.skill} className="border-t border-slate-100"><td className="px-2 py-1.5">{priority.rank}</td><td className="px-2 py-1.5 font-bold">{priority.skill}</td><td className="px-2 py-1.5">{priority.percent}%</td><td className="px-2 py-1.5">{priority.loss}</td><td className="px-2 py-1.5">{priority.reason}</td></tr>) : <tr><td colSpan={5} className="px-2 py-3 text-slate-500">لا توجد أولويات كافية.</td></tr>}</tbody></table>
    </div>
  );
}

function TwoColumnTable({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return <div className="report-section mt-3 grid grid-cols-1 gap-1.5 md:grid-cols-2">{rows.map(([label, value]) => <InfoCell key={label} label={label} value={value} />)}</div>;
}

function LimitationsNote({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return <div className="report-section mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-6 text-blue-950">{result.narratives.limitationsNote}</div>;
}

function MissingDataNotice({ result }: { result: IndividualPerformanceAnalysisResult }) {
  const missing = [
    ['اسم الطالب', result.context.studentName],
    ['المدرسة', result.context.schoolName],
    ['المادة', result.context.subject],
    ['الصف', result.context.grade],
    ['عنوان الورقة', result.context.paperTitle],
    ['اسم المعلم', result.context.teacherName],
  ].filter(([label, value]) => isMissingReportField(label, value));
  if (!missing.length) return null;
  return <section className="report-section mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">تنبيه اعتماد: توجد بيانات تعريفية غير مكتملة ({missing.map(([label]) => label).join('، ')}). يفضل إكمالها قبل الطباعة الرسمية النهائية.</section>;
}

function SignatureSection() {
  const labels = ['ولي الأمر', 'المعلم', 'المعلم الأول / المشرف', 'إدارة المدرسة'];
  return <div className="signature-section mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">{labels.map((label) => <div key={label} className="rounded-xl border border-slate-200 p-2 text-center"><p className="text-xs font-black text-slate-800">{label}</p><div className="mt-5 border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-500">الاسم والتوقيع</div></div>)}</div>;
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return <div className="report-section"><h2 className="text-base font-black text-slate-950"><span className="ml-1.5 text-slate-400">{number}.</span>{title}</h2></div>;
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-0.5 text-xs font-black text-slate-900">{displayValue(value)}</p></div>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="mt-0.5 text-sm font-black text-slate-950">{value}</p></div>;
}

function Narrative({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return <div className={`report-section mt-3 rounded-xl border border-slate-200 bg-slate-50 ${compact ? 'p-2' : 'p-3'} text-xs leading-6 text-slate-700`}><p className="font-black text-slate-900">{title}</p><p className="mt-1">{text}</p></div>;
}

function ListBox({ title, items }: { title: string; items: string[] }) {
  return <div className="report-section rounded-xl border border-slate-200 bg-white p-2"><p className="mb-1 text-xs font-black text-slate-900">{title}</p><ul className="space-y-0.5 text-xs leading-5 text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>;
}

function PrintStyles() {
  return (
    <UnifiedPrintStyles
      noPrintClassName="individual-performance-no-print"
      dataPrintTargets={[
        { value: 'individual-performance-executive', areaId: 'individual-performance-executive-report' },
        { value: 'individual-performance-detailed', areaId: 'individual-performance-detailed-report' },
      ]}
      pageMarginMm={9}
      fontSizePx={9.6}
      lineHeight={1.38}
      extraCss={`
        #individual-performance-executive-report,
        #individual-performance-detailed-report { direction: rtl; }
        #individual-performance-executive-report .signature-section,
        #individual-performance-detailed-report .signature-section { margin-top: 8px !important; }
        .unified-chart-card { break-inside: avoid !important; page-break-inside: avoid !important; }
        .recharts-tooltip-wrapper { display: none !important; }
        #individual-performance-executive-report .individual-report-table-scroll,
        #individual-performance-detailed-report .individual-report-table-scroll { overflow: visible !important; }
        #individual-performance-executive-report .individual-report-table-scroll::-webkit-scrollbar,
        #individual-performance-detailed-report .individual-report-table-scroll::-webkit-scrollbar { display: none !important; }
        #individual-performance-executive-report .individual-report-table,
        #individual-performance-detailed-report .individual-report-table {
          width: 100% !important;
          min-width: 0 !important;
          table-layout: fixed !important;
        }
        #individual-performance-executive-report .individual-report-table th,
        #individual-performance-executive-report .individual-report-table td,
        #individual-performance-detailed-report .individual-report-table th,
        #individual-performance-detailed-report .individual-report-table td {
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: normal !important;
        }
        #individual-performance-detailed-report .individual-full-questions-table { font-size: 8.2px !important; }
        #individual-performance-detailed-report .individual-full-questions-table th,
        #individual-performance-detailed-report .individual-full-questions-table td { padding: 3px 4px !important; line-height: 1.3 !important; }
        #individual-performance-detailed-report .individual-report-charts-grid .unified-chart-card { padding: 8px !important; border-radius: 14px !important; }
        #individual-performance-detailed-report .individual-report-charts-grid .unified-chart-card h3 { font-size: 11px !important; }
        #individual-performance-detailed-report .individual-report-charts-grid .unified-chart-card p { font-size: 8.5px !important; line-height: 1.35 !important; }
        #individual-performance-detailed-report .individual-report-diagnosis-chart { max-width: 50% !important; margin-right: auto !important; }
        #individual-performance-detailed-report .individual-report-diagnosis-chart .unified-chart-card { padding: 8px !important; border-radius: 14px !important; }
        #individual-performance-detailed-report .individual-report-diagnosis-chart .unified-chart-card h3 { font-size: 11px !important; }
        #individual-performance-detailed-report .individual-report-diagnosis-chart .unified-chart-card p { font-size: 8.5px !important; line-height: 1.35 !important; }

        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-firefox-charts-page {
          font-size: 8.3px !important;
          line-height: 1.22 !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 5px !important;
          align-items: start !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .unified-chart-card {
          padding: 5px !important;
          border-radius: 10px !important;
          min-height: 0 !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .unified-chart-card > div:first-child {
          margin-bottom: 2px !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .unified-chart-card h3 {
          font-size: 9px !important;
          line-height: 1.15 !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .unified-chart-card p {
          margin-top: 1px !important;
          font-size: 6.9px !important;
          line-height: 1.15 !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .horizontal-chart-shell,
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .horizontal-chart-labels,
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .horizontal-chart-canvas,
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .recharts-responsive-container {
          height: 112px !important;
          min-height: 112px !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .horizontal-chart-labels {
          width: 88px !important;
          padding-top: 7px !important;
          padding-bottom: 18px !important;
          font-size: 8px !important;
          line-height: 1.1 !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .mt-2,
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .mt-3 {
          margin-top: 2px !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .gap-2,
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-report-charts-grid .gap-3 {
          gap: 3px !important;
        }
        html[data-print-browser="firefox"] #individual-performance-detailed-report .individual-firefox-final-page .signature-section > div > div:last-child {
          margin-top: 12px !important;
        }
      `}
    />
  );
}

function formatErrorTypeForReport(item: { score: number | string; maxScore: number | string; errorType?: React.ReactNode }): React.ReactNode {
  const score = Number(item.score);
  const maxScore = Number(item.maxScore);
  const raw = item.errorType;
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (Number.isFinite(score) && Number.isFinite(maxScore) && score >= maxScore) return 'إجابة متقنة';
  if (!text || text === 'لا ينطبق' || text === 'إجابة متقنة' || text === 'غير محدد' || text === '—') return 'لم يرمز نوع الخطأ';
  return raw;
}

function formatCutoffScoreForReport(result: IndividualPerformanceAnalysisResult): string {
  const score = result.summary.masteryCutoffScore;
  const roundedUp = Math.ceil(score);
  if (Math.abs(score - roundedUp) < 0.000001) return `${score} من ${result.summary.totalScore}`;
  return `${score}، أي نحو ${roundedUp} من ${result.summary.totalScore}`;
}

function isMissingReportField(label: string, value: React.ReactNode): boolean {
  const text = String(value ?? '').trim();
  if (!text || text === 'غير محدد' || text === '—' || text === 'لم يحدد') return true;
  if (label === 'المدرسة' && (text === 'المدرسة' || text === 'اسم المدرسة')) return true;
  if (label === 'اسم الطالب' && text === 'اسم الطالب') return true;
  if (label === 'اسم المعلم' && (text === 'المعلم' || text === 'اسم المعلم')) return true;
  return false;
}

function displaySchoolName(value: React.ReactNode): React.ReactNode {
  return isMissingReportField('المدرسة', value) ? 'لم يحدد' : value;
}

function displayValue(value: React.ReactNode) {
  if (value === null || value === undefined || value === '') return 'لم يحدد';
  const text = String(value).trim();
  if (!text || text === '—' || text === 'غير محدد') return 'لم يحدد';
  return value;
}
