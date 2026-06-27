import React, { useEffect, useMemo, useState } from 'react';
import { ItemLossChart, ItemPerformanceChart, ReliabilityBadgeChart, SkillBalanceChart, SkillPerformanceChart, ZeroRateChart } from './charts';
import {
  ANALYSIS_METHOD_OPTIONS,
  ASSESSMENT_TYPE_OPTIONS,
  DEFAULT_CONTEXT,
  DEFAULT_ITEM_COUNT,
  DEFAULT_SAMPLE_SIZE,
  EDUCATION_DIRECTORATE_OPTIONS,
  GRADE_OPTIONS,
  SAMPLE_SELECTION_OPTIONS,
  SKILL_OPTIONS,
  SUBJECT_OPTIONS,
} from './constants';
import { createDefaultItems, createDefaultSampleRows, evaluateSampleReliability, recommendedSampleSize, runExamItemsSampleAnalysis, validateAnalysisReadiness } from './analytics';
import { ExamItemsSampleReports } from './report';
import { clearWorkspace, getAutosaveTimestamp, loadWorkspace, saveWorkspace } from '../shared/workspaceAutosave';
import { PrintableResultTab } from '../shared/PrintableResultTab';
import { DiagnosticDecisionCard } from '../shared/DiagnosticCards';
import { FishboneDiagnosticCard } from '../shared/FishboneDiagnostic';
import { ParetoChart } from '../shared/ParetoChart';
import { RadarSkillChart } from '../shared/RadarSkillChart';
import { MobileNumberInput, type MobileNumericValue } from '../shared/MobileNumberInput';
import type { AnalysisReadinessResult, ExamItemDefinition, ExamItemsSampleAnalysisResult, ExamItemsSampleContext, SampleScoreRow } from './types';
import { getCurrentAcademicYear, getTodayISO } from './utils';

const TABS = [
  { id: 'context', title: 'بيانات الورقة والعينة', desc: 'رأس التقرير والعينة' },
  { id: 'items', title: 'بناء المفردات', desc: 'الأسئلة والمهارات' },
  { id: 'scores', title: 'إدخال درجات العينة', desc: 'درجات الأوراق' },
  { id: 'summary', title: 'ملخص التحليل', desc: 'المتوسط والقرار' },
  { id: 'analysis', title: 'تحليل المفردات والمهارات', desc: 'الفقد والتوازن' },
  { id: 'reports', title: 'التقرير الختامي', desc: 'تقرير تفصيلي' },
] as const;

type TabId = typeof TABS[number]['id'];


const WORKSPACE_KEY = 'bosla.workspace.examItemSampleAnalysis.v1';

type ExamItemsSampleStoredWorkspace = {
  version: 1;
  activeTab: TabId;
  context: ExamItemsSampleContext;
  itemCount: number;
  items: ExamItemDefinition[];
  sampleRows: SampleScoreRow[];
  hadResult: boolean;
  savedAt: string;
};

type ExamItemsSampleInitialWorkspace = {
  activeTab: TabId;
  context: ExamItemsSampleContext;
  itemCount: number;
  items: ExamItemDefinition[];
  sampleRows: SampleScoreRow[];
  result: ExamItemsSampleAnalysisResult | null;
};

function isTabId(value: unknown): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function isExamItemsSampleStoredWorkspace(value: unknown): value is ExamItemsSampleStoredWorkspace {
  const data = value as ExamItemsSampleStoredWorkspace;
  return Boolean(
    data &&
      data.version === 1 &&
      isTabId(data.activeTab) &&
      data.context &&
      Array.isArray(data.items) &&
      Array.isArray(data.sampleRows)
  );
}

function createFreshExamItemsSampleWorkspace(): ExamItemsSampleInitialWorkspace {
  const freshContext = createDefaultContext();
  const freshItems = createDefaultItems(DEFAULT_ITEM_COUNT);
  return {
    activeTab: 'context',
    context: freshContext,
    itemCount: DEFAULT_ITEM_COUNT,
    items: freshItems,
    sampleRows: createDefaultSampleRows(freshContext.sampleSize || DEFAULT_SAMPLE_SIZE, freshItems),
    result: null,
  };
}

function loadInitialExamItemsSampleWorkspace(): ExamItemsSampleInitialWorkspace {
  const fresh = createFreshExamItemsSampleWorkspace();
  const saved = loadWorkspace<ExamItemsSampleStoredWorkspace | null>(WORKSPACE_KEY, null, (value): value is ExamItemsSampleStoredWorkspace | null => value === null || isExamItemsSampleStoredWorkspace(value));
  if (!saved) return fresh;

  const itemCount = Number.isFinite(Number(saved.itemCount)) && Number(saved.itemCount) > 0 ? Number(saved.itemCount) : saved.items.length || fresh.itemCount;
  const restoredItems = saved.items.length ? saved.items : fresh.items;
  const restoredRows = saved.sampleRows.length ? saved.sampleRows : createDefaultSampleRows(saved.context.sampleSize || DEFAULT_SAMPLE_SIZE, restoredItems);
  let restoredResult: ExamItemsSampleAnalysisResult | null = null;

  if (saved.hadResult) {
    try {
      restoredResult = runExamItemsSampleAnalysis(saved.context, restoredItems, restoredRows);
    } catch {
      restoredResult = null;
    }
  }

  const resultTabs: TabId[] = ['summary', 'analysis', 'reports'];
  return {
    activeTab: resultTabs.includes(saved.activeTab) && !restoredResult ? 'scores' : saved.activeTab,
    context: saved.context,
    itemCount,
    items: restoredItems,
    sampleRows: restoredRows,
    result: restoredResult,
  };
}

function createDefaultContext(): ExamItemsSampleContext {
  return {
    ...DEFAULT_CONTEXT,
    academicYear: getCurrentAcademicYear(),
    analysisDate: getTodayISO(),
  };
}

export function ExamItemsSampleAnalysisViews() {
  const [initialWorkspace] = useState(() => loadInitialExamItemsSampleWorkspace());
  const [activeTab, setActiveTab] = useState<TabId>(initialWorkspace.activeTab);
  const [context, setContext] = useState<ExamItemsSampleContext>(initialWorkspace.context);
  const [itemCount, setItemCount] = useState(initialWorkspace.itemCount);
  const [items, setItems] = useState<ExamItemDefinition[]>(initialWorkspace.items);
  const [sampleRows, setSampleRows] = useState<SampleScoreRow[]>(initialWorkspace.sampleRows);
  const [result, setResult] = useState<ExamItemsSampleAnalysisResult | null>(initialWorkspace.result);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const reliabilityPreview = useMemo(() => evaluateSampleReliability(context.totalPapers, context.sampleSize, context.sampleSelectionMethod), [context.totalPapers, context.sampleSize, context.sampleSelectionMethod]);
  const paperTotalScore = useMemo(() => items.reduce((sum, item) => sum + Number(item.maxScore || 0), 0), [items]);
  const analysisReadiness = useMemo(
    () => validateAnalysisReadiness(context, items, sampleRows),
    [context, items, sampleRows],
  );


  useEffect(() => {
    saveWorkspace<ExamItemsSampleStoredWorkspace>(WORKSPACE_KEY, {
      version: 1,
      activeTab,
      context,
      itemCount,
      items,
      sampleRows,
      hadResult: Boolean(result),
      savedAt: getAutosaveTimestamp(),
    });
  }, [activeTab, context, itemCount, items, sampleRows, result]);

  const clearSavedWorkspace = () => {
    clearWorkspace(WORKSPACE_KEY);
    const fresh = createFreshExamItemsSampleWorkspace();
    setActiveTab(fresh.activeTab);
    setContext(fresh.context);
    setItemCount(fresh.itemCount);
    setItems(fresh.items);
    setSampleRows(fresh.sampleRows);
    setResult(null);
    setAnalysisError(null);
  };

  const invalidateAnalysis = () => {
    setResult(null);
    setAnalysisError(null);
  };

  const updateContext = <K extends keyof ExamItemsSampleContext>(key: K, value: ExamItemsSampleContext[K]) => {
    setContext((prev) => ({ ...prev, [key]: value }));
    invalidateAnalysis();
  };

  const updateItems: React.Dispatch<React.SetStateAction<ExamItemDefinition[]>> = (action) => {
    setItems(action);
    invalidateAnalysis();
  };

  const updateSampleRows: React.Dispatch<React.SetStateAction<SampleScoreRow[]>> = (action) => {
    setSampleRows(action);
    invalidateAnalysis();
  };

  const rebuildItems = () => {
    const nextItems = createDefaultItems(itemCount);
    setItems(nextItems);
    setSampleRows(createDefaultSampleRows(context.sampleSize || DEFAULT_SAMPLE_SIZE, nextItems));
    invalidateAnalysis();
    setActiveTab('items');
  };

  const rebuildSampleRows = () => {
    setSampleRows(createDefaultSampleRows(context.sampleSize || DEFAULT_SAMPLE_SIZE, items));
    invalidateAnalysis();
    setActiveTab('scores');
  };

  const runAnalysis = () => {
    const readiness = validateAnalysisReadiness(context, items, sampleRows);
    if (!readiness.valid) {
      setResult(null);
      setAnalysisError(readiness.issues.map((issue) => issue.message).join(' '));
      setActiveTab('scores');
      return;
    }

    try {
      const nextResult = runExamItemsSampleAnalysis(context, items, sampleRows);
      setResult(nextResult);
      setAnalysisError(null);
      setActiveTab('summary');
    } catch (error) {
      setResult(null);
      setAnalysisError(error instanceof Error ? error.message : 'تعذر تشغيل التحليل بسبب خطأ غير متوقع.');
      setActiveTab('scores');
    }
  };

  return (
    <section dir="rtl" className="mw-track mw-track-exam space-y-6">
      {activeTab === 'context' ? (
        <PathHeader result={result} />
      ) : (
        <CompactTabHeader activeTab={activeTab} result={result} />
      )}
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} hasResult={!!result} />

      {activeTab === 'context' && <ContextTab context={context} updateContext={updateContext} reliability={reliabilityPreview} itemCount={itemCount} setItemCount={setItemCount} rebuildItems={rebuildItems} clearSavedWorkspace={clearSavedWorkspace} />}
      {activeTab === 'items' && <ItemsTab items={items} setItems={updateItems} paperTotalScore={paperTotalScore} itemCount={itemCount} setItemCount={setItemCount} rebuildItems={rebuildItems} />}
      {activeTab === 'scores' && <ScoresTab items={items} rows={sampleRows} setRows={updateSampleRows} rebuildSampleRows={rebuildSampleRows} runAnalysis={runAnalysis} readiness={analysisReadiness} analysisError={analysisError} />}
      {activeTab === 'summary' && <RequireResult result={result}><PrintableResultTab sectionId="exam-items-summary-tab" context={{ directorate: result!.context.educationDirectorate, schoolName: result!.context.schoolName, teacherName: result!.context.teacherName, trackLabel: 'بوصلة الإتقان — تحليل مفردات الورقة', title: 'ملخص تحليل مفردات الورقة', fields: [{ label: 'المادة', value: result!.context.subject }, { label: 'الصف', value: result!.context.grade }, { label: 'الورقة', value: result!.context.paperTitle }] }}><SummaryTab result={result!} /></PrintableResultTab></RequireResult>}
      {activeTab === 'analysis' && <RequireResult result={result}><PrintableResultTab sectionId="exam-items-analysis-tab" context={{ directorate: result!.context.educationDirectorate, schoolName: result!.context.schoolName, teacherName: result!.context.teacherName, trackLabel: 'بوصلة الإتقان — تحليل مفردات الورقة', title: 'تحليل المفردات والمهارات', fields: [{ label: 'المادة', value: result!.context.subject }, { label: 'الصف', value: result!.context.grade }, { label: 'الورقة', value: result!.context.paperTitle }] }}><AnalysisTab result={result!} /></PrintableResultTab></RequireResult>}
      {activeTab === 'reports' && <RequireResult result={result}><ExamItemsSampleReports result={result!} /></RequireResult>}
    </section>
  );
}

function PathHeader({ result }: { result: ExamItemsSampleAnalysisResult | null }) {
  return (
    <section className="mw-track-hero mw-track-hero--exam rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[#F6D38A]">مسار مستقل لتحليل مفردات الورقة من عينة</p>
          <h1 className="mt-2 text-2xl font-black md:text-3xl">تحليل مفردات الورقة الامتحانية</h1>
          <p className="mt-3 max-w-3xl leading-8 text-slate-200">
            يحلل هذا المسار عينة من أوراق الطلبة لرصد أداء المفردات والمهارات، وقراءة توازن الورقة، وإنتاج تقرير تفصيلي توثيقي شامل لملف الإنجاز.
          </p>
        </div>
        {result && (
          <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
            <div className="text-sm text-slate-200">متوسط أداء المفردات</div>
            <div className="mt-1 text-2xl font-black">{result.summary.averagePaperPercent}%</div>
            <div className="mt-1 text-sm text-slate-200">{result.reliability.label}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function CompactTabHeader({ activeTab, result }: { activeTab: TabId; result: ExamItemsSampleAnalysisResult | null }) {
  const tab = TABS.find((item) => item.id === activeTab) ?? TABS[0];
  return (
    <section className="mw-compact-header rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black text-[#7C4A03]">تحليل مفردات الورقة من عينة</p>
          <h1 className="mt-1 text-xl font-black text-slate-950">{tab.title}</h1>
          <p className="mt-1 text-sm leading-7 text-slate-500">{tab.desc}</p>
        </div>
        {result ? (
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-2">
              <div className="text-[11px] font-bold text-slate-500">متوسط المفردات</div>
              <div className="mt-1 text-sm font-black text-slate-900">{result.summary.averagePaperPercent}%</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2">
              <div className="text-[11px] font-bold text-slate-500">اكتمال البيانات</div>
              <div className="mt-1 text-sm font-black text-slate-900">{result.dataCompleteness.completionPercent}%</div>
            </div>
            <div className="col-span-2 rounded-2xl bg-slate-50 px-4 py-2 sm:col-span-1">
              <div className="text-[11px] font-bold text-slate-500">موثوقية القراءة</div>
              <div className="mt-1 text-xs font-black text-slate-900">{result.reliability.label}</div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TabNav({ activeTab, setActiveTab, hasResult }: { activeTab: TabId; setActiveTab: (id: TabId) => void; hasResult: boolean }) {
  return (
    <nav className="mw-analysis-steps grid grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm md:grid-cols-3 xl:grid-cols-6">
      {TABS.map((tab) => {
        const locked = !hasResult && !['context', 'items', 'scores'].includes(tab.id);
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={locked}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl px-3 py-3 text-right transition ${active ? 'bg-slate-900 text-white shadow-sm' : locked ? 'cursor-not-allowed bg-slate-50 text-slate-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            <div className="text-sm font-black">{tab.title}</div>
            <div className={`mt-1 text-xs ${active ? 'text-slate-200' : 'text-slate-400'}`}>{tab.desc}</div>
          </button>
        );
      })}
    </nav>
  );
}


function buildSampleGuidance(totalPapers: number, sampleSize: number, selectionMethod: string) {
  const validTotal = Number.isFinite(totalPapers) && totalPapers > 0 ? Math.floor(totalPapers) : 0;
  const validSample = Number.isFinite(sampleSize) && sampleSize > 0 ? Math.floor(sampleSize) : 0;
  if (!validTotal) {
    return {
      initialMin: 0,
      strongMin: 0,
      sizeMessage: 'أدخل إجمالي عدد الأوراق ليظهر إرشاد حجم العينة المناسب.',
      selectionMessage: 'يفضل أن تمثل العينة مستويات الأداء المختلفة في الصف: مرتفع، متوسط، ومنخفض.',
      tone: 'slate' as const,
    };
  }

  const initialMin = Math.min(validTotal, Math.max(10, Math.ceil(validTotal * 0.2)));
  const strongMin = Math.min(validTotal, Math.max(15, Math.ceil(validTotal * 0.3)));
  const fullText = `للحكم النهائي الأقوى على الورقة، يبقى تحليل جميع الأوراق (${validTotal}) هو الخيار الأعلى ثقة.`;

  let sizeMessage = '';
  let tone: 'emerald' | 'amber' | 'red' | 'slate' = 'slate';
  if (validTotal <= 10) {
    sizeMessage = `العدد الكلي للأوراق (${validTotal}) قليل؛ يفضل تحليل جميع الأوراق بدل اختيار عينة جزئية.`;
    tone = validSample >= validTotal ? 'emerald' : 'amber';
  } else if (!validSample) {
    sizeMessage = `للقراءة الأولية، يُفضل ألا تقل العينة عن ${initialMin} أوراق. وللقراءة الأقوى، يُفضل ${strongMin} أوراق أو أكثر متى كان ذلك ممكنًا. ${fullText}`;
    tone = 'slate';
  } else if (validSample >= validTotal) {
    sizeMessage = `العينة الحالية تشمل جميع الأوراق (${validTotal})؛ وهذا يعطي أعلى مستوى ثقة داخل مجتمع التحليل المحدد.`;
    tone = 'emerald';
  } else if (validSample < initialMin) {
    sizeMessage = `العينة الحالية (${validSample}) أقل من الحد الإرشادي للقراءة الأولية (${initialMin}). تُستخدم النتائج للاستئناس فقط، ويفضل توسيع العينة قبل بناء حكم نهائي. ${fullText}`;
    tone = 'red';
  } else if (validSample < strongMin) {
    sizeMessage = `العينة الحالية (${validSample}) تبلغ حد القراءة الأولية (${initialMin})، لكنها دون مستوى القراءة الأقوى المقترح (${strongMin}). تُقرأ النتائج بحذر مع مراعاة تمثيل مستويات الأداء. ${fullText}`;
    tone = 'amber';
  } else {
    sizeMessage = `العينة الحالية (${validSample}) مناسبة لدعم قراءة تربوية أقوى، بشرط أن تكون ممثلة لمستويات الأداء المختلفة. ${fullText}`;
    tone = 'emerald';
  }

  const biasedSelection = ['أوراق متاحة فقط', 'اختيار يدوي من المعلم', 'من شعبة واحدة', 'أخرى'].includes(selectionMethod);
  const selectionMessage = biasedSelection
    ? 'تنبيه اختيار العينة: الطريقة المحددة قد تجعل العينة متحيزة. للحصول على قراءة أصدق، اختر أوراقًا تمثل المستويات الثلاثة: مرتفع، متوسط، ومنخفض، ويفضل الاختيار داخل كل مستوى بشكل عشوائي أو شبه عشوائي.'
    : 'إرشاد اختيار العينة: للحصول على قراءة تربوية أصدق، يُفضل أن تمثل العينة مستويات الأداء المختلفة في الصف: مرتفع، متوسط، ومنخفض. لا يُنصح بالاعتماد على أوراق المرتفعين والمنخفضين فقط إلا إذا كان الهدف فحص قدرة المفردة على التمييز بين المستويات.';

  return { initialMin, strongMin, sizeMessage, selectionMessage, tone };
}

function SampleGuidanceNotice({ context }: { context: ExamItemsSampleContext }) {
  const guidance = buildSampleGuidance(context.totalPapers, context.sampleSize, context.sampleSelectionMethod);
  const toneClass = guidance.tone === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : guidance.tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-900'
      : guidance.tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-slate-200 bg-slate-50 text-slate-800';
  return (
    <div className={`rounded-2xl border p-4 text-sm leading-7 ${toneClass}`}>
      <div className="font-black">إرشاد حجم العينة وطريقة اختيارها</div>
      <p className="mt-1">{guidance.sizeMessage}</p>
      <p className="mt-2">{guidance.selectionMessage}</p>
      <p className="mt-2 text-xs font-bold opacity-80">هذا الإرشاد لا يمنع التحليل، لكنه يوضح قوة القراءة وحدود تفسير النتائج قبل الطباعة الرسمية.</p>
    </div>
  );
}

function ContextTab({ context, updateContext, reliability, itemCount, setItemCount, rebuildItems, clearSavedWorkspace }: { context: ExamItemsSampleContext; updateContext: <K extends keyof ExamItemsSampleContext>(key: K, value: ExamItemsSampleContext[K]) => void; reliability: ReturnType<typeof evaluateSampleReliability>; itemCount: number; setItemCount: (value: number) => void; rebuildItems: () => void; clearSavedWorkspace: () => void }) {
  const suggested = recommendedSampleSize(context.totalPapers);
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card title="بيانات التقرير والورقة" desc="أدخل بيانات رأس التقرير والورقة قبل بناء المفردات." className="xl:col-span-2">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select label="مديرية التعليم" value={context.educationDirectorate} options={EDUCATION_DIRECTORATE_OPTIONS} onChange={(value) => updateContext('educationDirectorate', value)} />
          <Input label="اسم المدرسة" value={context.schoolName} onChange={(value) => updateContext('schoolName', value)} />
          <Select label="المادة" value={context.subject} options={SUBJECT_OPTIONS} onChange={(value) => updateContext('subject', value)} />
          <Select label="الصف" value={context.grade} options={GRADE_OPTIONS} onChange={(value) => updateContext('grade', value)} />
          <Input label="عنوان الورقة" value={context.paperTitle} onChange={(value) => updateContext('paperTitle', value)} />
          <Select label="نوع أداة القياس" value={context.assessmentType} options={ASSESSMENT_TYPE_OPTIONS} onChange={(value) => updateContext('assessmentType', value)} />
          <Input label="اسم المعلم" value={context.teacherName} onChange={(value) => updateContext('teacherName', value)} />
          <ReadOnly label="العام الدراسي" value={context.academicYear} />
          <ReadOnly label="تاريخ التحليل" value={context.analysisDate} />
          <NumberInput label="حد الإتقان %" value={context.masteryCutoffPercent} onChange={(value) => updateContext('masteryCutoffPercent', value)} />
        </div>
      </Card>

      <Card title="مجتمع التحليل والعينة" desc="حدد مجتمع التحليل وحجم العينة وموثوقية القراءة.">
        <div className="space-y-3">
          <NumberInput label="إجمالي عدد الأوراق" value={context.totalPapers} onChange={(value) => updateContext('totalPapers', value)} />
          <Select label="طريقة التحليل" value={context.analysisMethod} options={ANALYSIS_METHOD_OPTIONS} onChange={(value) => updateContext('analysisMethod', value)} />
          <NumberInput label="عدد أوراق العينة" value={context.sampleSize} onChange={(value) => updateContext('sampleSize', value)} />
          <Select label="طريقة اختيار العينة" value={context.sampleSelectionMethod} options={SAMPLE_SELECTION_OPTIONS} onChange={(value) => updateContext('sampleSelectionMethod', value)} />
          <SampleGuidanceNotice context={context} />
        </div>
      </Card>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr,240px,220px] lg:items-end">
          <div>
            <h3 className="text-base font-black text-slate-900">إجراءات بداية المسار</h3>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              حدّد عدد مفردات الورقة ثم أنشئ جدول المفردات. اقتراح النظام الحالي يقارب {suggested} ورقة، وموثوقية القراءة: {reliability.label} بنسبة عينة {reliability.samplePercent}%.
            </p>
            {reliability.warning ? <p className="mt-1 text-sm font-bold leading-7 text-amber-700">{reliability.warning}</p> : null}
          </div>
          <NumberInput label="عدد مفردات الورقة" value={itemCount} onChange={setItemCount} />
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button type="button" onClick={rebuildItems} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700">إنشاء جدول المفردات</button>
            <button type="button" onClick={clearSavedWorkspace} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:border-red-400">بدء تحليل جديد</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ItemsTab({ items, setItems, paperTotalScore, itemCount, setItemCount, rebuildItems }: { items: ExamItemDefinition[]; setItems: React.Dispatch<React.SetStateAction<ExamItemDefinition[]>>; paperTotalScore: number; itemCount: number; setItemCount: (value: number) => void; rebuildItems: () => void }) {
  const updateItem = <K extends keyof ExamItemDefinition>(index: number, key: K, value: ExamItemDefinition[K]) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };
  return (
    <Card title="بناء المفردات" desc={`الدرجة الكلية المحسوبة للورقة: ${paperTotalScore}`}>
      <p className="mb-3 text-sm leading-7 text-slate-600">تبدأ خلية درجة المفردة فارغة، ويكتبها المعلم يدويًا. يجب أن تكون الدرجة 0.5 فأكثر، وتتدرج بمقدار 0.5، ولا تقبل الصفر أو القيم السالبة.</p>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <NumberInput label="عدد المفردات" value={itemCount} onChange={setItemCount} />
        <button type="button" onClick={rebuildItems} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">إعادة بناء الجدول</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[620px] w-full text-sm">
          <thead className="bg-slate-900 text-white"><tr>{['المفردة', 'الدرجة', 'المهارة'].map((head) => <th key={head} className="px-3 py-2 text-right">{head}</th>)}</tr></thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-2 py-2"><Input compact value={item.label} onChange={(value) => updateItem(index, 'label', value)} /></td>
                <td className="px-2 py-2"><HalfStepScoreInput value={item.maxScore} onChange={(value) => updateItem(index, 'maxScore', value)} /></td>
                <td className="px-2 py-2"><Select compact value={item.skill} options={SKILL_OPTIONS} onChange={(value) => updateItem(index, 'skill', value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ScoresTab({
  items,
  rows,
  setRows,
  rebuildSampleRows,
  runAnalysis,
  readiness,
  analysisError,
}: {
  items: ExamItemDefinition[];
  rows: SampleScoreRow[];
  setRows: React.Dispatch<React.SetStateAction<SampleScoreRow[]>>;
  rebuildSampleRows: () => void;
  runAnalysis: () => void;
  readiness: AnalysisReadinessResult;
  analysisError: string | null;
}) {
  const issueByCell = useMemo(() => {
    return new Map(readiness.cellIssues.map((issue) => [`${issue.rowId}:${issue.itemId}`, issue]));
  }, [readiness.cellIssues]);

  const updateScore = (rowIndex: number, itemId: string, value: string) => {
    setRows((prev) => prev.map((row, i) => i === rowIndex
      ? { ...row, scores: { ...row.scores, [itemId]: value === '' ? '' : Number(value) } }
      : row));
  };

  const remainingCells = readiness.emptyCells + readiness.invalidCells;
  const statusClass = readiness.valid
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <Card title="إدخال درجات العينة" desc="لا تستخدم أسماء الطلبة؛ كل صف يمثل ورقة من العينة. الصفر درجة صحيحة، أما الخلية الفارغة فتمنع بدء التحليل.">
      <div className={`mb-4 rounded-2xl border p-4 ${statusClass}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-black">
              {readiness.valid ? 'جدول الدرجات مكتمل وجاهز للتحليل' : 'التحليل متوقف حتى اكتمال جميع الدرجات'}
            </div>
            <div className="mt-1 text-sm font-bold">
              تم إدخال {readiness.completedCells} من {readiness.totalCells} خلية صحيحة
              {!readiness.valid ? `، والمتبقي أو غير الصالح ${remainingCells} خلية.` : '.'}
            </div>
          </div>
          <div className="rounded-xl bg-white/70 px-3 py-2 text-sm font-black">
            {readiness.totalCells > 0 ? Math.round((readiness.completedCells / readiness.totalCells) * 100) : 0}% مكتمل
          </div>
        </div>

        {!readiness.valid ? (
          <div className="mt-3 space-y-2 text-sm">
            {readiness.issues.slice(0, 5).map((issue, index) => (
              <p key={`${issue.scope}-${index}`} className="font-bold">• {issue.message}</p>
            ))}
            {readiness.cellIssues.slice(0, 8).map((issue) => (
              <p key={`${issue.rowId}-${issue.itemId}`} className="text-xs">• {issue.message}</p>
            ))}
            {readiness.cellIssues.length > 8 ? (
              <p className="text-xs font-bold">• توجد {readiness.cellIssues.length - 8} خلايا أخرى تحتاج إلى استكمال أو تصحيح.</p>
            ) : null}
          </div>
        ) : null}

        {analysisError ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{analysisError}</p> : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={rebuildSampleRows} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">إعادة إنشاء جدول العينة</button>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={!readiness.valid}
          className={`rounded-xl px-5 py-2 text-sm font-bold text-white ${readiness.valid ? 'bg-blue-700 hover:bg-blue-800' : 'cursor-not-allowed bg-slate-300'}`}
        >
          تشغيل تحليل المفردات
        </button>
      </div>
      <div className="max-h-[520px] overflow-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-900 text-white"><tr><th className="px-3 py-2 text-right">الورقة</th>{items.map((item) => <th key={item.id} className="px-3 py-2 text-center">{item.label}<div className="text-[10px] text-slate-300">من {item.maxScore || '—'}</div></th>)}</tr></thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-2 font-bold">{row.label}</td>
                {items.map((item) => {
                  const issue = issueByCell.get(`${row.id}:${item.id}`);
                  const inputClass = issue?.type === 'empty'
                    ? 'border-amber-300 bg-amber-50/50 focus:border-amber-500'
                    : issue
                      ? 'border-red-400 bg-red-50 focus:border-red-600'
                      : 'border-slate-200 bg-white focus:border-blue-500';
                  return (
                    <td key={item.id} className="px-2 py-2 text-center">
                      <MobileNumberInput
                        compact
                        value={row.scores[item.id] ?? ''}
                        min={0}
                        max={typeof item.maxScore === 'number' ? item.maxScore : undefined}
                        step="any"
                        align="center"
                        onChange={(value) => updateScore(rowIndex, item.id, value === '' ? '' : String(value))}
                        inputClassName={`w-20 rounded-lg border px-2 py-1 text-center outline-none ${inputClass}`}
                        ariaInvalid={Boolean(issue && issue.type !== 'empty')}
                        title={issue?.message ?? `${row.label}، ${item.label}: من 0 إلى ${item.maxScore || '—'}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryTab({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="متوسط أداء المفردات" value={`${result.summary.averagePaperPercent}%`} />
        <Metric label="متوسط الدرجة المرصودة" value={`${result.summary.averagePaperScore} من ${result.summary.paperTotalScore}`} />
        <Metric label="الفقد الكلي" value={result.summary.totalLoss} />
        <Metric label="اكتمال البيانات" value={`${result.dataCompleteness.completionPercent}%`} />
        <Metric label="موثوقية القراءة" value={result.reliability.label} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><ReliabilityBadgeChart result={result} /><ItemPerformanceChart result={result} /></div>
      <NarrativeBox title="اكتمال بيانات العينة" text={`${result.dataCompleteness.label}: ${result.dataCompleteness.message}${result.dataCompleteness.warning ? ` ${result.dataCompleteness.warning}` : ''}`} />
      <NarrativeBox title="قراءة عامة" text={result.decision.overallReading} />
      <DecisionTab result={result} />
    </div>
  );
}

function AnalysisTab({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="space-y-6">
      <ItemAnalysisTab result={result} />
      <SkillAnalysisTab result={result} />
      <BalanceTab result={result} />
      <DiagnosticInsightsTab result={result} />
    </div>
  );
}

function DiagnosticInsightsTab({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="space-y-4">
      <DiagnosticDecisionCard decision={result.diagnostics.decision} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ParetoChart title="باريتو الفقد حسب المفردات" description="يرتب المفردات حسب مساهمتها في الفقد الكلي لتحديد نقطة البدء." entries={result.diagnostics.itemLossPareto} valueLabel="الفقد" />
        <ParetoChart title="باريتو الفقد حسب المهارات" description="يوضح المهارات الأكثر مساهمة في الفقد داخل العينة." entries={result.diagnostics.skillLossPareto} valueLabel="الفقد" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RadarSkillChart data={result.diagnostics.skillRadar} title="رادار أداء المهارات" description="يعرض صورة عامة لتوازن أداء المهارات في العينة." />
        <FishboneDiagnosticCard diagnostic={result.diagnostics.fishbone} />
      </div>
    </div>
  );
}


function ItemAnalysisTab({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><ItemPerformanceChart result={result} /><ItemLossChart result={result} /><ZeroRateChart result={result} /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DataTable
          title="أقل المفردات أداءً"
          headers={['المفردة', 'المهارة', 'الأداء', 'الفقد', 'الأولوية']}
          rows={result.decision.lowestPerformanceItems.map((item) => [item.label, item.skill, `${item.performancePercent}%`, item.totalLoss, item.priority])}
        />
        <DataTable
          title="أعلى المفردات فقدًا"
          headers={['المفردة', 'المهارة', 'الفقد', 'الأداء', 'الأولوية']}
          rows={result.decision.highestLossItems.map((item) => [item.label, item.skill, item.totalLoss, `${item.performancePercent}%`, item.priority])}
        />
      </div>
      <DataTable headers={['المفردة', 'المهارة', 'الأداء', 'الفقد', 'صفر', 'كاملة', 'الأولوية']} rows={result.items.map((item) => [item.label, item.skill, `${item.performancePercent}%`, item.totalLoss, `${item.zeroPercent}%`, `${item.fullPercent}%`, item.priority])} />
    </div>
  );
}

function SkillAnalysisTab({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="space-y-4">
      <SkillPerformanceChart result={result} />
      <DataTable headers={['المهارة', 'عدد المفردات', 'الأداء', 'الفقد', 'الحكم', 'التوصية']} rows={result.skills.map((skill) => [skill.skill, skill.itemCount, `${skill.performancePercent}%`, skill.totalLoss, skill.judgement, skill.recommendation])} />
    </div>
  );
}

function BalanceTab({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="space-y-4">
      <NarrativeBox title="قراءة توازن المهارات" text={result.balanceReading.skillReading} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><SkillBalanceChart result={result} /><BalanceData title="توازن المهارات" rows={result.skillBalance} /></div>
    </div>
  );
}

function DecisionTab({ result }: { result: ExamItemsSampleAnalysisResult }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <NarrativeBox title="القرار التدريسي" text={result.decision.teachingDecision} />
      <NarrativeBox title="مراجعة الورقة" text={result.decision.paperReviewDecision} />
      <Card title="التوصيات" desc="توصيات عملية بناءً على العينة."><ul className="space-y-2 text-sm leading-7 text-slate-700">{result.decision.recommendations.map((item) => <li key={item}>• {item}</li>)}</ul></Card>
      <Card title="الخطوات التالية" desc="إجراءات مقترحة للمتابعة."><ul className="space-y-2 text-sm leading-7 text-slate-700">{result.decision.nextSteps.map((item) => <li key={item}>• {item}</li>)}</ul></Card>
    </div>
  );
}

function BalanceData({ title, rows }: { title: string; rows: Array<{ name: string; itemCount: number; scoreWeight: number; scoreWeightPercent: number }> }) {
  return <DataTable headers={['الفئة', 'عدد المفردات', 'وزن الدرجات', 'النسبة']} rows={rows.map((row) => [row.name, row.itemCount, row.scoreWeight, `${row.scoreWeightPercent}%`])} title={title} />;
}

function RequireResult({ result, children }: { result: ExamItemsSampleAnalysisResult | null; children: React.ReactNode }) {
  if (!result) return <Card title="لم يتم تشغيل التحليل بعد" desc="أكمل بناء المفردات وإدخال درجات العينة ثم شغل التحليل."><div className="text-sm text-slate-600">ستظهر النتائج هنا بعد التحليل.</div></Card>;
  return <>{children}</>;
}

function Card({ title, desc, children, className = '' }: { title: string; desc?: string; children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}><h2 className="text-lg font-black text-slate-900">{title}</h2>{desc ? <p className="mb-4 mt-1 text-sm text-slate-500">{desc}</p> : null}{children}</div>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"><div className="text-xs font-bold text-slate-500">{label}</div><div className="mt-1 text-xl font-black text-slate-900">{value}</div></div>;
}

function NarrativeBox({ title, text }: { title: string; text: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-2 font-black text-slate-900">{title}</h3><p className="whitespace-pre-line text-sm leading-7 text-slate-700">{text}</p></div>;
}

function DataTable({ headers, rows, title }: { headers: string[]; rows: Array<Array<React.ReactNode>>; title?: string }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{title ? <h3 className="bg-slate-100 px-4 py-3 font-black text-slate-900">{title}</h3> : null}<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-900 text-white"><tr>{headers.map((head) => <th key={head} className="px-3 py-2 text-right">{head}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-slate-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div></div>;
}

function Input({ label, value, onChange, compact }: { label?: string; value: string; onChange: (value: string) => void; compact?: boolean }) {
  return <label className="block text-sm"><span className={compact ? 'sr-only' : 'mb-1 block font-bold text-slate-600'}>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm"><span className="mb-1 block font-bold text-slate-600">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" /></label>;
}

function HalfStepScoreInput({ value, onChange }: { value: number | ''; onChange: (value: number | '') => void }) {
  return (
    <MobileNumberInput
      compact
      value={value}
      min={0.5}
      step={0.5}
      placeholder="اكتب الدرجة"
      onChange={(nextValue) => onChange(nextValue)}
      inputClassName="w-full rounded-xl border border-slate-200 px-3 py-2"
    />
  );
}

function NumberInput({ label, value, onChange, compact, min, step }: { label?: string; value: number; onChange: (value: number) => void; compact?: boolean; min?: number; step?: number }) {
  return (
    <MobileNumberInput
      label={label}
      compact={compact}
      value={value}
      min={min}
      step={step}
      onChange={(nextValue: MobileNumericValue) => {
        if (typeof nextValue === 'number') onChange(nextValue);
      }}
      inputClassName="w-full rounded-xl border border-slate-200 px-3 py-2"
    />
  );
}

function Select({ label, value, options, onChange, compact }: { label?: string; value: string; options: string[]; onChange: (value: string) => void; compact?: boolean }) {
  return <label className="block text-sm"><span className={compact ? 'sr-only' : 'mb-1 block font-bold text-slate-600'}>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><div className="font-bold text-slate-500">{label}</div><div className="font-black text-slate-900">{value}</div></div>;
}

export default ExamItemsSampleAnalysisViews;
