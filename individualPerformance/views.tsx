import React, { useEffect, useMemo, useState } from 'react';
import {
  ASSESSMENT_TYPE_OPTIONS,
  EDUCATION_DIRECTORATE_OPTIONS,
  GRADE_OPTIONS,
  SKILL_OPTIONS,
  SUBJECT_OPTIONS,
  TEACHER_NOTE_OPTIONS,
  getErrorTypeOptionsForSkill,
} from './constants';
import {
  createDefaultIndividualContext,
  createDefaultSettings,
  createExamBlueprint,
  createStudentInputsFromBlueprint,
  runIndividualPerformanceAnalysis,
  validateIndividualAnalysisReadiness,
} from './analytics';
import {
  ErrorPatternsChart,
  ItemStatusChart,
  PriorityLineChart,
  SkillLossChart,
  SkillPerformanceChart,
  StudentMasteryPositionChart,
  TopLossItemsChart,
} from './charts';
import { IndividualPerformanceReportView } from './report';
import { clearWorkspace, getAutosaveTimestamp, loadWorkspace, saveWorkspace } from '../shared/workspaceAutosave';
import { PrintableResultTab } from '../shared/PrintableResultTab';
import { DiagnosticDecisionCard } from '../shared/DiagnosticCards';
import { FishboneDiagnosticCard } from '../shared/FishboneDiagnostic';
import { ParetoChart } from '../shared/ParetoChart';
import { RadarSkillChart } from '../shared/RadarSkillChart';
import { MobileNumberInput, type MobileNumericValue } from '../shared/MobileNumberInput';
import { InsightNarrativeCard, PremiumMetricCard, PremiumPanel, StatusBadge } from '../shared/DashboardElements';
import type {
  AnalysisReadinessResult,
  ExamQuestionBlueprint,
  IndividualPerformanceAnalysisResult,
  IndividualPerformanceSettings,
  IndividualPerformanceTab,
  IndividualReportContext,
  StudentQuestionInput,
} from './types';

const DEFAULT_ERROR_TYPE = 'لم يرمز نوع الخطأ';
const WORKSPACE_KEY = 'bosla.workspace.individualPerformance.v1';

const TABS: Array<{ id: IndividualPerformanceTab; label: string; description: string }> = [
  { id: 'student-paper', label: 'بيانات الطالب والورقة', description: 'رأس التقرير والسياق' },
  { id: 'exam-structure', label: 'بناء الأسئلة والمهارات', description: 'المفردات والمهارات' },
  { id: 'student-scores', label: 'إدخال درجات الطالب', description: 'الدرجات والأخطاء' },
  { id: 'overview', label: 'ملخص الأداء', description: 'النسبة والقرار' },
  { id: 'analysis', label: 'تحليل المفردات والمهارات', description: 'الفقد والتشخيص' },
  { id: 'report', label: 'الخطة والتقرير الختامي', description: 'تقرير تفصيلي' },
];

const RESULT_TABS: IndividualPerformanceTab[] = ['overview', 'analysis', 'report'];

type IndividualPerformanceStoredWorkspace = {
  version: 1;
  activeTab: IndividualPerformanceTab | string;
  context: IndividualReportContext;
  settings: IndividualPerformanceSettings;
  questionCount: number;
  blueprint: ExamQuestionBlueprint[];
  studentInputs: StudentQuestionInput[];
  hadResult: boolean;
  savedAt: string;
};

type IndividualPerformanceInitialWorkspace = {
  activeTab: IndividualPerformanceTab;
  context: IndividualReportContext;
  settings: IndividualPerformanceSettings;
  questionCount: number;
  blueprint: ExamQuestionBlueprint[];
  studentInputs: StudentQuestionInput[];
  result: IndividualPerformanceAnalysisResult | null;
};

function normalizeLegacyTab(tab: string): IndividualPerformanceTab {
  if (tab === 'items' || tab === 'skills' || tab === 'diagnosis-plan') return 'analysis';
  if (TABS.some((item) => item.id === tab)) return tab as IndividualPerformanceTab;
  return 'student-paper';
}

function isIndividualPerformanceStoredWorkspace(value: unknown): value is IndividualPerformanceStoredWorkspace {
  const data = value as IndividualPerformanceStoredWorkspace;
  return Boolean(
    data &&
      data.version === 1 &&
      typeof data.activeTab === 'string' &&
      data.context &&
      data.settings &&
      Array.isArray(data.blueprint) &&
      Array.isArray(data.studentInputs),
  );
}

function createFreshIndividualPerformanceWorkspace(): IndividualPerformanceInitialWorkspace {
  const freshBlueprint = createExamBlueprint(10);
  return {
    activeTab: 'student-paper',
    context: createDefaultIndividualContext(),
    settings: createDefaultSettings(),
    questionCount: 10,
    blueprint: freshBlueprint,
    studentInputs: createStudentInputsFromBlueprint(freshBlueprint),
    result: null,
  };
}

function loadInitialIndividualPerformanceWorkspace(): IndividualPerformanceInitialWorkspace {
  const fresh = createFreshIndividualPerformanceWorkspace();
  const saved = loadWorkspace<IndividualPerformanceStoredWorkspace | null>(
    WORKSPACE_KEY,
    null,
    (value): value is IndividualPerformanceStoredWorkspace | null => value === null || isIndividualPerformanceStoredWorkspace(value),
  );
  if (!saved) return fresh;

  const blueprint = saved.blueprint.length ? saved.blueprint : fresh.blueprint;
  const questionCount = Number.isFinite(Number(saved.questionCount)) && Number(saved.questionCount) > 0
    ? Number(saved.questionCount)
    : blueprint.length || fresh.questionCount;
  const studentInputs = saved.studentInputs.length
    ? saved.studentInputs.map((input) => ({ ...input, otherErrorDetail: input.otherErrorDetail || '' }))
    : createStudentInputsFromBlueprint(blueprint);

  let restoredResult: IndividualPerformanceAnalysisResult | null = null;
  if (saved.hadResult) {
    try {
      restoredResult = runIndividualPerformanceAnalysis(saved.context, blueprint, studentInputs, saved.settings);
    } catch {
      restoredResult = null;
    }
  }

  const normalizedTab = normalizeLegacyTab(saved.activeTab);
  const resultRequired = RESULT_TABS.includes(normalizedTab);
  return {
    activeTab: resultRequired && !restoredResult ? 'student-scores' : normalizedTab,
    context: saved.context,
    settings: saved.settings,
    questionCount,
    blueprint,
    studentInputs,
    result: restoredResult,
  };
}

export function IndividualPerformanceViews() {
  const [initialWorkspace] = useState(() => loadInitialIndividualPerformanceWorkspace());
  const [activeTab, setActiveTab] = useState<IndividualPerformanceTab>(initialWorkspace.activeTab);
  const [context, setContext] = useState<IndividualReportContext>(initialWorkspace.context);
  const [settings, setSettings] = useState<IndividualPerformanceSettings>(initialWorkspace.settings);
  const [questionCount, setQuestionCount] = useState(initialWorkspace.questionCount);
  const [blueprint, setBlueprint] = useState<ExamQuestionBlueprint[]>(initialWorkspace.blueprint);
  const [studentInputs, setStudentInputs] = useState<StudentQuestionInput[]>(initialWorkspace.studentInputs);
  const [result, setResult] = useState<IndividualPerformanceAnalysisResult | null>(initialWorkspace.result);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  const totalExamScore = useMemo(
    () => blueprint.reduce((sum, question) => sum + Number(question.maxScore || 0), 0),
    [blueprint],
  );
  const analysisReadiness = useMemo(
    () => validateIndividualAnalysisReadiness(blueprint, studentInputs, settings),
    [blueprint, studentInputs, settings],
  );

  useEffect(() => {
    setResult((current) => (current ? { ...current, context } : current));
  }, [context]);

  useEffect(() => {
    saveWorkspace<IndividualPerformanceStoredWorkspace>(WORKSPACE_KEY, {
      version: 1,
      activeTab,
      context,
      settings,
      questionCount,
      blueprint,
      studentInputs,
      hadResult: Boolean(result?.validation.isValid),
      savedAt: getAutosaveTimestamp(),
    });
  }, [activeTab, context, settings, questionCount, blueprint, studentInputs, result]);

  const clearSavedWorkspace = () => {
    clearWorkspace(WORKSPACE_KEY);
    const fresh = createFreshIndividualPerformanceWorkspace();
    setActiveTab(fresh.activeTab);
    setContext(fresh.context);
    setSettings(fresh.settings);
    setQuestionCount(fresh.questionCount);
    setBlueprint(fresh.blueprint);
    setStudentInputs(fresh.studentInputs);
    setResult(null);
    setAnalysisError(null);
    setAnalysisNotice(null);
  };

  const invalidateAnalysis = () => {
    setResult((previous) => {
      if (previous?.validation.isValid) {
        setAnalysisNotice('تم تعديل بيانات التحليل. أعد تشغيل التحليل لتحديث النتائج.');
      }
      return null;
    });
    setAnalysisError(null);
  };

  const updateSettings: React.Dispatch<React.SetStateAction<IndividualPerformanceSettings>> = (action) => {
    setSettings(action);
    invalidateAnalysis();
  };

  const updateBlueprint: React.Dispatch<React.SetStateAction<ExamQuestionBlueprint[]>> = (action) => {
    setBlueprint(action);
    invalidateAnalysis();
  };

  const updateStudentInputs: React.Dispatch<React.SetStateAction<StudentQuestionInput[]>> = (action) => {
    setStudentInputs(action);
    invalidateAnalysis();
  };

  const rebuildBlueprint = () => {
    const newBlueprint = createExamBlueprint(questionCount);
    setBlueprint(newBlueprint);
    setStudentInputs(createStudentInputsFromBlueprint(newBlueprint));
    setResult(null);
    setAnalysisError(null);
    setAnalysisNotice(null);
    setActiveTab('exam-structure');
  };

  const fillExample = () => {
    const exampleBlueprint: ExamQuestionBlueprint[] = [
      { id: 'q1', label: 'س1', maxScore: 4, skill: 'المعرفة' },
      { id: 'q2', label: 'س2', maxScore: 4, skill: 'الفهم' },
      { id: 'q3', label: 'س3', maxScore: 5, skill: 'التطبيق' },
      { id: 'q4', label: 'س4', maxScore: 3, skill: 'الاستدلال' },
      { id: 'q5', label: 'س5', maxScore: 5, skill: 'القدرات العليا' },
    ];

    setQuestionCount(exampleBlueprint.length);
    setBlueprint(exampleBlueprint);
    setStudentInputs([
      { questionId: 'q1', score: 4, errorType: DEFAULT_ERROR_TYPE, otherErrorDetail: '', teacherNote: 'أداء جيد في هذه المفردة' },
      { questionId: 'q2', score: 2, errorType: 'تفسير غير مكتمل', otherErrorDetail: '', teacherNote: 'أظهر فهمًا جزئيًا للمطلوب' },
      { questionId: 'q3', score: 1, errorType: 'خطأ في تنفيذ خطوات الحل', otherErrorDetail: '', teacherNote: 'يحتاج إلى ترتيب خطوات الحل' },
      { questionId: 'q4', score: 0, errorType: 'خطأ في قراءة المطلوب', otherErrorDetail: '', teacherNote: 'يحتاج إلى قراءة السؤال بتركيز أكبر' },
      { questionId: 'q5', score: 0, errorType: 'ترك السؤال', otherErrorDetail: '', teacherNote: 'يحتاج إلى تشجيع على المحاولة حتى عند عدم التأكد' },
    ]);
    setContext((previous) => ({
      ...previous,
      studentName: 'طالب تجريبي',
      paperTitle: 'اختبار قصير في مهارات تطبيقية',
      schoolName: previous.schoolName || 'مدرسة تجريبية',
      teacherName: previous.teacherName || 'المعلم',
    }));
    setResult(null);
    setAnalysisError(null);
    setAnalysisNotice(null);
    setActiveTab('student-scores');
  };

  const analyze = () => {
    const readiness = validateIndividualAnalysisReadiness(blueprint, studentInputs, settings);
    if (!readiness.isValid) {
      setResult(null);
      setAnalysisError('تعذر بدء التحليل. راجع الدرجات والحدود والبيانات الموضحة أدناه.');
      setActiveTab('student-scores');
      return;
    }

    try {
      const analysis = runIndividualPerformanceAnalysis(context, blueprint, studentInputs, settings);
      setResult(analysis);
      setAnalysisError(null);
      setAnalysisNotice(null);
      setActiveTab('overview');
    } catch (error) {
      setResult(null);
      setAnalysisError(error instanceof Error ? error.message : 'تعذر تشغيل التحليل بسبب خطأ غير متوقع.');
      setActiveTab('student-scores');
    }
  };

  return (
    <main dir="rtl" className="mw-track mw-track-individual space-y-5 text-right">
      {activeTab === 'student-paper' && (
        <section className="mw-track-hero mw-track-hero--individual rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-[#D7C7FF]">مسار فردي مستقل</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">تحليل الأداء الفردي</h1>
              <p className="mt-3 max-w-3xl leading-8 text-slate-200">
                أدخل بيانات الطالب والورقة، وابنِ الأسئلة والمهارات، ثم احصل على قراءة تربوية حذرة وخطة متابعة وتقرير تفصيلي توثيقي.
              </p>
            </div>
            {result?.validation.isValid ? (
              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                <div className="text-sm text-slate-200">مستوى الطالب</div>
                <div className="mt-1 text-xl font-black">{result.level.label}</div>
                <div className="mt-1 text-sm text-slate-200">{result.summary.percent}% من أداء الورقة</div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <nav className="mw-analysis-steps grid grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm md:grid-cols-3 xl:grid-cols-6">
        {TABS.map((tab) => {
          const disabled = RESULT_TABS.includes(tab.id) && (!result || !result.validation.isValid);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-3 py-3 text-right transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : disabled
                    ? 'cursor-not-allowed bg-slate-50 text-slate-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="text-sm font-black">{tab.label}</div>
              <div className={`mt-1 text-xs ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>{tab.description}</div>
            </button>
          );
        })}
      </nav>

      {activeTab === 'student-paper' ? (
        <StudentPaperTab context={context} setContext={setContext} settings={settings} setSettings={updateSettings} fillExample={fillExample} clearSavedWorkspace={clearSavedWorkspace} />
      ) : null}
      {activeTab === 'exam-structure' ? (
        <ExamStructureTab questionCount={questionCount} setQuestionCount={setQuestionCount} blueprint={blueprint} setBlueprint={updateBlueprint} totalExamScore={totalExamScore} rebuildBlueprint={rebuildBlueprint} />
      ) : null}
      {activeTab === 'student-scores' ? (
        <StudentScoresTab blueprint={blueprint} studentInputs={studentInputs} setStudentInputs={updateStudentInputs} analyze={analyze} readiness={analysisReadiness} analysisError={analysisError} analysisNotice={analysisNotice} />
      ) : null}
      {activeTab === 'overview' ? <ResultGate result={result} render={(analysis) => <PrintableResultTab sectionId="individual-overview-tab" context={{ directorate: analysis.context.educationDirectorate, schoolName: analysis.context.schoolName, teacherName: analysis.context.teacherName, trackLabel: 'بوصلة الإتقان — تحليل الأداء الفردي', title: 'ملخص الأداء الفردي', fields: [{ label: 'الطالب', value: analysis.context.studentName }, { label: 'المادة', value: analysis.context.subject }, { label: 'الصف / الشعبة', value: `${analysis.context.grade} / ${analysis.context.section || 'لم يحدد'}` }] }}><OverviewTab result={analysis} /></PrintableResultTab>} /> : null}
      {activeTab === 'analysis' ? <ResultGate result={result} render={(analysis) => <PrintableResultTab sectionId="individual-analysis-tab" context={{ directorate: analysis.context.educationDirectorate, schoolName: analysis.context.schoolName, teacherName: analysis.context.teacherName, trackLabel: 'بوصلة الإتقان — تحليل الأداء الفردي', title: 'تحليل المفردات والمهارات', fields: [{ label: 'الطالب', value: analysis.context.studentName }, { label: 'المادة', value: analysis.context.subject }, { label: 'الصف / الشعبة', value: `${analysis.context.grade} / ${analysis.context.section || 'لم يحدد'}` }] }}><AnalysisTab result={analysis} /></PrintableResultTab>} /> : null}
      {activeTab === 'report' ? <ResultGate result={result} render={(analysis) => <IndividualPerformanceReportView result={analysis} />} /> : null}
    </main>
  );
}

function StudentPaperTab({ context, setContext, settings, setSettings, fillExample, clearSavedWorkspace }: {
  context: IndividualReportContext;
  setContext: React.Dispatch<React.SetStateAction<IndividualReportContext>>;
  settings: IndividualPerformanceSettings;
  setSettings: React.Dispatch<React.SetStateAction<IndividualPerformanceSettings>>;
  fillExample: () => void;
  clearSavedWorkspace: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card title="بيانات التقرير والمدرسة" className="xl:col-span-2">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select label="مديرية التعليم" value={context.educationDirectorate} options={EDUCATION_DIRECTORATE_OPTIONS} onChange={(value) => setContext((previous) => ({ ...previous, educationDirectorate: value }))} />
          <Input label="اسم المدرسة" value={context.schoolName} onChange={(value) => setContext((previous) => ({ ...previous, schoolName: value }))} />
          <Select label="المادة" value={context.subject} options={SUBJECT_OPTIONS} onChange={(value) => setContext((previous) => ({ ...previous, subject: value }))} />
          <Select label="الصف" value={context.grade} options={GRADE_OPTIONS} onChange={(value) => setContext((previous) => ({ ...previous, grade: value }))} />
          <Input label="الشعبة" value={context.section} onChange={(value) => setContext((previous) => ({ ...previous, section: value }))} />
          <Select label="نوع الاختبار / أداة القياس" value={context.assessmentType} options={ASSESSMENT_TYPE_OPTIONS} onChange={(value) => setContext((previous) => ({ ...previous, assessmentType: value }))} />
          <ReadOnly label="العام الدراسي" value={context.academicYear} />
          <ReadOnly label="تاريخ التقرير" value={context.analysisDate} />
        </div>
      </Card>

      <Card title="بيانات الطالب والورقة">
        <div className="space-y-3">
          <Input label="اسم الطالب" value={context.studentName} onChange={(value) => setContext((previous) => ({ ...previous, studentName: value }))} />
          <Input label="عنوان الورقة" value={context.paperTitle} onChange={(value) => setContext((previous) => ({ ...previous, paperTitle: value }))} />
          <Input label="اسم المعلم" value={context.teacherName || ''} onChange={(value) => setContext((previous) => ({ ...previous, teacherName: value }))} />
          <NumberInput label="حد النجاح (%)" value={settings.passCutoffPercent} onChange={(value) => setSettings((previous) => ({ ...previous, passCutoffPercent: value }))} />
          <NumberInput label="حد الإتقان (%)" value={settings.masteryCutoffPercent} onChange={(value) => setSettings((previous) => ({ ...previous, masteryCutoffPercent: value }))} />
          <NumberInput label="حد التميز (%)" value={settings.excellenceCutoffPercent} onChange={(value) => setSettings((previous) => ({ ...previous, excellenceCutoffPercent: value }))} />
        </div>
      </Card>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">إجراءات بداية المسار</h3>
            <p className="mt-1 text-sm text-slate-500">تُحفظ بيانات العمل مؤقتًا في هذا المتصفح لاستكمالها لاحقًا. عند استخدام جهاز مشترك، اضغط «مسح بيانات الطالب وبدء تحليل جديد» بعد الانتهاء.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={fillExample} className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-slate-500">تعبئة مثال</button>
            <button type="button" onClick={clearSavedWorkspace} className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:border-red-400">مسح بيانات الطالب وبدء تحليل جديد</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExamStructureTab({ questionCount, setQuestionCount, blueprint, setBlueprint, totalExamScore, rebuildBlueprint }: {
  questionCount: number;
  setQuestionCount: React.Dispatch<React.SetStateAction<number>>;
  blueprint: ExamQuestionBlueprint[];
  setBlueprint: React.Dispatch<React.SetStateAction<ExamQuestionBlueprint[]>>;
  totalExamScore: number;
  rebuildBlueprint: () => void;
}) {
  const updateQuestion = (id: string, patch: Partial<ExamQuestionBlueprint>) => {
    setBlueprint((previous) => previous.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  };
  return (
    <Card title="بناء الأسئلة والمهارات">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <NumberInput label="عدد الأسئلة / المفردات" value={questionCount} onChange={setQuestionCount} />
        <ReadOnly label="الدرجة الكلية المحسوبة" value={totalExamScore} />
        <div className="flex items-end"><button type="button" onClick={rebuildBlueprint} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700">إنشاء جدول الأسئلة</button></div>
      </div>
      <p className="mb-3 text-sm leading-7 text-slate-600">تبدأ خلية درجة كل مفردة فارغة، ويكتبها المعلم يدويًا. يجب أن تكون الدرجة 0.5 فأكثر، وتتدرج بمقدار 0.5، ولا تقبل الصفر أو القيم السالبة.</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-900 text-white"><tr><th className="px-3 py-3 text-right">السؤال</th><th className="px-3 py-3 text-right">الدرجة الكلية</th><th className="px-3 py-3 text-right">المهارة</th></tr></thead>
          <tbody>{blueprint.map((question) => <tr key={question.id} className="border-b border-slate-100 last:border-b-0"><td className="px-3 py-2 font-black">{question.label}</td><td className="px-3 py-2"><SmallNumber value={question.maxScore} min={0.5} step={0.5} onChange={(value) => updateQuestion(question.id, { maxScore: value })} /></td><td className="px-3 py-2"><SmallSelect value={question.skill} options={SKILL_OPTIONS} onChange={(value) => updateQuestion(question.id, { skill: value })} /></td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  );
}

function StudentScoresTab({ blueprint, studentInputs, setStudentInputs, analyze, readiness, analysisError, analysisNotice }: {
  blueprint: ExamQuestionBlueprint[];
  studentInputs: StudentQuestionInput[];
  setStudentInputs: React.Dispatch<React.SetStateAction<StudentQuestionInput[]>>;
  analyze: () => void;
  readiness: AnalysisReadinessResult;
  analysisError: string | null;
  analysisNotice: string | null;
}) {
  const inputById = new Map(studentInputs.map((item) => [item.questionId, item]));
  const scoreIssueByQuestion = useMemo(() => new Map(
    readiness.issues.filter((issue) => issue.questionId && issue.field === 'score').map((issue) => [issue.questionId as string, issue]),
  ), [readiness.issues]);
  const errorTypeIssueByQuestion = useMemo(() => new Map(
    readiness.issues.filter((issue) => issue.questionId && issue.field === 'errorType').map((issue) => [issue.questionId as string, issue]),
  ), [readiness.issues]);
  const otherDetailIssueByQuestion = useMemo(() => new Map(
    readiness.issues.filter((issue) => issue.questionId && issue.field === 'otherErrorDetail').map((issue) => [issue.questionId as string, issue]),
  ), [readiness.issues]);

  const updateInput = (questionId: string, patch: Partial<StudentQuestionInput>) => {
    setStudentInputs((previous) => {
      const exists = previous.some((item) => item.questionId === questionId);
      if (!exists) return [...previous, { questionId, score: '', errorType: DEFAULT_ERROR_TYPE, otherErrorDetail: '', teacherNote: '', ...patch }];
      return previous.map((item) => (item.questionId === questionId ? { ...item, ...patch } : item));
    });
  };

  const completionPercent = readiness.totalQuestionCount > 0
    ? Math.round((readiness.completedScoreCount / readiness.totalQuestionCount) * 100)
    : 0;
  const statusClass = readiness.isValid
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <Card title="إدخال درجات الطالب وترميز الأخطاء">
      <p className="mb-4 text-sm leading-7 text-slate-600">
        الصفر درجة صحيحة، أما الخلية الفارغة أو الدرجة غير الصالحة فتمنع بدء التحليل. الدرجة الكاملة تُعرض «إجابة متقنة»، والدرجة الناقصة بلا ترميز تُعرض «لم يرمز نوع الخطأ».
      </p>

      <div className={`mb-4 rounded-2xl border p-4 ${statusClass}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-black">{readiness.isValid ? 'جدول الدرجات مكتمل وجاهز للتحليل' : 'التحليل متوقف حتى اكتمال جميع الدرجات وصحة البيانات'}</div>
            <div className="mt-1 text-sm font-bold">
              تم إدخال {readiness.completedScoreCount} من {readiness.totalQuestionCount} درجة صحيحة.
              {!readiness.isValid ? ` الفارغة: ${readiness.emptyScoreCount}، درجات غير صالحة: ${readiness.invalidScoreCount}، أخطاء بناء الورقة: ${readiness.invalidBlueprintCount}، وإجمالي ملاحظات التحقق: ${readiness.issueCount}.` : ''}
            </div>
          </div>
          <div className="rounded-xl bg-white/70 px-3 py-2 text-sm font-black">{completionPercent}% مكتمل</div>
        </div>

        {!readiness.isValid ? (
          <div className="mt-3 space-y-1.5 text-sm">
            {readiness.issues.slice(0, 8).map((issue, index) => (
              <p key={`${issue.code || 'issue'}-${issue.questionId || 'general'}-${index}`} className="font-bold">• {issue.questionLabel ? `${issue.questionLabel}: ` : ''}{issue.message}</p>
            ))}
            {readiness.issues.length > 8 ? <p className="text-xs font-bold">• توجد {readiness.issues.length - 8} ملاحظات أخرى تحتاج إلى استكمال أو تصحيح.</p> : null}
          </div>
        ) : null}

        {analysisNotice ? <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-800">{analysisNotice}</p> : null}
        {analysisError ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{analysisError}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[1250px] text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-3 py-3 text-right">السؤال</th>
              <th className="px-3 py-3 text-right">المهارة</th>
              <th className="px-3 py-3 text-right">الدرجة الكلية</th>
              <th className="px-3 py-3 text-right">درجة الطالب</th>
              <th className="px-3 py-3 text-right">نوع الخطأ</th>
              <th className="px-3 py-3 text-right">توضيح «أخرى»</th>
              <th className="px-3 py-3 text-right">ملاحظة المعلم</th>
            </tr>
          </thead>
          <tbody>
            {blueprint.map((question) => {
              const input = inputById.get(question.id) || { questionId: question.id, score: '', errorType: DEFAULT_ERROR_TYPE, otherErrorDetail: '', teacherNote: '' };
              const errorOptions = withCurrentOption(getErrorTypeOptionsForSkill(question.skill), input.errorType || DEFAULT_ERROR_TYPE);
              const scoreIssue = scoreIssueByQuestion.get(question.id);
              const errorTypeIssue = errorTypeIssueByQuestion.get(question.id);
              const otherDetailIssue = otherDetailIssueByQuestion.get(question.id);
              const scoreInputClass = scoreIssue?.code === 'missing_score'
                ? 'border-amber-300 bg-amber-50/60 focus:border-amber-500'
                : scoreIssue
                  ? 'border-red-400 bg-red-50 focus:border-red-600'
                  : 'border-slate-200 bg-white focus:border-slate-500';
              return (
                <tr key={question.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-2 font-black">{question.label}</td>
                  <td className="px-3 py-2">{question.skill}</td>
                  <td className="px-3 py-2">{question.maxScore || '—'}</td>
                  <td className="px-3 py-2">
                    <StudentScoreInput value={input.score} max={Number(question.maxScore)} issueMessage={scoreIssue?.message} inputClassName={scoreInputClass} onChange={(value) => updateInput(question.id, { score: value })} />
                  </td>
                  <td className="px-3 py-2">
                    <div>
                      <SmallSelect
                        value={input.errorType || DEFAULT_ERROR_TYPE}
                        options={errorOptions}
                        onChange={(value) => updateInput(question.id, { errorType: value, otherErrorDetail: value === 'أخرى' ? input.otherErrorDetail || '' : '' })}
                        invalid={Boolean(errorTypeIssue)}
                        title={errorTypeIssue?.message}
                      />
                      {errorTypeIssue ? <p className="mt-1 max-w-56 text-[11px] font-bold leading-5 text-red-700">{errorTypeIssue.message}</p> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {input.errorType === 'أخرى' ? (
                      <div>
                        <input value={input.otherErrorDetail || ''} onChange={(event) => updateInput(question.id, { otherErrorDetail: event.target.value })} placeholder="اكتب وصفًا مختصرًا" className={`w-60 rounded-xl border px-3 py-2 text-sm outline-none ${otherDetailIssue ? 'border-red-400 bg-red-50 focus:border-red-600' : 'border-slate-200 focus:border-slate-500'}`} />
                        {otherDetailIssue ? <p className="mt-1 max-w-60 text-[11px] font-bold leading-5 text-red-700">{otherDetailIssue.message}</p> : null}
                      </div>
                    ) : <span className="text-xs text-slate-400">لا يلزم</span>}
                  </td>
                  <td className="px-3 py-2"><SearchableSelect value={input.teacherNote || ''} options={TEACHER_NOTE_OPTIONS} onChange={(value) => updateInput(question.id, { teacherNote: value })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={analyze} disabled={!readiness.isValid} className={`rounded-xl px-5 py-2 text-sm font-bold text-white ${readiness.isValid ? 'bg-slate-900 hover:bg-slate-700' : 'cursor-not-allowed bg-slate-300'}`}>تحليل الأداء الفردي</button>
      </div>
    </Card>
  );
}

function OverviewTab({ result }: { result: IndividualPerformanceAnalysisResult }) {
  const firstPriority = result.priorities[0];
  return (
    <div className="mw-dashboard-space">
      <div className="mw-dashboard-grid mw-dashboard-grid--four">
        <Metric label="درجة الطالب" value={`${result.summary.studentScore} من ${result.summary.totalScore}`} hint={`حد الإتقان: ${result.summary.masteryCutoffScore} درجة`} icon="◉" tone="royal" />
        <Metric label="النسبة" value={`${result.summary.percent}%`} hint="نسبة الطالب من الدرجة الكلية" icon="%" tone="royal" featured />
        <Metric label="التصنيف" value={<StatusBadge tone={levelTone(result.level.code)}>{result.level.label}</StatusBadge>} hint={result.level.planType} icon="◆" tone={levelTone(result.level.code)} />
        <Metric label="الفجوة عن الإتقان" value={`${result.summary.gapToMasteryPoints} درجة`} hint={result.summary.achievedMastery ? 'لا توجد فجوة حرجة عن الإتقان' : 'الفارق المطلوب للوصول إلى حد الإتقان'} icon="△" tone={result.summary.achievedMastery ? 'royal' : 'amber'} />
        <Metric label="حالة الإتقان" value={result.summary.achievedMastery ? 'حقق الإتقان' : 'لم يحقق الإتقان'} hint="مقارنة مباشرة بحد الإتقان" icon="✓" tone={result.summary.achievedMastery ? 'royal' : 'danger'} />
        <Metric label="جودة القراءة" value={result.readingQuality.label} hint={result.readingQuality.totalQuestions ? `${result.readingQuality.totalQuestions} مفردة ممثلة` : 'قراءة تشخيصية'} icon="◎" tone="violet" />
        <Metric label="ترميز الأخطاء" value={`${result.codingCompleteness.percent}%`} hint={result.codingCompleteness.label} icon="⌁" tone="slate" />
        <Metric label="أولوية التدخل" value={firstPriority ? firstPriority.skill : 'لا توجد أولوية'} hint={firstPriority ? `${firstPriority.percent}% أداء في المهارة` : 'لا توجد فجوة مهارية بارزة'} icon="★" tone="amber" />
      </div>
      <PremiumPanel title="مشهد الأداء الفردي" description="موضع الطالب من حد الإتقان وتوزيع حالة الإجابات." tone="violet">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StudentMasteryPositionChart result={result} />
          <ItemStatusChart result={result} />
        </div>
      </PremiumPanel>
      <InsightNarrativeCard
        title="قصة أداء الطالب في هذه الورقة"
        text={<><p>{result.narratives.executiveSummary}</p><p className="mt-3">{result.narratives.educationalMeaning}</p></>}
        tone="violet"
        footer={<span>{result.readingQuality.message}</span>}
      />
    </div>
  );
}

function AnalysisTab({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <div className="space-y-5">
      <Card title="تحليل المفردات">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="صحيحة" value={result.itemStatus.correctCount} />
          <Metric label="جزئية" value={result.itemStatus.partialCount} />
          <Metric label="خاطئة" value={result.itemStatus.wrongCount} />
          <Metric label="متروكة" value={result.itemStatus.omittedCount} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopLossItemsChart result={result} />
          <ItemStatusChart result={result} />
        </div>
        <div className="mt-4">
          <SimpleTable headers={['المفردة', 'المهارة', 'درجة الطالب', 'الفقد', 'نوع الخطأ', 'ملاحظة المعلم', 'الأولوية']} rows={result.topLossItems.map((question) => [question.label, question.skill, `${question.score} من ${question.maxScore}`, question.loss, question.errorType, question.teacherNote || '—', question.priority])} />
        </div>
      </Card>

      <Card title="تحليل المهارات">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkillPerformanceChart result={result} />
          <SkillLossChart result={result} />
        </div>
        <div className="mt-4">
          <SimpleTable headers={['المهارة', 'عدد المفردات', 'درجة الطالب', 'النسبة', 'الحكم', 'قراءة التمثيل']} rows={result.skills.map((skill) => [skill.skill, skill.questionCount, `${skill.score} من ${skill.maxScore}`, `${skill.percent}%`, skill.judgement, skill.representationNote])} />
        </div>
      </Card>

      <Card title="أنماط الأخطاء وملاحظات المعلم">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ErrorPatternsChart result={result} />
          <PriorityLineChart result={result} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SimpleTable headers={['نوع الخطأ', 'التكرار', 'النسبة', 'المفردات', 'المهارات']} rows={result.errorPatterns.map((pattern) => [pattern.errorType, pattern.count, `${pattern.percent}%`, pattern.questionLabels.join('، '), pattern.skills.join('، ')])} />
          <SimpleTable headers={['المفردة', 'المهارة', 'الأداء', 'نوع الخطأ', 'ملاحظة المعلم']} rows={result.teacherNotes.map((note) => [note.questionLabel, note.skill, `${note.percent}%`, note.errorType, note.note])} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <NoteBox title="مؤشر التشخيص" text={result.narratives.diagnosisIndicator} />
          <NoteBox title="دور ملاحظات المعلم" text={result.narratives.teacherNotesReading} />
        </div>
      </Card>

      <DiagnosticInsightsPanel result={result} />

      <Card title="الخطة التربوية وإعادة القياس">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <NoteBox title="رسالة إلى الطالب" text={result.plan.studentMessage} />
          <NoteBox title="مدة الخطة" text={`${result.plan.title} — ${result.plan.duration}`} />
          <NoteBox title="دليل التحسن" text={result.plan.evidenceOfImprovement} />
        </div>
        <div className="mt-4">
          <SimpleTable headers={['الترتيب', 'المهارة', 'الأداء', 'الفقد', 'سبب الترتيب']} rows={result.priorities.map((priority) => [priority.rank, priority.skill, `${priority.percent}%`, priority.loss, priority.reason])} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <List title="ولي الأمر" items={result.plan.parentRole} />
          <List title="المعلم / المدرسة" items={result.plan.teacherRole} />
          <List title="الطالب" items={result.plan.studentActions} />
        </div>
      </Card>
    </div>
  );
}


function DiagnosticInsightsPanel({ result }: { result: IndividualPerformanceAnalysisResult }) {
  return (
    <Card title="لوحة التشخيص الذكي وأولويات التدخل" className="mw-premium-section-card">
      <div className="space-y-4">
        <DiagnosticDecisionCard decision={result.diagnostics.decision} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ParetoChart title="باريتو الفقد حسب المهارات" description="يرتب المهارات حسب مساهمتها في فقد الطالب." entries={result.diagnostics.skillLossPareto} valueLabel="الفقد" />
          <ParetoChart title="باريتو أنماط الأخطاء" description="يرتب أنماط الأخطاء المرمزة حسب التكرار." entries={result.diagnostics.errorPareto} valueLabel="التكرار" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RadarSkillChart data={result.diagnostics.skillRadar} title="رادار مهارات الطالب" description="يعرض صورة عامة للفجوات بين مهارات الطالب في هذه الورقة." />
          <FishboneDiagnosticCard diagnostic={result.diagnostics.fishbone} />
        </div>
      </div>
    </Card>
  );
}

function ResultGate({ result, render }: { result: IndividualPerformanceAnalysisResult | null; render: (result: IndividualPerformanceAnalysisResult) => React.ReactNode }) {
  if (!result || !result.validation.isValid) {
    return (
      <Card title="لم يتم إنشاء تحليل صالح بعد">
        <p className="text-sm text-slate-600">أكمل بيانات الورقة ودرجات الطالب، ثم اضغط زر تحليل الأداء الفردي.</p>
      </Card>
    );
  }
  return <>{render(result)}</>;
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}><h2 className="mb-4 text-lg font-black text-slate-900">{title}</h2>{children}</section>;
}

function levelTone(code: IndividualPerformanceAnalysisResult['level']['code']): 'royal' | 'violet' | 'amber' | 'slate' | 'danger' {
  if (code === 'excellent' || code === 'mastery') return 'royal';
  if (code === 'support') return 'amber';
  if (code === 'remedial') return 'danger';
  return 'slate';
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>;
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <MobileNumberInput
      label={label}
      value={value}
      onChange={(nextValue: MobileNumericValue) => {
        if (typeof nextValue === 'number') onChange(nextValue);
      }}
      inputClassName="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
    />
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-sm font-bold text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function ReadOnly({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value || '—'}</p></div>;
}

function StudentScoreInput({ value, max, issueMessage, inputClassName, disabled = false, onChange }: {
  value: number | string;
  max: number;
  issueMessage?: string;
  inputClassName: string;
  disabled?: boolean;
  onChange: (value: number | '') => void;
}) {
  return (
    <div>
      <MobileNumberInput
        compact
        value={value === '' ? '' : Number(value)}
        step="any"
        min={0}
        max={Number.isFinite(max) ? max : undefined}
        disabled={disabled}
        align="center"
        onChange={(nextValue) => onChange(nextValue)}
        ariaInvalid={Boolean(issueMessage)}
        title={issueMessage || undefined}
        inputClassName={`w-28 rounded-xl border px-3 py-2 text-sm outline-none ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : inputClassName}`}
      />
      {issueMessage ? <p className="mt-1 max-w-40 text-[11px] font-bold leading-5 text-red-700">{issueMessage}</p> : null}
    </div>
  );
}

function SmallNumber({ value, onChange, min, step }: { value: number | string; onChange: (value: number | '') => void; min?: number; step?: number }) {
  return (
    <MobileNumberInput
      compact
      value={value === '' ? '' : Number(value)}
      min={min}
      step={step}
      placeholder="اكتب الدرجة"
      onChange={(nextValue) => onChange(nextValue)}
      inputClassName="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
    />
  );
}

function SmallSelect({ value, options, onChange, invalid = false, title }: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  invalid?: boolean;
  title?: string;
}) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid} title={title} className={`w-56 rounded-xl border bg-white px-3 py-2 text-sm outline-none ${invalid ? 'border-red-400 bg-red-50 focus:border-red-600' : 'border-slate-200 focus:border-slate-500'}`}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function SearchableSelect({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const listId = React.useId();
  return <div><input list={listId} value={value} onChange={(event) => onChange(event.target.value)} placeholder="اختر أو اكتب..." className="w-72 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500" /><datalist id={listId}>{options.map((option) => <option key={option} value={option} />)}</datalist></div>;
}

function Metric({ label, value, hint, featured = false, tone = 'royal', icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; featured?: boolean; tone?: 'royal' | 'violet' | 'amber' | 'slate' | 'danger'; icon?: React.ReactNode }) {
  return <PremiumMetricCard label={label} value={value} hint={hint} featured={featured} tone={tone} icon={icon} />;
}

function NoteBox({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7"><p className="mb-1 font-black text-slate-900">{title}</p><p className="text-slate-700">{text}</p></div>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="mb-2 font-black text-slate-900">{title}</p><ul className="space-y-2 text-sm leading-7 text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>;
}

function SimpleTable({ headers, rows }: { headers: React.ReactNode[]; rows: React.ReactNode[][] }) {
  return <div className="individual-responsive-table overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-900 text-white"><tr>{headers.map((header, index) => <th className="px-4 py-3 text-right" key={index}>{header}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={headers.length} className="px-4 py-6 text-center text-slate-500">لا توجد بيانات للعرض.</td></tr> : rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-slate-100 last:border-b-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function withCurrentOption(options: readonly string[], current?: string): readonly string[] {
  const cleanCurrent = String(current || '').trim();
  if (!cleanCurrent || options.includes(cleanCurrent)) return options;
  return [cleanCurrent, ...options];
}
