import React from 'react';
import { MOE_LOGO_DATA_URL } from './moeLogoData';
import ministryLogoUrl from './moe-logo.png';
import { normalizeDigitsInElement } from './numberFormat';

const PRINT_ROOT_ID = 'unified-print-root';

function normalizeOfficialName(value: string): string {
  return value
    .replace(/وزارة التربية والتعليم/g, 'وزارة التعليم')
    .replace(/المديرية العامة للتربية والتعليم بمحافظة/g, 'مديرية التعليم بمحافظة');
}

function normalizeOfficialNode(value: React.ReactNode): React.ReactNode {
  if (typeof value === 'string') return normalizeOfficialName(value);
  if (typeof value === 'number') return value;
  return value;
}

function displayHeaderValue(value: React.ReactNode): React.ReactNode {
  const normalized = normalizeOfficialNode(value);
  if (normalized === null || normalized === undefined) return 'لم يحدد';
  if (typeof normalized === 'string') {
    const text = normalized.trim();
    if (!text || text === '—' || text === 'غير محدد') return 'لم يحدد';
    return text;
  }
  return normalized;
}

function detectPrintBrowser(): 'firefox' | 'chromium' | 'safari' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const userAgent = navigator.userAgent;
  if (/Firefox\//i.test(userAgent)) return 'firefox';
  if (/Edg\//i.test(userAgent) || /Chrome\//i.test(userAgent) || /Chromium\//i.test(userAgent)) return 'chromium';
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'safari';
  return 'other';
}

async function waitForDocumentFonts(): Promise<void> {
  const fontSet = document.fonts;
  if (!fontSet) return;
  await Promise.race([
    fontSet.ready.then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
  ]);
}

async function waitForReportImages(area: ParentNode): Promise<void> {
  const images = Array.from(area.querySelectorAll('img'));
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;
    try {
      await image.decode();
    } catch {
      await new Promise<void>((resolve) => {
        const finish = () => resolve();
        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
        window.setTimeout(finish, 1800);
      });
    }
  }));
}

function removeExistingPrintRoot(): void {
  document.getElementById(PRINT_ROOT_ID)?.remove();
}

function createIsolatedPrintRoot(source: HTMLElement, browser: 'firefox' | 'chromium' | 'safari' | 'other'): HTMLElement {
  removeExistingPrintRoot();
  const root = document.createElement('div');
  root.id = PRINT_ROOT_ID;
  root.className = `unified-print-root unified-print-root--${browser}`;
  root.setAttribute('dir', source.getAttribute('dir') || 'rtl');
  root.setAttribute('lang', 'ar');
  root.setAttribute('data-print-browser', browser);

  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add('unified-print-document');
  clone.setAttribute('lang', 'ar');
  normalizeDigitsInElement(clone);
  root.appendChild(clone);
  document.body.appendChild(root);
  return root;
}

export interface UnifiedPrintRequest {
  targetValue: string;
  areaId: string;
  documentTitle?: string;
}

export async function printUnifiedReport({ targetValue, areaId, documentTitle = 'تقرير بوصلة الإتقان' }: UnifiedPrintRequest): Promise<void> {
  const source = document.getElementById(areaId);
  if (!source) return;

  const html = document.documentElement;
  const previousTitle = document.title;
  const browser = detectPrintBrowser();
  let cleaned = false;
  let fallbackTimer = 0;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.clearTimeout(fallbackTimer);
    removeExistingPrintRoot();
    html.removeAttribute('data-print-target');
    html.removeAttribute('data-print-browser');
    html.classList.remove('unified-report-printing');
    document.title = previousTitle;
  };

  html.setAttribute('data-print-target', targetValue);
  html.setAttribute('data-print-browser', browser);
  html.classList.add('unified-report-printing');
  document.title = documentTitle;

  await waitForDocumentFonts();
  await waitForReportImages(source);
  const printRoot = createIsolatedPrintRoot(source, browser);
  await waitForReportImages(printRoot);
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
  if (browser === 'safari') {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
  }

  window.addEventListener('afterprint', cleanup, { once: true });
  if (browser === 'safari') {
    window.addEventListener('focus', () => window.setTimeout(cleanup, 600), { once: true });
  }
  fallbackTimer = window.setTimeout(cleanup, browser === 'safari' ? 45000 : 300000);
  try {
    window.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}

export interface UnifiedReportToolbarAction {
  label: string;
  onClick: () => void;
  variant?: 'dark' | 'blue' | 'muted';
}

export function UnifiedReportToolbar({
  title,
  description,
  actions,
  noPrintClassName,
}: {
  title: string;
  description: string;
  actions: UnifiedReportToolbarAction[];
  noPrintClassName: string;
}) {
  const variantClass = (variant: UnifiedReportToolbarAction['variant'] = 'dark') => {
    if (variant === 'blue') return 'bg-blue-700 text-white hover:bg-blue-800';
    if (variant === 'muted') return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    return 'bg-slate-900 text-white hover:bg-slate-700';
  };

  return (
    <div className={`${noPrintClassName} flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`}>
      <div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition ${variantClass(action.variant)}`}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="basis-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">
        <span className="font-black">إعدادات الطباعة الموصى بها:</span> حجم A4، وتفعيل رسومات الخلفية، وإيقاف ترويسات وتذييلات المتصفح. يطبق التطبيق تنسيقًا خاصًا لـ Firefox تلقائيًا؛ ولمنع ظهور الرابط والتاريخ ورقم الصفحة أوقف خيار الترويسات والتذييلات من نافذة الطباعة.
      </div>
    </div>
  );
}

export function UnifiedOfficialReportHeader({
  directorate,
  schoolName,
  trackLabel,
  title,
  subtitle,
}: {
  directorate?: React.ReactNode;
  schoolName?: React.ReactNode;
  trackLabel: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
}) {
  const normalizedDirectorate = displayHeaderValue(directorate);
  const normalizedSchool = schoolName === undefined ? null : displayHeaderValue(schoolName);

  return (
    <header className="report-section official-report-header border-b-2 border-slate-900 pb-3 text-center">
      <div className="flex flex-col items-center justify-center text-center">
        <img
          src={ministryLogoUrl}
          alt="شعار وزارة التعليم"
          aria-label="شعار وزارة التعليم"
          data-report-logo="ministry"
          loading="eager"
          decoding="sync"
          onError={(event) => {
            if (event.currentTarget.src !== MOE_LOGO_DATA_URL) {
              event.currentTarget.src = MOE_LOGO_DATA_URL;
            }
          }}
          className="mb-1 h-[22mm] max-h-20 w-auto object-contain print:h-[20mm] print:max-h-[20mm]"
        />

        <div className="space-y-0.5 font-bold text-slate-800">
          <p className="text-[12px] leading-5">سلطنة عمان</p>
          <p className="text-[12px] leading-5">وزارة التعليم</p>
          <p className="text-[12px] leading-5">{normalizedDirectorate}</p>
          {normalizedSchool ? <p className="text-[12px] leading-5">{normalizedSchool}</p> : null}
        </div>

        <p className="mt-1.5 text-[11px] font-black text-slate-500">{trackLabel}</p>
        <h1 className="mt-0.5 text-xl font-black text-slate-950">{title}</h1>
        <p className="mt-1 max-w-[170mm] text-xs leading-5 text-slate-500">{subtitle}</p>
      </div>
    </header>
  );
}

export function UnifiedPrintStyles({
  printAreaId,
  noPrintClassName,
  dataPrintTargets,
  pageMarginMm = 10,
  fontSizePx = 10.25,
  lineHeight = 1.45,
  extraCss = '',
}: {
  printAreaId?: string;
  noPrintClassName: string;
  dataPrintTargets?: Array<{ value: string; areaId: string }>;
  pageMarginMm?: number;
  fontSizePx?: number;
  lineHeight?: number;
  extraCss?: string;
}) {
  const targets = dataPrintTargets?.length ? dataPrintTargets : printAreaId ? [{ value: 'default', areaId: printAreaId }] : [];
  const activeAreaSelector = dataPrintTargets?.length
    ? dataPrintTargets.map((target) => `html[data-print-target="${target.value}"] #${target.areaId}`).join(',\n')
    : `#${printAreaId}`;
  const allAreaSelector = targets.map((target) => `#${target.areaId}`).join(',\n');
  const firefoxFontSize = Math.max(8.6, fontSizePx * 0.96).toFixed(2);

  return (
    <style>{`
@media screen {
  #${PRINT_ROOT_ID} {
    display: none !important;
  }
}

@media print {
  @page {
    size: A4 portrait;
    margin: ${pageMarginMm}mm;
  }

  html,
  body {
    width: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body > * {
    display: none !important;
  }

  body > #${PRINT_ROOT_ID} {
    display: block !important;
  }

  #${PRINT_ROOT_ID} {
    position: static !important;
    inset: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    overflow: visible !important;
    visibility: visible !important;
  }

  #${PRINT_ROOT_ID},
  #${PRINT_ROOT_ID} * {
    box-sizing: border-box !important;
    visibility: visible !important;
  }

  #${PRINT_ROOT_ID} > .unified-print-document,
  ${activeAreaSelector} {
    position: static !important;
    inset: auto !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    background: white !important;
    color: #0f172a !important;
    font-family: Arial, Tahoma, "Noto Sans Arabic", sans-serif !important;
    font-size: ${fontSizePx}px !important;
    line-height: ${lineHeight} !important;
    overflow: visible !important;
  }

  ${allAreaSelector} {
    box-shadow: none !important;
  }

  .${noPrintClassName},
  .no-print,
  .print-hidden {
    display: none !important;
    visibility: hidden !important;
  }

  #${PRINT_ROOT_ID} .workspace-current-header,
  #${PRINT_ROOT_ID} .recharts-tooltip-wrapper {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }

  #${PRINT_ROOT_ID} a::after,
  #${PRINT_ROOT_ID} abbr[title]::after {
    content: none !important;
  }

  #${PRINT_ROOT_ID} img,
  #${PRINT_ROOT_ID} svg {
    max-width: 100% !important;
  }

  #${PRINT_ROOT_ID} .overflow-x-auto,
  #${PRINT_ROOT_ID} .individual-responsive-table,
  #${PRINT_ROOT_ID} .individual-report-table-scroll {
    overflow: visible !important;
    max-width: 100% !important;
  }

  #${PRINT_ROOT_ID} .official-report-header {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 5mm !important;
    padding-bottom: 3mm !important;
  }

  #${PRINT_ROOT_ID} .report-section,
  #${PRINT_ROOT_ID} .avoid-break,
  #${PRINT_ROOT_ID} .signature-section,
  #${PRINT_ROOT_ID} .chart-card,
  #${PRINT_ROOT_ID} .unified-chart-card {
    break-inside: avoid;
    page-break-inside: avoid;
    min-height: 0 !important;
    max-height: none !important;
  }

  #${PRINT_ROOT_ID} .report-flow,
  #${PRINT_ROOT_ID} .allow-print-split {
    break-inside: auto !important;
    page-break-inside: auto !important;
  }

  #${PRINT_ROOT_ID} .report-page-break {
    break-before: page;
    page-break-before: always;
  }

  #${PRINT_ROOT_ID} .report-page-break::before {
    content: "وزارة التعليم | بوصلة الإتقان";
    display: block;
    margin-bottom: 4mm;
    padding-bottom: 2mm;
    border-bottom: 1px solid #cbd5e1;
    color: #475569;
    font-size: 9px;
    font-weight: 700;
    text-align: center;
  }

  #${PRINT_ROOT_ID} .report-soft-break {
    break-before: auto;
    page-break-before: auto;
  }

  #${PRINT_ROOT_ID} table {
    width: 100% !important;
    max-width: 100% !important;
    border-collapse: collapse !important;
    page-break-inside: auto;
    break-inside: auto;
  }

  #${PRINT_ROOT_ID} thead {
    display: table-header-group;
  }

  #${PRINT_ROOT_ID} tfoot {
    display: table-footer-group;
  }

  #${PRINT_ROOT_ID} tr {
    page-break-inside: avoid;
    page-break-after: auto;
    break-inside: avoid;
  }

  #${PRINT_ROOT_ID} th,
  #${PRINT_ROOT_ID} td {
    padding: 4px 6px !important;
    vertical-align: top !important;
    white-space: normal !important;
    overflow-wrap: break-word !important;
    word-break: normal !important;
  }

  #${PRINT_ROOT_ID} th {
    overflow-wrap: normal !important;
    word-break: keep-all !important;
    text-wrap: balance;
  }

  #${PRINT_ROOT_ID} h1,
  #${PRINT_ROOT_ID} h2,
  #${PRINT_ROOT_ID} h3,
  #${PRINT_ROOT_ID} p {
    orphans: 3;
    widows: 3;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} > .unified-print-document {
    font-size: ${firefoxFontSize}px !important;
    line-height: ${Math.max(1.28, lineHeight - 0.08).toFixed(2)} !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} h1,
  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} h2,
  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} h3,
  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} p,
  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} li {
    orphans: 2 !important;
    widows: 2 !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .report-page-break {
    break-before: page !important;
    page-break-before: always !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .report-page-break::before {
    margin-bottom: 2.5mm !important;
    padding-bottom: 1.2mm !important;
    font-size: 8px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .report-flow,
  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .allow-print-split {
    break-inside: auto !important;
    page-break-inside: auto !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section {
    font-size: 8.85px !important;
    line-height: 1.27 !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .mt-3,
  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .mt-4,
  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .mt-5 {
    margin-top: 5px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .gap-3 {
    gap: 5px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .p-4 {
    padding: 7px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .p-3 {
    padding: 6px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .px-4 {
    padding-inline: 7px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .py-3 {
    padding-block: 6px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .leading-6 {
    line-height: 1.35 !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .signature-section {
    margin-top: 6px !important;
    gap: 5px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .signature-section > div {
    padding: 6px !important;
  }

  html[data-print-browser="firefox"] #${PRINT_ROOT_ID} .firefox-tight-section .signature-section > div > :last-child {
    margin-top: 14px !important;
    padding-top: 4px !important;
  }

  ${extraCss}
}

@-moz-document url-prefix() {
  @media print {
    @page {
      size: A4 portrait;
      margin: ${Math.max(6, pageMarginMm - 2)}mm;
    }
  }
}
`}</style>
  );
}
