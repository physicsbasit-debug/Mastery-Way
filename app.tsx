import { lazy, Suspense, useMemo, useState } from 'react';
import { loadWorkspace, saveWorkspace } from './shared/workspaceAutosave';

const MasterySpreadViews = lazy(() => import('./masterySpread'));
const IndividualPerformanceViews = lazy(() =>
  import('./individualPerformance').then(({ IndividualPerformanceViews }) => ({ default: IndividualPerformanceViews })),
);
const ExamItemsSampleAnalysisViews = lazy(() => import('./examItemSampleAnalysis'));

type ActivePath = 'home' | 'masterySpread' | 'individualPerformance' | 'examItemSampleAnalysis';

type PathTheme = 'royal' | 'olive' | 'violet' | 'amber';

type PathCard = {
  id: Exclude<ActivePath, 'home'>;
  title: string;
  descriptionLines: string[];
  badge: string;
  theme: PathTheme;
  icon: 'spread' | 'student' | 'items';
};

const ACTIVE_PATH_KEY = 'bosla.activePath.v1';

const PATHS: PathCard[] = [
  {
    id: 'masterySpread',
    title: 'تحليل انتشار الإتقان',
    descriptionLines: ['قياس انتشار الإتقان في مجموعة درجات نهائية،', 'مع حكم عام وفجوة وخطة جماعية قابلة للتنفيذ.'],
    badge: 'مسار جماعي',
    theme: 'royal',
    icon: 'spread',
  },
  {
    id: 'individualPerformance',
    title: 'تحليل الأداء الفردي',
    descriptionLines: ['قراءة تشخيصية لأداء طالب واحد في المفردات والمهارات،', 'مع تفسير تربوي وخطة متابعة دقيقة.'],
    badge: 'مسار فردي',
    theme: 'olive',
    icon: 'student',
  },
  {
    id: 'examItemSampleAnalysis',
    title: 'تحليل مفردات الورقة الامتحانية',
    descriptionLines: ['تحليل عينة من أوراق الطلبة لرصد أداء المفردات والمهارات،', 'وتوثيق توازن الورقة وموثوقية القراءة.'],
    badge: 'مسار عينة',
    theme: 'amber',
    icon: 'items',
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
    <main dir="rtl" className="mw-app-shell min-h-screen text-slate-950">
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
    <div className="mw-home-page mx-auto w-full">
      <header className="mw-site-header">
        <div className="mw-brand-lockup">
          <span className="mw-brand-mark" aria-hidden="true"><CompassCheckLogo /></span>
          <div>
            <p className="mw-brand-name">بوصلة الإتقان</p>
            <p className="mw-brand-caption">قراءة تربوية تقود إلى قرار</p>
          </div>
        </div>
      </header>

      <section className="mw-paths-section">
        <div className="mw-section-heading">
          <div>
            <span className="mw-section-eyebrow">المسارات المتاحة</span>
            <h1>اختر مسار التحليل</h1>
            <p>ابدأ بالمسار المناسب لنوع البيانات التي لديك.</p>
          </div>
        </div>

        <div className="mw-path-grid">
          {PATHS.map((path, index) => <PathCardButton key={path.id} path={path} index={index + 1} onSelect={() => onSelectPath(path.id)} />)}
        </div>
      </section>

      <footer className="mw-home-footer">
        <span>بوصلة الإتقان</span>
        <span>فكرة وتصميم: أ. وليد الهنائي · أ. محمود اليحيائي</span>
      </footer>
    </div>
  );
}

function PathCardButton({ path, index, onSelect }: { path: PathCard; index: number; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`mw-path-card mw-path-card--${path.theme} group text-right`}>
      <div className="mw-path-card-inner">
        <div className="mw-path-card-topline">
          <span className="mw-path-index">0{index}</span>
          <span className="mw-path-badge">{path.badge}</span>
          <IconBubble variant={path.theme} icon={path.icon} />
        </div>
        <h3>{path.title}</h3>
        <p className="mw-path-description">{path.descriptionLines.join(' ')}</p>
        <div className="mw-path-card-cta">
          <span>فتح المسار</span>
          <span className="mw-card-arrow" aria-hidden="true">←</span>
        </div>
      </div>
    </button>
  );
}

function PathWorkspace({ activePath, activePathMeta, onBackHome }: { activePath: ActivePath; activePathMeta?: PathCard; onBackHome: () => void }) {
  return (
    <div className="mw-path-workspace mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 md:px-6">
      <header className={`workspace-current-header mw-workspace-header mw-workspace-header--${activePathMeta?.theme ?? 'royal'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="mw-workspace-icon"><IconBubble variant={activePathMeta?.theme ?? 'royal'} icon={activePathMeta?.icon ?? 'spread'} compact /></div>
            <div>
              <p className="mw-workspace-kicker">مساحة التحليل</p>
              <h1>{activePathMeta?.title ?? 'مسار التحليل'}</h1>
              <p className="mw-workspace-description">أدخل البيانات، تابع المؤشرات، ثم اطبع تقريرك عند اكتمال التحليل.</p>
            </div>
          </div>
          <button type="button" onClick={onBackHome} className="mw-back-home-button"><span aria-hidden="true">→</span> المسارات</button>
        </div>
      </header>
      <Suspense fallback={<div className="rounded-2xl border border-white/70 bg-white/80 p-6 text-center font-bold text-slate-600">جارٍ تحميل المسار…</div>}>
        {activePath === 'masterySpread' && <MasterySpreadViews />}
        {activePath === 'individualPerformance' && <IndividualPerformanceViews />}
        {activePath === 'examItemSampleAnalysis' && <ExamItemsSampleAnalysisViews />}
      </Suspense>
    </div>
  );
}

function CompassCheckLogo() {
  return (
    <div className="mw-compass-logo">
      <svg viewBox="0 0 120 120" className="h-[82%] w-[82%]">
        <defs>
          <linearGradient id="compassRoyal" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stopColor="#075B49" /><stop offset="0.55" stopColor="#176B78" /><stop offset="1" stopColor="#B78B3D" /></linearGradient>
        </defs>
        <circle cx="60" cy="60" r="38" fill="none" stroke="url(#compassRoyal)" strokeWidth="5" opacity="0.96" />
        <path d="M76 28L63 63L41 92L55 55L76 28Z" fill="#F4C56A" opacity="0.95" />
        <circle cx="60" cy="60" r="8" fill="#F0DCA8" opacity="0.98" />
        <path d="M42 72L54 83L79 50" fill="none" stroke="#075B49" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function IconBubble({ variant, icon, compact = false }: { variant: PathTheme; icon: PathCard['icon']; compact?: boolean }) {
  return (
    <div className={`mw-icon-bubble mw-icon-bubble--${variant} ${compact ? 'mw-icon-bubble--compact' : ''}`}>
      <svg viewBox="0 0 64 64" className={compact ? 'h-6 w-6' : 'h-8 w-8'}>
        {icon === 'spread' ? <SpreadIcon /> : icon === 'student' ? <StudentIcon /> : <ItemsIcon />}
      </svg>
    </div>
  );
}

function SpreadIcon() {
  return <g fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 49h38" /><path d="M18 42V28" /><path d="M32 42V17" /><path d="M46 42V23" /><path d="M18 28l14-11 14 6" /></g>;
}

function StudentIcon() {
  return <g fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="32" cy="22" r="8" /><path d="M17 51c1.5-10 7-17 15-17s13.5 7 15 17" /><path d="M20 16l12-5 12 5-12 5-12-5Z" /></g>;
}

function ItemsIcon() {
  return <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 12h22l8 8v32H18z" /><path d="M40 12v10h8" /><path d="M25 29h15" /><path d="M25 37h15" /><path d="M25 45h9" /></g>;
}
