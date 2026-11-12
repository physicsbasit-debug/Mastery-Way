import React, { useEffect, useMemo, useState } from 'react';
import {
  MasterySpreadValidationError,
  runMasterySpreadAnalysis,
  validateMasterySpreadReadiness,
} from './analytics';
import {
  ASSESSMENT_TYPE_OPTIONS,
  DEFAULT_DEEP_GAP_MARGIN,
  DEFAULT_EXPECTED_STUDENT_COUNT,
  DEFAULT_MASTERY_CUTOFF_PERCENT,
  DEFAULT_NEAR_MASTERY_MARGIN,
  DEFAULT_TOTAL_SCORE,
  EDUCATION_DIRECTORATE_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  GROUP_DESCRIPTION_OPTIONS,
  SUBJECT_OPTIONS,
  getAcademicYearFromDate,
  getLocalDateString,
} from './constants';
import {
  DistributionAroundMasteryChart,
  GapToNextLevelChart,
  MasteryScaleBar,
  MasteryVsNonMasteryChart,
  MeanMedianCutoffChart,
  ScoresHistogramChart,
} from './charts';
import { MasterySpreadReportView } from './report';
import type {
  MasterySpreadAnalysisResult,
  MasterySpreadContext,
  MasterySpreadReadiness,
  MasterySpreadSettings,
  NumericInputValue,
} from './types';
import { clearWorkspace, getAutosaveTimestamp, loadWorkspace, saveWorkspace } from '../shared/workspaceAutosave';
import { PrintableResultTab } from '../shared/PrintableResultTab';
import { DiagnosticDecisionCard } from '../shared/DiagnosticCards';
import { FishboneDiagnosticCard } from '../shared/FishboneDiagnostic';
import { ParetoChart } from '../shared/ParetoChart';
import { MobileNumberInput } from '../shared/MobileNumberInput';
import { toLatinDigits } from '../shared/numberFormat';
import { InsightNarrativeCard, PremiumMetricCard, PremiumPanel, StatusBadge } from '../shared/DashboardElements';
import { AnalysisStepAccordion } from '../shared/AnalysisStepAccordion';

 type TabKey = 'input' | 'overview' | 'charts' | 'gap' | 'decision' | 'plan' | 'report';
const WORKSPACE_KEY = 'bosla.workspace.masterySpread.v2';
const TABS: Array<{ key: TabKey; label: string; description: string }> = [
  { key: 'input', label: 'إدخال البيانات', description: 'الدرجات والإعدادات' },
  { key: 'overview', label: 'الحكم العام', description: 'انتشار الإتقان والحكم' },
  { key: 'charts', label: 'الرسوم والتحليلات', description: 'توزيع المجموعة بصريًا' },
  { key: 'gap', label: 'قراءة الفجوة', description: 'المستوى التالي والهدف' },
  { key: 'decision', label: 'القرار التربوي', description: 'نوع التدخل والتوصيات' },
  { key: 'plan', label: 'الخطة المقترحة', description: 'خطة جماعية عملية' },
  { key: 'report', label: 'التقرير الختامي', description: 'تقرير تفصيلي' },
];
const SAMPLE_TEXT = `38\n34\n30\n27\n25\n40\n33\n29\n31\n22\n18\n35`;

export interface MasterySpreadViewsProps {
  className?: string;
  initialRawScoresText?: string;
  onAnalysisChange?: (result: MasterySpreadAnalysisResult | null) => void;
}

type StoredWorkspace = {
  version: 2;
  activeTab: TabKey;
  rawScoresText: string;
  settings: MasterySpreadSettings;
  context: MasterySpreadContext;
  hadResult: boolean;
  savedAt: string;
};

function createFreshSettings(): MasterySpreadSettings {
  return {
    totalScore: DEFAULT_TOTAL_SCORE,
    masteryCutoffPercent: DEFAULT_MASTERY_CUTOFF_PERCENT,
    nearMasteryMargin: DEFAULT_NEAR_MASTERY_MARGIN,
    deepGapMargin: DEFAULT_DEEP_GAP_MARGIN,
    expectedStudentCount: DEFAULT_EXPECTED_STUDENT_COUNT,
    decimalPlaces: 1,
  };
}

function createFreshContext(): MasterySpreadContext {
  return {
    educationDirectorate: '', schoolName: '', teacherName: '', academicYear: getAcademicYearFromDate(), analysisDate: getLocalDateString(),
    groupDescription: '', subject: '', grade: '', assessmentName: '',
  };
}

function isTabKey(value: unknown): value is TabKey { return TABS.some((tab) => tab.key === value); }
function isStoredWorkspace(value: unknown): value is StoredWorkspace {
  const data = value as StoredWorkspace;
  return Boolean(data && data.version === 2 && isTabKey(data.activeTab) && typeof data.rawScoresText === 'string' && data.settings && data.context);
}

function loadInitial(initialRawScoresText: string) {
  const fresh = { activeTab: 'input' as TabKey, rawScoresText: initialRawScoresText, settings: createFreshSettings(), context: createFreshContext(), result: null as MasterySpreadAnalysisResult | null };
  const saved = loadWorkspace<StoredWorkspace | null>(WORKSPACE_KEY, null, (value): value is StoredWorkspace | null => value === null || isStoredWorkspace(value));
  if (!saved) return fresh;
  const context = { ...saved.context, academicYear: saved.context.academicYear || getAcademicYearFromDate(), analysisDate: saved.context.analysisDate || getLocalDateString() };
  let result: MasterySpreadAnalysisResult | null = null;
  if (saved.hadResult) {
    try { result = runMasterySpreadAnalysis({ rawScoresText: saved.rawScoresText, settings: saved.settings, context }); } catch { result = null; }
  }
  return { activeTab: saved.activeTab !== 'input' && !result ? 'input' as TabKey : saved.activeTab, rawScoresText: saved.rawScoresText, settings: saved.settings, context, result };
}

export default function MasterySpreadViews(props: MasterySpreadViewsProps) { return <MasterySpreadSection {...props} />; }

export function MasterySpreadSection({ className = '', initialRawScoresText = '', onAnalysisChange }: MasterySpreadViewsProps) {
  const [initial] = useState(() => loadInitial(initialRawScoresText));
  const [activeTab, setActiveTab] = useState<TabKey>(initial.activeTab);
  const [rawScoresText, setRawScoresText] = useState(initial.rawScoresText);
  const [settings, setSettings] = useState<MasterySpreadSettings>(initial.settings);
  const [context, setContext] = useState<MasterySpreadContext>(initial.context);
  const [result, setResult] = useState<MasterySpreadAnalysisResult | null>(initial.result);
  const [statusMessage, setStatusMessage] = useState('');

  const readiness = useMemo(() => validateMasterySpreadReadiness({ rawScoresText, settings, context }), [rawScoresText, settings, context]);

  useEffect(() => {
    saveWorkspace<StoredWorkspace>(WORKSPACE_KEY, { version: 2, activeTab, rawScoresText, settings, context, hadResult: Boolean(result), savedAt: getAutosaveTimestamp() });
  }, [activeTab, rawScoresText, settings, context, result]);

  const invalidateResult = (message = 'تم تعديل بيانات التحليل. أعد تشغيل التحليل لتحديث النتائج.') => {
    if (result) {
      setResult(null);
      onAnalysisChange?.(null);
      setActiveTab('input');
      setStatusMessage(message);
    }
  };

  const updateSetting = (key: keyof MasterySpreadSettings, value: NumericInputValue) => {
    invalidateResult();
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateContext = (key: keyof MasterySpreadContext, value: string) => {
    setContext((current) => ({ ...current, [key]: value }));
    setResult((current) => current ? { ...current, context: { ...current.context, [key]: value.trim() || 'غير محدد' } } : current);
  };

  const handleScoresChange = (value: string) => { invalidateResult(); setRawScoresText(toLatinDigits(value)); };

  const handleAnalyze = () => {
    setStatusMessage('');
    if (!readiness.validation.valid) {
      setActiveTab('input');
      setStatusMessage(readiness.validation.issues[0]?.message || 'صحح البيانات قبل بدء التحليل.');
      return;
    }
    const currentContext = { ...context, academicYear: getAcademicYearFromDate(), analysisDate: getLocalDateString() };
    setContext(currentContext);
    try {
      const next = runMasterySpreadAnalysis({ rawScoresText, settings, context: currentContext });
      setResult(next);
      onAnalysisChange?.(next);
      setActiveTab('overview');
    } catch (error) {
      const message = error instanceof MasterySpreadValidationError ? error.message : 'تعذر تشغيل التحليل. راجع البيانات وحاول مجددًا.';
      setResult(null); onAnalysisChange?.(null); setActiveTab('input'); setStatusMessage(message);
    }
  };

  const handleReset = () => {
    clearWorkspace(WORKSPACE_KEY);
    setRawScoresText(initialRawScoresText); setSettings(createFreshSettings()); setContext(createFreshContext());
    setResult(null); setStatusMessage(''); setActiveTab('input'); onAnalysisChange?.(null);
  };

  const handleUseSample = () => {
    invalidateResult();
    setRawScoresText(SAMPLE_TEXT);
    setSettings((current) => ({ ...current, totalScore: 40, masteryCutoffPercent: 75, expectedStudentCount: 12 }));
  };

  return (
    <main dir="rtl" className={`mw-track mw-track-mastery space-y-5 text-right ${className}`}>
      {activeTab === 'input' ? <Hero result={result} /> : <TabHeader tab={TABS.find((tab) => tab.key === activeTab) ?? TABS[0]} result={result} />}
      <div className="mastery-spread-no-print">
        <AnalysisStepAccordion
          items={TABS.map(({ key, label, description }) => ({ id: key, label, description }))}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as TabKey)}
          isLocked={(id) => id !== 'input' && !result}
          label="خطوات تحليل انتشار الإتقان"
        />
      </div>
      {activeTab === 'input' && <InputTab rawScoresText={rawScoresText} onScoresChange={handleScoresChange} settings={settings} updateSetting={updateSetting} context={context} updateContext={updateContext} readiness={readiness} statusMessage={statusMessage} onAnalyze={handleAnalyze} onReset={handleReset} onUseSample={handleUseSample} />}
      {result && activeTab === 'overview' && <PrintableResultTab sectionId="mastery-overview-tab" context={buildPrintableContext(result, 'الحكم العام')}><OverviewTab result={result} /></PrintableResultTab>}
      {result && activeTab === 'charts' && <PrintableResultTab sectionId="mastery-charts-tab" context={buildPrintableContext(result, 'الرسوم والتحليلات')}><ChartsTab result={result} /></PrintableResultTab>}
      {result && activeTab === 'gap' && <PrintableResultTab sectionId="mastery-gap-tab" context={buildPrintableContext(result, 'قراءة الفجوة')}><GapTab result={result} /></PrintableResultTab>}
      {result && activeTab === 'decision' && <PrintableResultTab sectionId="mastery-decision-tab" context={buildPrintableContext(result, 'القرار التربوي')}><DecisionTab result={result} /></PrintableResultTab>}
      {result && activeTab === 'plan' && <PrintableResultTab sectionId="mastery-plan-tab" context={buildPrintableContext(result, 'الخطة المقترحة')}><PlanTab result={result} /></PrintableResultTab>}
      {result && activeTab === 'report' && <MasterySpreadReportView result={result} />}
    </main>
  );
}


function buildPrintableContext(result: MasterySpreadAnalysisResult, title: string) {
  return {
    directorate: result.context.educationDirectorate,
    schoolName: result.context.schoolName,
    teacherName: result.context.teacherName,
    trackLabel: 'بوصلة الإتقان — تحليل انتشار الإتقان',
    title,
    fields: [
      { label: 'المادة', value: result.context.subject },
      { label: 'الصف', value: result.context.grade },
      { label: 'المجموعة', value: result.context.groupDescription },
      { label: 'أداة القياس', value: result.context.assessmentName },
    ],
  };
}

function Hero({ result }: { result: MasterySpreadAnalysisResult | null }) {
  return <section className="mw-track-hero mw-track-hero--mastery rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-bold text-[#F6D38A]">مسار جماعي مستقل</p><h1 className="mt-2 text-2xl font-black md:text-3xl">تحليل انتشار الإتقان</h1><p className="mt-3 max-w-3xl leading-8 text-slate-200">تحليل جماعي للدرجات النهائية يحدد نسبة انتشار الإتقان والحكم والفجوة والقرار والخطة دون أسماء أو توصيات فردية.</p></div>{result ? <div className="rounded-2xl bg-white/10 p-4 text-center"><div className="text-sm text-slate-200">الحكم الحالي</div><div className="mt-1 text-2xl font-black">{result.judgement.label}</div><div className="mt-1 text-sm text-slate-200">{result.summary.masterySpreadPercent}% انتشار الإتقان</div></div> : null}</div></section>;
}

function TabHeader({ tab, result }: { tab: { label: string; description: string }; result: MasterySpreadAnalysisResult | null }) {
  return <section className="mw-compact-header rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black text-[#263B80]">تحليل انتشار الإتقان</p><h2 className="mt-1 text-2xl font-black text-slate-950">{tab.label}</h2><p className="mt-1 text-sm text-slate-500">{tab.description}</p></div>{result ? <div className="grid grid-cols-3 gap-2"><MiniStat label="الانتشار" value={`${result.summary.masterySpreadPercent}%`} /><MiniStat label="الحكم" value={result.judgement.label} /><MiniStat label="المتقنون" value={result.summary.masteryCount} /></div> : null}</div></section>;
}

function InputTab({ rawScoresText, onScoresChange, settings, updateSetting, context, updateContext, readiness, statusMessage, onAnalyze, onReset, onUseSample }: {
  rawScoresText: string; onScoresChange: (value: string) => void; settings: MasterySpreadSettings;
  updateSetting: (key: keyof MasterySpreadSettings, value: NumericInputValue) => void;
  context: MasterySpreadContext; updateContext: (key: keyof MasterySpreadContext, value: string) => void;
  readiness: MasterySpreadReadiness; statusMessage: string; onAnalyze: () => void; onReset: () => void; onUseSample: () => void;
}) {
  return <section className="space-y-5">
    <Metadata context={context} updateContext={updateContext} />
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
        <h2 className="text-xl font-black text-slate-900">إدخال الدرجات النهائية</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">الصق الدرجات كسطر لكل درجة أو افصل بينها بفواصل. يقبل الإدخال بالأرقام الهندية ويحوّلها تلقائيًا إلى الأرقام 0-9، كما يدعم الفواصل العربية، ولا تُستخدم أسماء الطلبة.</p>
        <textarea value={rawScoresText} onChange={(event) => onScoresChange(event.target.value)} className="mt-4 min-h-[330px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm outline-none focus:border-slate-400 focus:bg-white" placeholder={`مثال:\n80؛ 75؛ 90\n65\n70`} />
        <ReadinessCard readiness={readiness} statusMessage={statusMessage} />
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={!readiness.validation.valid} onClick={onAnalyze} className={`rounded-2xl px-6 py-3 text-sm font-black text-white shadow-sm ${readiness.validation.valid ? 'bg-emerald-600 hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-300'}`}>تحليل انتشار الإتقان</button>
          <button type="button" onClick={onUseSample} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white">تعبئة مثال</button>
          <button type="button" onClick={onReset} className="rounded-2xl bg-red-50 px-6 py-3 text-sm font-black text-red-700 ring-1 ring-red-200">مسح بيانات المجموعة وبدء تحليل جديد</button>
        </div>
      </div>
      <aside className="space-y-5"><SettingsCard settings={settings} updateSetting={updateSetting} /><div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-xs leading-6 text-blue-950">تُحفظ بيانات العمل مؤقتًا على هذا الجهاز. عند استخدام جهاز مشترك، امسح بيانات المجموعة بعد الانتهاء.</div></aside>
    </div>
  </section>;
}

function ReadinessCard({ readiness, statusMessage }: { readiness: MasterySpreadReadiness; statusMessage: string }) {
  const { validation } = readiness;
  return <div className={`mt-4 rounded-2xl border p-4 ${validation.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="font-black">{validation.valid ? 'بيانات المجموعة مكتملة وجاهزة للتحليل' : 'التحليل متوقف حتى تصحيح البيانات'}</div><div className="mt-1 text-sm">تم التحقق من {validation.validCount} درجة صحيحة. نسبة الاكتمال {validation.completionPercent}%.</div></div><div className="text-xl font-black">{validation.completionPercent}%</div></div>
    {statusMessage ? <p className="mt-3 text-sm font-bold">{statusMessage}</p> : null}
    {validation.issues.length > 0 ? <ul className="mt-3 list-inside list-disc space-y-1 text-sm">{validation.issues.slice(0, 6).map((item) => <li key={`${item.code}-${item.message}`}>{item.message}</li>)}</ul> : null}
    {validation.invalidRecords.length > 0 ? <ul className="mt-2 list-inside list-disc space-y-1 text-xs">{validation.invalidRecords.slice(0, 8).map((record) => <li key={`${record.position}-${record.rawValue}`}>{record.message}</li>)}</ul> : null}
    {validation.warnings.length > 0 ? <ul className="mt-2 list-inside list-disc text-xs">{validation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
  </div>;
}

function SettingsCard({ settings, updateSetting }: { settings: MasterySpreadSettings; updateSetting: (key: keyof MasterySpreadSettings, value: NumericInputValue) => void }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-900">إعدادات التحليل</h3><div className="mt-4 space-y-3">
    <NumberInput label="الدرجة الكلية" value={settings.totalScore} onChange={(value) => updateSetting('totalScore', value)} />
    <NumberInput label="حد الإتقان (%)" value={settings.masteryCutoffPercent} onChange={(value) => updateSetting('masteryCutoffPercent', value)} />
    <NumberInput label="هامش القرب من الإتقان" value={settings.nearMasteryMargin ?? ''} onChange={(value) => updateSetting('nearMasteryMargin', value)} />
    <NumberInput label="هامش الفجوة العميقة" value={settings.deepGapMargin ?? ''} onChange={(value) => updateSetting('deepGapMargin', value)} />
    <NumberInput label="العدد المتوقع للطلبة (اختياري)" value={settings.expectedStudentCount ?? ''} onChange={(value) => updateSetting('expectedStudentCount', value)} />
  </div></div>;
}

function Metadata({ context, updateContext }: { context: MasterySpreadContext; updateContext: (key: keyof MasterySpreadContext, value: string) => void }) {
  return <div className="space-y-5"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">بيانات التقرير</h2><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><SelectInput label="مديرية التعليم" value={context.educationDirectorate || ''} placeholder="اختر المديرية" options={EDUCATION_DIRECTORATE_OPTIONS} onChange={(value) => updateContext('educationDirectorate', value)} /><TextInput label="اسم المدرسة" value={context.schoolName || ''} onChange={(value) => updateContext('schoolName', value)} /><TextInput label="اسم المعلم" value={context.teacherName || ''} onChange={(value) => updateContext('teacherName', value)} /><ReadOnlyInput label="العام الدراسي" value={context.academicYear || getAcademicYearFromDate()} /><ReadOnlyInput label="تاريخ التحليل" value={context.analysisDate || getLocalDateString()} /></div></section>
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">بيانات الاختبار والمجموعة</h2><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><SelectInput label="المادة" value={context.subject || ''} placeholder="اختر المادة" options={SUBJECT_OPTIONS} onChange={(value) => updateContext('subject', value)} /><SelectInput label="الصف" value={context.grade || ''} placeholder="اختر الصف" options={GRADE_LEVEL_OPTIONS} onChange={(value) => updateContext('grade', value)} /><SelectInput label="وصف المجموعة" value={context.groupDescription || ''} placeholder="اختر وصف المجموعة" options={GROUP_DESCRIPTION_OPTIONS} onChange={(value) => updateContext('groupDescription', value)} /><SelectInput label="أداة القياس" value={context.assessmentName || ''} placeholder="اختر نوع الأداة" options={ASSESSMENT_TYPE_OPTIONS} onChange={(value) => updateContext('assessmentName', value)} /></div></section></div>;
}

function OverviewTab({ result }: { result: MasterySpreadAnalysisResult }) {
  return (
    <section className="mw-dashboard-space">
      <div className="mw-dashboard-grid mw-dashboard-grid--five">
        <MetricCard label="عدد الطلبة" value={result.summary.totalStudents} hint={result.dataQuality.label} icon="👥" tone="slate" />
        <MetricCard label="حققوا الإتقان" value={result.summary.masteryCount} hint={`حد الإتقان ${result.summary.masteryCutoffPercent}%`} icon="✓" tone="royal" />
        <MetricCard label="لم يحققوا الإتقان" value={result.summary.nonMasteryCount} hint="حجم الفئة غير المتقنة" icon="△" tone="amber" />
        <MetricCard label="انتشار الإتقان" value={`${result.summary.masterySpreadPercent}%`} hint="المؤشر الرئيس للحكم الجماعي" icon="%" tone="royal" featured />
        <MetricCard label="الحكم" value={<StatusBadge tone={judgementTone(result.judgement.code)}>{result.judgement.label}</StatusBadge>} hint={result.judgement.shortDescription} icon="◆" tone={judgementTone(result.judgement.code)} />
      </div>
      <MasteryScaleBar result={result} />
      <InsightNarrativeCard
        title="قصة انتشار الإتقان في المجموعة"
        text={result.educationalDecision.interpretation}
        footer={<span>جودة البيانات: {result.dataQuality.label} — {result.dataQuality.completenessPercent}% اكتمال</span>}
      />
      <TextCard title="جودة بيانات المجموعة" text={result.dataQuality.interpretation} />
    </section>
  );
}

function ChartsTab({ result }: { result: MasterySpreadAnalysisResult }) {
  return (
    <section className="mw-dashboard-space">
      <PremiumPanel title="لوحة الرسوم والتحليلات" description="قراءة بصرية لتوزيع الدرجات وحركة المجموعة حول حد الإتقان.">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <MasteryVsNonMasteryChart result={result} />
          <DistributionAroundMasteryChart result={result} />
          <ScoresHistogramChart result={result} />
          <MeanMedianCutoffChart result={result} />
        </div>
      </PremiumPanel>
      <InsightNarrativeCard title="قراءة شكل المجموعة" text={result.groupShape.interpretation} tone="violet" />
    </section>
  );
}

function GapTab({ result }: { result: MasterySpreadAnalysisResult }) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <GapToNextLevelChart result={result} />
      <PremiumPanel title="قراءة الفجوة للمستوى التالي" description="كم نحتاج للانتقال من الحكم الحالي إلى المستوى الأعلى؟" tone="amber">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniStat label="الحكم الحالي" value={result.judgement.label} />
          <MiniStat label="النسبة الحالية" value={`${result.gapToNextLevel.currentSpreadPercent}%`} />
          <MiniStat label="المستوى التالي" value={result.gapToNextLevel.nextJudgementLabel || 'لا يوجد مستوى أعلى'} />
          <MiniStat label="الفجوة" value={`${result.gapToNextLevel.gapPoints} نقطة`} />
          <MiniStat label="العدد المطلوب" value={result.gapToNextLevel.requiredMasteryCount ?? 'لا ينطبق'} />
          <MiniStat label="طلبة إضافيون" value={result.gapToNextLevel.additionalStudentsNeeded} />
        </div>
        <p className="mt-5 leading-8 text-slate-700">{result.gapToNextLevel.message}</p>
      </PremiumPanel>
    </section>
  );
}

function DecisionTab({ result }: { result: MasterySpreadAnalysisResult }) {
  return (
    <section className="mw-dashboard-space">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <PremiumPanel title="القرار التربوي" description="نوع التدخل وأولويته بناءً على انتشار الإتقان." tone={judgementTone(result.judgement.code)}>
          <div className="space-y-3">
            <MiniStat label="نوع التدخل" value={result.educationalDecision.decisionLabel} />
            <MiniStat label="أولوية التدخل" value={result.educationalDecision.priorityLabel} />
            <MiniStat label="فرصة التحسن" value={result.groupShape.improvementOpportunity === 'high' ? 'عالية' : result.groupShape.improvementOpportunity === 'medium' ? 'متوسطة' : result.groupShape.improvementOpportunity === 'limited' ? 'محدودة' : 'غير واضحة'} />
          </div>
        </PremiumPanel>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-black">التوصيات الجماعية</h2>
          <p className="mt-3 leading-8 text-slate-700">{result.educationalDecision.interpretation}</p>
          <ul className="mt-4 list-inside list-disc space-y-2 leading-8 text-slate-700">{result.educationalDecision.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-950">{result.educationalDecision.retestRecommendation}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><DiagnosticDecisionCard decision={result.diagnostics.decision} /><ParetoChart title="باريتو فئات الفجوة" description="يرتب فئات غير المتقنين حسب حجمها لتحديد نوع التدخل." entries={result.diagnostics.gapPareto} valueLabel="العدد" /></div>
      <FishboneDiagnosticCard diagnostic={result.diagnostics.fishbone} />
    </section>
  );
}

function PlanTab({ result }: { result: MasterySpreadAnalysisResult }) {
  return (
    <PremiumPanel title={result.proposedPlan.title} description="خطة جماعية مختصرة مرتبطة بالحكم والفجوة." tone="royal">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlanItem label="المدة" value={result.proposedPlan.duration} />
        <PlanItem label="آلية التنفيذ" value={result.proposedPlan.implementationMode} />
        <PlanItem label="أداة القياس" value={result.proposedPlan.assessmentTool} />
        <PlanItem label="معيار النجاح" value={result.proposedPlan.successCriterion} />
        <PlanItem label="المتابعة" value={result.proposedPlan.followUp} />
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-black">الأنشطة المقترحة</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">{result.proposedPlan.activities.map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7">{item}</div>)}</div>
      </div>
    </PremiumPanel>
  );
}


function judgementTone(code: MasterySpreadAnalysisResult['judgement']['code']): 'royal' | 'violet' | 'amber' | 'slate' | 'danger' {
  if (code === 'distinguished' || code === 'good') return 'royal';
  if (code === 'adequate') return 'amber';
  if (code === 'not_adequate' || code === 'rapid_intervention') return 'danger';
  return 'slate';
}

function NumberInput({ label, value, onChange }: { label: string; value: NumericInputValue; onChange: (value: NumericInputValue) => void }) { return <MobileNumberInput label={label} value={value} onChange={onChange} inputClassName="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-400 focus:bg-white" className="block" />; }
function SelectInput({ label, value, options, placeholder, onChange }: { label: string; value: string; options: readonly string[]; placeholder: string; onChange: (value: string) => void }) { return <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></label>; }
function ReadOnlyInput({ label, value }: { label: string; value: string }) { return <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><input value={value} readOnly className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 font-bold" /></label>; }
function MetricCard({ label, value, hint, featured = false, tone = 'royal', icon }: { label: string; value: React.ReactNode; hint: React.ReactNode; featured?: boolean; tone?: 'royal' | 'violet' | 'amber' | 'slate' | 'danger'; icon?: React.ReactNode }) { return <PremiumMetricCard label={label} value={value} hint={hint} featured={featured} tone={tone} icon={icon} />; }
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"><div className="text-xs font-bold text-slate-500">{label}</div><div className="mt-1 text-lg font-black text-slate-950">{value}</div></div>; }
function TextCard({ title, text }: { title: string; text: string }) { return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 leading-8 text-slate-700">{text}</p></div>; }
function PlanItem({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-bold text-slate-500">{label}</div><div className="mt-2 leading-7">{value}</div></div>; }
