import React from 'react';
import { paginateReport } from './pdfPagination';

export function PdfExport({ areaId, filename }: { areaId: string; filename: string }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [url, setUrl] = React.useState('');
  React.useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  async function createPdf() {
    if (busy) return;
    setBusy(true); setError(''); setUrl('');
    let frame: HTMLIFrameElement | undefined;
    try {
      const source = document.getElementById(areaId);
      if (!source) throw new Error('التقرير غير متاح.');
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
      await document.fonts?.ready;
      // Measure and render at the same desktop width even on a narrow phone.
      frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      Object.assign(frame.style, { position: 'fixed', top: '0', left: '-10000px', width: '1100px', height: '900px', border: '0' });
      document.body.appendChild(frame);
      const frameDoc = frame.contentDocument;
      if (!frameDoc) throw new Error('تعذر تجهيز التقرير.');
      frameDoc.documentElement.lang = 'ar'; frameDoc.documentElement.dir = 'rtl';
      const styleLoads = Array.from(document.head.querySelectorAll('style, link[rel=stylesheet]')).map(node => {
        const copy = node.cloneNode(true) as HTMLElement;
        const loaded = copy.tagName === 'LINK' ? new Promise<void>(resolve => { copy.onload = () => resolve(); copy.onerror = () => resolve(); }) : Promise.resolve();
        frameDoc.head.appendChild(copy); return loaded;
      });
      await Promise.all(styleLoads);
      await frameDoc.fonts?.ready;
      Object.assign(frameDoc.body.style, { margin: '0', width: '794px', background: '#fff', direction: 'rtl' });
      const clone = source.cloneNode(true) as HTMLElement;
      clone.classList.add('pdf-export-render');
      const pdfStyle = frameDoc.createElement('style');
      pdfStyle.textContent = `
        .pdf-export-render.mw-print-report--individual .official-report-header { padding: 12px 16px !important; box-shadow: none !important; }
        .pdf-export-render.mw-print-report--individual .official-report-header img { height: 46px !important; max-height: 46px !important; padding: 3px !important; margin-bottom: 3px !important; }
        .pdf-export-render.mw-print-report--individual .official-report-header p { line-height: 1.35 !important; }
        .pdf-export-render.mw-print-report--individual .individual-data-table table { font-size: 12.5px !important; line-height: 1.45 !important; }
        .pdf-export-render.mw-print-report--individual .individual-data-table th,
        .pdf-export-render.mw-print-report--individual .individual-data-table td { padding: 5px 7px !important; overflow-wrap: break-word; }
        .pdf-export-render.mw-print-report--individual .signature-section { margin-top: 14px !important; gap: 6px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-signature { padding: 7px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-signature > div:last-child { margin-top: 15px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-fishbone > div:nth-child(2) { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        /* Compact spacing, not the text: the report must remain readable on A4. */
        .pdf-export-render.mw-print-report--individual .premium-report-summary { gap: 8px !important; padding: 8px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-summary__content,
        .pdf-export-render.mw-print-report--individual .premium-report-summary-metric { padding: 9px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-summary__metrics { gap: 6px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-summary h2 { margin-top: 5px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-summary p { margin-top: 5px !important; line-height: 1.55 !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-info-cell,
        .pdf-export-render.mw-print-report--individual .premium-report-metric,
        .pdf-export-render.mw-print-report--individual .premium-report-narrative { padding: 8px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-narrative p,
        .pdf-export-render.mw-print-report--individual .premium-report-narrative ul { line-height: 1.55 !important; }
        .pdf-export-render.mw-print-report--individual .report-flow { margin-top: 14px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-block,
        .pdf-export-render.mw-print-report--individual .diagnostic-report-fishbone { padding: 10px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-block > div:nth-child(2),
        .pdf-export-render.mw-print-report--individual .diagnostic-report-fishbone > div:nth-child(2) { margin-top: 7px !important; gap: 6px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-block > div:nth-child(2) > div,
        .pdf-export-render.mw-print-report--individual .diagnostic-report-fishbone > div:nth-child(2) > div { padding: 7px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-block > p { margin-top: 7px !important; padding: 7px !important; line-height: 1.5 !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-block > div:nth-child(2) > div > div { line-height: 1.5 !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-pareto .unified-chart-card { padding: 9px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-pareto .space-y-3 > * + * { margin-top: 6px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-pareto .space-y-3 > div { padding: 7px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-pareto .space-y-3 > div > div:first-child { margin-bottom: 5px !important; }
        .pdf-export-render.mw-print-report--individual .diagnostic-report-pareto .space-y-3 > div > div:nth-child(3) { margin-top: 5px !important; }
        /* Final A4 polish: avoid stretching compact chart cards to match neighbours. */
        .pdf-export-render.mw-print-report--individual .individual-diagnostic-insights-section .grid,
        .pdf-export-render.mw-print-report--individual .individual-charts-section .individual-print-chart-grid { align-items: start !important; }
        .pdf-export-render.mw-print-report--individual .individual-diagnostic-insights-section .unified-chart-card { height: auto !important; min-height: 0 !important; }
        /* Reduce empty space around signatures without reducing the type size. */
        .pdf-export-render.mw-print-report--individual .signature-section { margin-top: 10px !important; }
        .pdf-export-render.mw-print-report--individual .premium-report-signature > div:last-child { margin-top: 12px !important; }
        .pdf-export-render.mw-print-report--individual .individual-priority-table table { font-size: 13px !important; line-height: 1.5 !important; }
        /* Mastery report: compact official header, olive identity and readable A4 tables. */
        .pdf-export-render.mw-print-report--mastery .official-report-header { padding: 12px 16px !important; box-shadow: none !important; }
        .pdf-export-render.mw-print-report--mastery .official-report-header img { height: 46px !important; max-height: 46px !important; padding: 3px !important; margin-bottom: 3px !important; }
        .pdf-export-render.mw-print-report--mastery .official-report-header p { line-height: 1.35 !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-summary { gap: 8px !important; padding: 9px !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-summary__content,
        .pdf-export-render.mw-print-report--mastery .premium-report-summary-metric { padding: 9px !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-summary__metrics { gap: 6px !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-info-cell,
        .pdf-export-render.mw-print-report--mastery .premium-report-narrative { padding: 9px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-data-grid { gap: 7px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-grid-two,
        .pdf-export-render.mw-print-report--mastery .mastery-print-diagnostics { align-items: start !important; gap: 10px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-indicator-highlights { gap: 8px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-indicator-highlights .premium-report-info-cell { background: #f3f6ee !important; border-color: #d5dfce !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table table,
        .pdf-export-render.mw-print-report--mastery .mastery-distribution-table table,
        .pdf-export-render.mw-print-report--mastery .mastery-two-column-table table { font-size: 12.5px !important; line-height: 1.5 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table td,
        .pdf-export-render.mw-print-report--mastery .mastery-distribution-table td,
        .pdf-export-render.mw-print-report--mastery .mastery-two-column-table td { padding: 5px 8px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-diagnostics .diagnostic-report-fishbone { min-height: 0 !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-chart-card { border-color: #d5dfce !important; }
        .pdf-export-render.mw-print-report--mastery .signature-section { margin-top: 12px !important; gap: 8px !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-signature { padding: 9px !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-signature > div:last-child { margin-top: 16px !important; }
        /* Match the individual report design family while keeping the mastery olive palette. */
        .pdf-export-render.mw-print-report--mastery .premium-report-section-title { color: #183f33 !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-section-title span { background: #315a42 !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-subtitle { color: #254b38 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table thead,
        .pdf-export-render.mw-print-report--mastery .mastery-distribution-table thead { background: #254b38 !important; color: #fff !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table tr.bg-emerald-50 { background: #edf4eb !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block { background: #f0f5ed !important; border-color: #cfddc8 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block > div:first-child p { color: #315a42 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block > p,
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block > div:nth-child(2) > div { border-color: #d9e4d3 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-diagnostics { display: block !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-diagnostics > * + * { margin-top: 12px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-full .diagnostic-report-fishbone > div:nth-child(2) { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 8px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-full .diagnostic-report-fishbone > div:nth-child(2) > div { padding: 9px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-full .diagnostic-report-fishbone li { line-height: 1.5 !important; }
      `;
      frameDoc.head.appendChild(pdfStyle);
      clone.querySelectorAll<HTMLDetailsElement>('details').forEach((details) => { details.open = true; });
      // Canvas rendering with nonzero letter spacing breaks Arabic joining.
      [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))].forEach(element => element.style.setProperty('letter-spacing', 'normal', 'important'));
      clone.style.width = '794px'; clone.style.maxWidth = 'none'; clone.style.boxSizing = 'border-box';
      frameDoc.body.appendChild(clone);
      await Promise.all(Array.from(clone.querySelectorAll('img')).map(image => image.decode().catch(() => undefined)));
      const base = clone.getBoundingClientRect();
      // Charts and signatures must travel as a whole when they fit on a page.
      // Rows and paragraphs remain individually splittable for long tables.
      const ranges: Array<[number, number]> = Array.from(clone.querySelectorAll('tr, p, h1, h2, h3, h4, li, .unified-chart-card, .diagnostic-report-visual, .signature-section, [data-pdf-keep]')).map(el => {
        const rect = el.getBoundingClientRect(); return [Math.max(0, rect.top - base.top - 3), rect.bottom - base.top + 3] as [number, number];
      });
      // Keep table and card subtitles with the first content row; avoid orphan headings.
      clone.querySelectorAll('.mw-print-report--mastery .premium-report-subtitle').forEach(el => {
        const rect = el.getBoundingClientRect();
        ranges.push([Math.max(0, rect.top - base.top - 3), rect.bottom - base.top + 65]);
      });
      // Keep each section title with at least the beginning of its content.
      clone.querySelectorAll('.premium-report-section-title').forEach(el => {
        const rect = el.getBoundingClientRect();
        ranges.push([Math.max(0, rect.top - base.top - 3), rect.bottom - base.top + 55]);
      });
      const pages = paginateReport(Math.ceil(base.height), 1088, ranges);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      for (let i = 0; i < pages.length; i++) {
        const [top, bottom] = pages[i];
        const canvas = await html2canvas(clone, { backgroundColor: '#ffffff', scale: 1.4, x: 0, y: top, width: 794, height: bottom - top, windowWidth: 1100, logging: false, useCORS: true });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 6, 6, 198, (bottom - top) * 198 / 794, undefined, 'FAST');
        canvas.width = 0; canvas.height = 0;
      }
      setUrl(URL.createObjectURL(pdf.output('blob')));
    } catch (cause) {
      console.error('PDF export failed', cause);
      setError('تعذر إنشاء ملف PDF. حاول مرة أخرى، وإذا استمرت المشكلة جرّب متصفحًا آخر.');
    } finally { frame?.remove(); setBusy(false); }
  }
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-black text-slate-900">التقرير الختامي</h2><p className="text-sm text-slate-500">تقرير تفصيلي قابل للتصدير بصيغة PDF على مقاس A4.</p></div>
      <button type="button" disabled={busy} onClick={createPdf} className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? 'جارٍ إعداد ملف PDF…' : 'تصدير PDF'}</button>
    </div>
    {url && <p className="mt-3 text-sm" role="status"><a className="inline-block rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" href={url} download={filename}>تنزيل ملف PDF</a> <span>الملف جاهز للتنزيل.</span></p>}
    {error && <p className="mt-3 text-sm text-red-800" role="alert">{error}</p>}
  </div>;
}
