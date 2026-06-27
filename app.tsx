import { useMemo, useState } from 'react';
import MasterySpreadViews from './masterySpread';
import { IndividualPerformanceViews } from './individualPerformance';
import { ExamItemsSampleAnalysisViews } from './examItemSampleAnalysis';
import { loadWorkspace, saveWorkspace } from './shared/workspaceAutosave';

type ActivePath = 'home' | 'masterySpread' | 'individualPerformance' | 'examItemSampleAnalysis';

type PathTheme = 'royal' | 'olive' | 'violet' | 'amber';

type PathCard = {
  id: Exclude<ActivePath, 'home'>;
  title: string;
  shortTitle: string;
  descriptionLines: string[];
  badge: string;
  theme: PathTheme;
  icon: 'spread' | 'student' | 'items';
  highlights: string[];
};

const ACTIVE_PATH_KEY = 'bosla.activePath.v1';

const PATHS: PathCard[] = [
  {
    id: 'masterySpread',
    title: 'تحليل انتشار الإتقان',
    shortTitle: 'انتشار الإتقان',
    descriptionLines: ['قياس انتشار الإتقان في مجموعة درجات نهائية،', 'مع حكم عام وفجوة وخطة جماعية قابلة للتنفيذ.'],
    badge: 'مسار جماعي',
    theme: 'royal',
    icon: 'spread',
    highlights: ['نسبة الانتشار', 'حكم تربوي', 'خطة تدخل'],
  },
  {
    id: 'individualPerformance',
    title: 'تحليل الأداء الفردي',
    shortTitle: 'الأداء الفردي',
    descriptionLines: ['قراءة تشخيصية لأداء طالب واحد في المفردات والمهارات،', 'مع تفسير تربوي وخطة متابعة دقيقة.'],
    badge: 'مسار فردي',
    theme: 'olive',
    icon: 'student',
    highlights: ['مهارات الطالب', 'أنماط الخطأ', 'أولوية التدخل'],
  },
  {
    id: 'examItemSampleAnalysis',
    title: 'تحليل مفردات الورقة الامتحانية',
    shortTitle: 'مفردات الورقة',
    descriptionLines: ['تحليل عينة من أوراق الطلبة لرصد أداء المفردات والمهارات،', 'وتوثيق توازن الورقة وموثوقية القراءة.'],
    badge: 'مسار عينة',
    theme: 'amber',
    icon: 'items',
    highlights: ['أداء المفردات', 'توازن المهارات', 'تقرير توثيقي'],
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
    <div className="mw-home-page mx-auto w-full max-w-[1720px] px-4 py-5 md:px-8 md:py-8">
      <section className="mw-hero relative overflow-hidden rounded-[2.3rem] px-5 py-8 text-white md:px-10 md:py-10">
        <AmbientBackground />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch">
          <div className="mw-hero-content flex min-h-[28rem] flex-col justify-between rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-[0_18px_60px_rgba(2,8,23,0.18)] backdrop-blur-md md:p-9">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="mw-pill mw-pill-light">منصة تحليل تربوي ذكية</span>
                <span className="mw-pill mw-pill-gold">إتقان • فجوات • قرار</span>
              </div>
              <CompassCheckLogo />
              <h1 className="mt-7 text-5xl font-black leading-tight text-white drop-shadow-sm md:text-7xl">بوصلة الإتقان</h1>
              <p className="mt-4 max-w-3xl text-xl font-black leading-9 text-indigo-100 md:text-2xl">
                قراءة تربوية منظمة لنتائج الطلبة، تحول الأرقام إلى مؤشرات واضحة وخطط قابلة للتنفيذ.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroStat value="3" label="مسارات تحليلية" />
              <HeroStat value="A4" label="تقارير قابلة للطباعة" />
              <HeroStat value="RTL" label="واجهة عربية رسمية" />
            </div>
            <p className="mt-7 text-sm font-bold leading-8 text-indigo-100/90">فكرة وتصميم: أ. وليد الهنائي | أ. محمود اليحيائي</p>
          </div>

          <div className="mw-hero-panel flex flex-col justify-between rounded-[2rem] border border-white/12 bg-white/8 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.20)] backdrop-blur-md md:p-7">
            <div>
              <p className="text-sm font-black text-[#F6D38A]">رحلة التحليل</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-white md:text-4xl">من إدخال البيانات إلى قرار تربوي واضح</h2>
              <p className="mt-4 leading-8 text-indigo-100/85">
                صُممت بوصلة الإتقان لتقود المعلم خطوة بخطوة: بيانات، تحليل، مؤشرات، قراءة تربوية، ثم تقرير رسمي.
              </p>
            </div>
            <div className="mt-7 space-y-3">
              <JourneyStep number="01" title="إدخال منظم" text="حقول واضحة، تحقق من البيانات، وحفظ تلقائي على الجهاز." />
              <JourneyStep number="02" title="تحليل بصري" text="بطاقات مؤشرات ورسوم تساعد على قراءة المشهد دون إغراق." />
              <JourneyStep number="03" title="قرار وتقرير" text="توصيات تربوية وتقرير تفصيلي جاهز للطباعة والتوثيق." />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mw-section-eyebrow">اختر المسار المناسب</span>
            <h2 className="mt-2 text-3xl font-black text-[#172554] md:text-4xl">لوحات تحليل مصممة حسب نوع القرار</h2>
            <p className="mt-2 max-w-3xl leading-8 text-slate-600">كل مسار مستقل في مدخلاته ومخرجاته، لكنه يعمل ضمن هوية واحدة ومنطق تربوي موحد.</p>
          </div>
          <div className="mw-soft-note">ابدأ بالمسار الأقرب لبياناتك، ثم اطبع النتائج عند اكتمال التحليل.</div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {PATHS.map((path) => <PathCardButton key={path.id} path={path} onSelect={() => onSelectPath(path.id)} />)}
        </div>
      </section>
    </div>
  );
}

function PathCardButton({ path, onSelect }: { path: PathCard; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`mw-path-card mw-path-card--${path.theme} group text-right`}>
      <div className="flex min-h-[24rem] flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="mw-path-badge">{path.badge}</span>
          <IconBubble variant={path.theme} icon={path.icon} />
        </div>
        <h3 className="mt-6 text-2xl font-black leading-10 text-[#111827]">{path.title}</h3>
        <div className="mt-3 space-y-1 text-base leading-8 text-slate-600">
          {path.descriptionLines.map((line) => <p key={line}>{line}</p>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {path.highlights.map((item) => <span key={item} className="mw-highlight-chip">{item}</span>)}
        </div>
        <div className="mt-auto flex items-center justify-between rounded-[1.4rem] border border-slate-200/80 bg-white/75 px-4 py-3 shadow-sm transition group-hover:border-transparent">
          <span className="text-sm font-black text-slate-700">الدخول إلى المسار</span>
          <span className="mw-card-arrow">←</span>
        </div>
      </div>
    </button>
  );
}

function PathWorkspace({ activePath, activePathMeta, onBackHome }: { activePath: ActivePath; activePathMeta?: PathCard; onBackHome: () => void }) {
  return (
    <div className="mw-path-workspace mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 md:px-6">
      <header className={`workspace-current-header mw-workspace-header mw-workspace-header--${activePathMeta?.theme ?? 'royal'} sticky top-0 z-30`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="mw-workspace-icon"><IconBubble variant={activePathMeta?.theme ?? 'royal'} icon={activePathMeta?.icon ?? 'spread'} compact /></div>
            <div>
              <p className="text-xs font-black text-indigo-100/85">مساحة العمل الحالية</p>
              <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{activePathMeta?.title ?? 'مسار التحليل'}</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-indigo-100/80">واجهة عمل مهيأة للإدخال والتحليل والطباعة مع حفظ تلقائي للبيانات على هذا الجهاز.</p>
            </div>
          </div>
          <button type="button" onClick={onBackHome} className="mw-back-home-button">الرجوع إلى الصفحة الرئيسية</button>
        </div>
      </header>
      {activePath === 'masterySpread' && <MasterySpreadViews />}
      {activePath === 'individualPerformance' && <IndividualPerformanceViews />}
      {activePath === 'examItemSampleAnalysis' && <ExamItemsSampleAnalysisViews />}
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 top-10 h-80 w-[32rem] rounded-full bg-[#2F6BFF]/28 blur-3xl" />
      <div className="absolute -right-24 top-20 h-96 w-[34rem] rounded-full bg-[#D6A13D]/18 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-1/3 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="mw-orbit mw-orbit-one" />
      <div className="mw-orbit mw-orbit-two" />
    </div>
  );
}

function CompassCheckLogo() {
  return (
    <div className="mt-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.16)] md:h-28 md:w-28">
      <svg viewBox="0 0 120 120" className="h-[82%] w-[82%]">
        <defs>
          <linearGradient id="compassRoyal" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFFFF" /><stop offset="0.55" stopColor="#BFD4FF" /><stop offset="1" stopColor="#D6A13D" /></linearGradient>
        </defs>
        <circle cx="60" cy="60" r="38" fill="none" stroke="url(#compassRoyal)" strokeWidth="5" opacity="0.96" />
        <path d="M76 28L63 63L41 92L55 55L76 28Z" fill="#F4C56A" opacity="0.95" />
        <circle cx="60" cy="60" r="8" fill="#ffffff" opacity="0.92" />
        <path d="M42 72L54 83L79 50" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
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

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/12 bg-white/10 px-4 py-3 text-center shadow-sm backdrop-blur">
      <div className="text-2xl font-black text-[#F6D38A]">{value}</div>
      <div className="mt-1 text-xs font-bold text-indigo-100/85">{label}</div>
    </div>
  );
}

function JourneyStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="mw-journey-step">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}
