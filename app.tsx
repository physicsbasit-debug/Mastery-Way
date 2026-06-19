import { useMemo, useState } from 'react';
import MasterySpreadViews from './masterySpread';
import { IndividualPerformanceViews } from './individualPerformance';
import { ExamItemsSampleAnalysisViews } from './examItemSampleAnalysis';
import { loadWorkspace, saveWorkspace } from './shared/workspaceAutosave';

type ActivePath = 'home' | 'masterySpread' | 'individualPerformance' | 'examItemSampleAnalysis';

type PathCard = {
  id: Exclude<ActivePath, 'home'>;
  title: string;
  descriptionLines: string[];
  badge: string;
  iconColor: 'emerald' | 'blue' | 'violet';
  buttonClass: string;
  glowClass: string;
};

const ACTIVE_PATH_KEY = 'bosla.activePath.v1';

const PATHS: PathCard[] = [
  {
    id: 'masterySpread',
    title: 'تحليل انتشار الإتقان',
    descriptionLines: ['إدخال درجات نهائية جماعية لتحليل نسبة انتشار الإتقان،', 'الحكم العام، والخطة الجماعية.'],
    badge: 'مسار جماعي',
    iconColor: 'emerald',
    buttonClass: 'bg-gradient-to-r from-emerald-500/90 to-teal-400/90 hover:from-emerald-400 hover:to-teal-300',
    glowClass: 'shadow-[0_0_30px_rgba(16,185,129,0.18)]',
  },
  {
    id: 'individualPerformance',
    title: 'تحليل الأداء الفردي',
    descriptionLines: ['تحليل أداء طالب واحد في مفردات الورقة ومهاراتها', 'وأنماط الخطأ مع خطة متابعة.'],
    badge: 'مسار فردي',
    iconColor: 'blue',
    buttonClass: 'bg-gradient-to-r from-blue-500/90 to-indigo-400/90 hover:from-blue-400 hover:to-indigo-300',
    glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.18)]',
  },
  {
    id: 'examItemSampleAnalysis',
    title: 'تحليل مفردات الورقة الامتحانية',
    descriptionLines: ['تحليل عينة من أوراق الطلبة لرصد أداء المفردات والمهارات', 'وتوازن الورقة الامتحانية.'],
    badge: 'مسار عينة',
    iconColor: 'violet',
    buttonClass: 'bg-gradient-to-r from-violet-500/90 to-fuchsia-400/90 hover:from-violet-400 hover:to-fuchsia-300',
    glowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.18)]',
  },
];

function isActivePath(value: unknown): value is ActivePath {
  return value === 'home' || PATHS.some((path) => path.id === value);
}

export default function App() {
  const [activePath, setActivePathState] = useState<ActivePath>(() => loadWorkspace<ActivePath>(ACTIVE_PATH_KEY, 'home', isActivePath));

  const setActivePath = (path: ActivePath) => {
    setActivePathState(path);
    saveWorkspace(ACTIVE_PATH_KEY, path);
  };

  const activePathMeta = useMemo(() => PATHS.find((path) => path.id === activePath), [activePath]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 text-slate-950">
      {activePath === 'home' ? (
        <HomePage onSelectPath={setActivePath} />
      ) : (
        <PathWorkspace activePath={activePath} activePathMeta={activePathMeta} onBackHome={() => setActivePath('home')} />
      )}
    </main>
  );
}

function HomePage({ onSelectPath }: { onSelectPath: (path: ActivePath) => void }) {
  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-6 md:px-8 md:py-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(42,85,190,0.28),_rgba(2,8,23,0.98)_35%,_rgba(1,6,18,1)_100%)] px-5 py-8 text-white shadow-[0_25px_60px_rgba(15,23,42,0.16)] md:px-10 md:py-10">
        <AmbientBackground />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center">
          <div className="w-full max-w-4xl rounded-[2rem] border border-white/20 bg-white/10 px-6 py-8 shadow-[0_10px_50px_rgba(255,255,255,0.08)] backdrop-blur-md md:px-10 md:py-10">
            <div className="flex flex-col items-center text-center">
              <CompassCheckLogo />
              <h1 className="mt-6 text-4xl font-black leading-tight text-white drop-shadow-sm md:text-6xl">بوصلة الإتقان</h1>
              <p className="mt-3 text-xl font-black text-blue-200 md:text-2xl">منصة تحليل تربوي لنتائج الطلبة</p>
              <div className="mt-7 flex w-full max-w-xl items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-blue-200/25 to-transparent" />
                <span className="h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.9)]" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-200/25 to-transparent" />
              </div>
              <p className="mt-6 text-sm font-bold leading-8 text-slate-200 md:text-base">فكرة وتصميم : أ. وليد الهنائي | أ. محمود اليحيائي</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-3xl font-black text-white md:text-5xl">اختر المسار المناسب</h2>
            <p className="mt-4 text-sm font-bold leading-8 text-slate-300 md:text-lg">اختر المسار الذي يلبّي احتياجك التحليلي للحصول على رؤى دقيقة وقرارات تربوية أفضل.</p>
          </div>

          <div className="mt-10 grid w-full max-w-[1440px] gap-5 md:grid-cols-3">
            {PATHS.map((path) => <PathCardButton key={path.id} path={path} onSelect={() => onSelectPath(path.id)} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function PathCardButton({ path, onSelect }: { path: PathCard; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`group rounded-[1.6rem] border border-white/15 bg-white/8 p-5 text-right shadow-[0_8px_30px_rgba(255,255,255,0.06)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:bg-white/10 ${path.glowClass}`}>
      <div className="flex min-h-[20rem] flex-col items-center text-center">
        <div className="flex w-full justify-start"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-slate-200">{path.badge}</span></div>
        <div className="mt-6"><IconBubble variant={path.iconColor} /></div>
        <h3 className="mt-6 text-2xl font-black leading-10 text-white">{path.title}</h3>
        <div className="mt-4 space-y-1 text-base leading-8 text-slate-200">{path.descriptionLines.map((line) => <p key={line}>{line}</p>)}</div>
        <div className={`mt-auto flex w-full items-center justify-center gap-3 rounded-full px-5 py-4 text-lg font-black text-white shadow-[0_8px_24px_rgba(255,255,255,0.12)] transition ${path.buttonClass}`}>
          <span>الدخول إلى المسار</span><span className="text-xl">←</span>
        </div>
      </div>
    </button>
  );
}

function PathWorkspace({ activePath, activePathMeta, onBackHome }: { activePath: ActivePath; activePathMeta?: PathCard; onBackHome: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
      <header className="workspace-current-header sticky top-0 z-30 rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-bold text-slate-500">مساحة العمل الحالية</p><h1 className="mt-1 text-lg font-black text-slate-950">{activePathMeta?.title ?? 'مسار التحليل'}</h1></div>
          <button type="button" onClick={onBackHome} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200">الرجوع إلى الصفحة الرئيسية</button>
        </div>
      </header>
      {activePath === 'masterySpread' && <MasterySpreadViews />}
      {activePath === 'individualPerformance' && <IndividualPerformanceViews />}
      {activePath === 'examItemSampleAnalysis' && <ExamItemsSampleAnalysisViews />}
    </div>
  );
}

function AmbientBackground() {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-16 top-24 h-72 w-96 rounded-full bg-blue-600/8 blur-3xl" /><div className="absolute -right-12 top-16 h-72 w-96 rounded-full bg-indigo-500/10 blur-3xl" /><div className="absolute bottom-8 right-10 h-44 w-44 rounded-full bg-white/6 blur-3xl" /></div>;
}

function CompassCheckLogo() {
  return (
    <div className="flex h-24 w-24 items-center justify-center md:h-28 md:w-28">
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <defs><linearGradient id="compassBlue" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stopColor="#7AA6FF" /><stop offset="1" stopColor="#2F5BFF" /></linearGradient></defs>
        <circle cx="60" cy="60" r="35" fill="none" stroke="url(#compassBlue)" strokeWidth="5" opacity="0.95" />
        <circle cx="60" cy="60" r="24" fill="none" stroke="url(#compassBlue)" strokeWidth="2.8" opacity="0.45" />
        <path d="M44 59L55 70L77 46" fill="none" stroke="#EAF3FF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function IconBubble({ variant }: { variant: 'emerald' | 'blue' | 'violet' }) {
  const stroke = variant === 'emerald' ? '#6EE7B7' : variant === 'blue' ? '#93C5FD' : '#C4B5FD';
  const bg = variant === 'emerald' ? 'bg-emerald-400/10' : variant === 'blue' ? 'bg-blue-400/10' : 'bg-violet-400/10';
  return (
    <div className={`flex h-20 w-20 items-center justify-center rounded-full border border-white/10 ${bg}`}>
      <svg viewBox="0 0 64 64" className="h-9 w-9"><g fill="none" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="32" cy="22" r="8" /><path d="M18 50c0-10 6-17 14-17s14 7 14 17" /></g></svg>
    </div>
  );
}
