import React from 'react';
import { paginateExamWithoutSignatureOrphan, paginateReport } from './pdfPagination';

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
      // PDF-only charts contain the same report data and do not require live resizing.
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
        /* Mastery report: compact official header, emerald identity and readable A4 tables. */
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
        .pdf-export-render.mw-print-report--mastery .mastery-indicator-highlights .premium-report-info-cell { background: #edf6f1 !important; border-color: #bddbd0 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table table,
        .pdf-export-render.mw-print-report--mastery .mastery-distribution-table table,
        .pdf-export-render.mw-print-report--mastery .mastery-two-column-table table { font-size: 12.5px !important; line-height: 1.5 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table td,
        .pdf-export-render.mw-print-report--mastery .mastery-distribution-table td,
        .pdf-export-render.mw-print-report--mastery .mastery-two-column-table td { padding: 5px 8px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-diagnostics .diagnostic-report-fishbone { min-height: 0 !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-chart-card { border-color: #bddbd0 !important; }
        .pdf-export-render.mw-print-report--mastery .signature-section { margin-top: 12px !important; gap: 8px !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-signature { padding: 9px !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-signature > div:last-child { margin-top: 16px !important; }
        /* Mastery uses the individual report's dark official cover language, not its track color. */
        .pdf-export-render.mw-print-report--mastery .official-report-header {
          background: linear-gradient(110deg, #073e34 0%, #075b49 65%, #16796c 100%) !important;
          border-color: #b59a58 !important; border-radius: 24px !important;
          padding: 20px 18px !important; margin-bottom: 14px !important;
        }
        .pdf-export-render.mw-print-report--mastery .official-report-header h1,
        .pdf-export-render.mw-print-report--mastery .official-report-header p,
        .pdf-export-render.mw-print-report--mastery .official-report-header .text-slate-800,
        .pdf-export-render.mw-print-report--mastery .official-report-header .text-slate-500 { color: #fff !important; }
        .pdf-export-render.mw-print-report--mastery .official-report-header img {
          background: #fff !important; border-radius: 12px !important; padding: 4px !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          align-items: start !important; gap: 9px !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-last {
          grid-column: 1 / span 2 !important;
          width: 100% !important;
          min-width: 0 !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          direction: rtl !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-rtl-list-item {
          display: grid !important;
          grid-template-columns: 10px minmax(0, 1fr) !important;
          direction: rtl !important;
          align-items: start !important;
          column-gap: 7px !important;
          text-align: right !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-rtl-list-marker {
          display: block !important;
          grid-column: 1 !important;
          color: #075b49 !important;
          text-align: center !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-rtl-list-text {
          display: block !important;
          grid-column: 2 !important;
          text-align: right !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-last ul {
          columns: 2 !important; column-gap: 24px !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-card {
          padding: 11px !important; break-inside: avoid !important;
        }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-card ul { margin-top: 6px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-card li { line-height: 1.55 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table,
        .pdf-export-render.mw-print-report--mastery .mastery-distribution-table { break-inside: avoid !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-indicators-section > .mastery-indicator-highlights { margin-bottom: 10px !important; }
        /* Preserve the shared report geometry while using the mastery emerald palette. */
        .pdf-export-render.mw-print-report--mastery .premium-report-section-title { color: #075b49 !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-section-title span { background: #075b49 !important; }
        .pdf-export-render.mw-print-report--mastery .premium-report-subtitle { color: #075b49 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table thead,
        .pdf-export-render.mw-print-report--mastery .mastery-distribution-table thead { background: #075b49 !important; color: #fff !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-judgement-table tr.bg-emerald-50 { background: #edf6f1 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block { background: #edf6f1 !important; border-color: #bddbd0 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block > div:first-child p { color: #075b49 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block > p,
        .pdf-export-render.mw-print-report--mastery .mastery-diagnostic-insights-section .diagnostic-report-block > div:nth-child(2) > div { border-color: #bddbd0 !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-diagnostics { display: block !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-print-diagnostics > * + * { margin-top: 12px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-full .diagnostic-report-fishbone > div:nth-child(2) { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 8px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-full .diagnostic-report-fishbone > div:nth-child(2) > div { padding: 9px !important; }
        .pdf-export-render.mw-print-report--mastery .mastery-fishbone-full .diagnostic-report-fishbone li { line-height: 1.5 !important; }
        /* Mastery quick overview: same emerald hero as the report header. */
        .pdf-export-render.mw-print-report--mastery .premium-report-summary {
          border-color: #bddbd0 !important;
          background: #edf6f1 !important;
        }
        .pdf-export-render.mw-print-report--mastery .premium-report-summary__content {
          background: linear-gradient(135deg, #073e34 0%, #075b49 70%, #16796c 100%) !important;
          color: #fff !important;
        }
        .pdf-export-render.mw-print-report--mastery .premium-report-summary__content h2,
        .pdf-export-render.mw-print-report--mastery .premium-report-summary__content p,
        .pdf-export-render.mw-print-report--mastery .premium-report-summary__eyebrow {
          color: #fff !important;
        }
        .pdf-export-render.mw-print-report--mastery .premium-report-summary__eyebrow {
          border-color: rgba(255,255,255,.35) !important;
          background: rgba(255,255,255,.12) !important;
        }
        .pdf-export-render.mw-print-report--mastery .premium-report-summary-metric--royal {
          --summary-accent: #075b49;
        }
        /* Exam documentary charts: avoid a stranded half-width fifth card. */
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          align-items: start !important;
          gap: 10px !important;
        }
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid > :last-child:nth-child(odd) {
          grid-column: 1 / -1 !important;
          width: 100% !important;
          max-width: none !important;
        }
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid > :last-child:nth-child(odd) .recharts-responsive-container {
          max-width: 520px !important;
          margin-inline: auto !important;
        }
        /* Keep the radar and its explanation as independent, naturally sized cards. */
        .pdf-export-render.mw-print-report--exam .diagnostic-report-visual {
          align-self: start !important;
          min-height: 0 !important;
        }
        /* Individual diagnosis: do not stretch the shorter comparison chart
           to the radar card's height. Keep both intrinsic chart sizes. */
        .pdf-export-render.mw-print-report--individual .individual-radar-comparison-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          align-items: start !important;
          gap: 10px !important;
        }
        .pdf-export-render.mw-print-report--individual .individual-radar-comparison-grid > * {
          min-width: 0 !important;
          height: auto !important;
          min-height: 0 !important;
          align-self: start !important;
        }
        /* Final visual balance: shorter radar cards stay compact while the
           diagnostic causes use the available width more efficiently. */
        .pdf-export-render.mw-print-report--exam .exam-diagnostic-comparison-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr) !important;
          align-items: start !important;
          gap: 10px !important;
        }
        .pdf-export-render.mw-print-report--exam .exam-diagnostic-comparison-grid .diagnostic-report-fishbone > div:nth-child(2) {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 6px !important;
        }
        .pdf-export-render.mw-print-report--exam .exam-diagnostic-comparison-grid .diagnostic-report-fishbone > div:nth-child(2) > div {
          padding: 7px !important;
        }
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid > :last-child:nth-child(odd) .recharts-responsive-container,
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid > :last-child:nth-child(odd) .recharts-wrapper {
          max-width: 640px !important;
        }
        .pdf-export-render.mw-print-report--individual .individual-radar-comparison-grid {
          grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr) !important;
        }
        /* Recharts is already rendered before the PDF DOM is cloned.
           Do not enlarge its wrapper without re-rendering the SVG: that
           only creates empty space beneath the original 175px chart. */
        .pdf-export-render.mw-print-report--individual .individual-radar-comparison-grid .individual-top-loss-chart,
        .pdf-export-render.mw-print-report--individual .individual-radar-comparison-grid .individual-top-loss-chart .unified-chart-card {
          height: fit-content !important;
          min-height: 0 !important;
          align-self: start !important;
        }
        .pdf-export-render.mw-print-report--individual .individual-radar-comparison-grid .individual-top-loss-chart .recharts-responsive-container {
          height: 175px !important;
          min-height: 0 !important;
        }
        /* The cloned SVG retains its original viewport: keep the canvas
           at its rendered dimensions rather than pretending CSS can redraw it. */
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid > :last-child:nth-child(odd) > .flex {
          width: min(100%, 520px) !important;
          margin-inline: auto !important;
        }
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid > :last-child:nth-child(odd) > .flex > .min-w-0 {
          flex: 1 1 0% !important;
          min-width: 0 !important;
          width: auto !important;
        }
        .pdf-export-render.mw-print-report--exam .exam-documentary-chart-grid > :last-child:nth-child(odd) .recharts-responsive-container {
          width: 100% !important;
          max-width: none !important;
        }
        /* Route-scoped, data-identical PDF charts avoid frozen Recharts SVG geometry.
           Live widgets remain unchanged in the application interface. */
        .pdf-export-render.mw-print-report--exam .mw-pdf-chart-live,
        .pdf-export-render.mw-print-report--individual .mw-pdf-chart-live { display: none !important; }
        .pdf-export-render.mw-print-report--exam .mw-pdf-static-chart,
        .pdf-export-render.mw-print-report--individual .mw-pdf-static-chart {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          min-width: 0 !important;
        }
        .pdf-export-render.mw-print-report--exam .mw-pdf-bar-row,
        .pdf-export-render.mw-print-report--individual .mw-pdf-bar-row {
          break-inside: avoid !important;
        }
        /* Final A4 layout polish: preserve content and chart aspect ratios. */
        .pdf-export-render.mw-print-report--individual .individual-print-chart-grid {
          gap: 10px !important;
          align-items: start !important;
        }
        .pdf-export-render.mw-print-report--individual .individual-print-chart-grid > *,
        .pdf-export-render.mw-print-report--exam .unified-chart-card,
        .pdf-export-render.mw-print-report--mastery .premium-report-chart-card {
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        .pdf-export-render.mw-print-report--individual .individual-print-chart-grid .unified-chart-card {
          height: auto !important;
          min-height: 0 !important;
        }
        /* Long explanatory cards should wrap naturally rather than widen the page. */
        .pdf-export-render.mw-print-report--exam .diagnostic-report-fishbone,
        .pdf-export-render.mw-print-report--individual .diagnostic-report-fishbone,
        .pdf-export-render.mw-print-report--mastery .diagnostic-report-fishbone {
          min-width: 0 !important;
          overflow-wrap: break-word !important;
        }
        .pdf-export-render.mw-print-report--exam .premium-report-table th,
        .pdf-export-render.mw-print-report--exam .premium-report-table td,
        .pdf-export-render.mw-print-report--mastery .premium-report-table th,
        .pdf-export-render.mw-print-report--mastery .premium-report-table td {
          overflow-wrap: break-word !important;
          vertical-align: top !important;
        }
      `;
      frameDoc.head.appendChild(pdfStyle);
      clone.querySelectorAll<HTMLDetailsElement>('details').forEach((details) => { details.open = true; });
      // Canvas rendering with nonzero letter spacing breaks Arabic joining.
      [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))].forEach(element => element.style.setProperty('letter-spacing', 'normal', 'important'));
      clone.style.width = '794px'; clone.style.maxWidth = 'none'; clone.style.boxSizing = 'border-box';
      frameDoc.body.appendChild(clone);
      // Make sure every Tajawal weight used by the report is loaded in the frame before capture.
      await Promise.all(['400', '500', '700', '800', '900'].map(weight => frameDoc.fonts?.load(`${weight} 16px Tajawal`, 'أب12').catch(() => undefined)));
      await Promise.all(Array.from(clone.querySelectorAll('img')).map(image => image.decode().catch(() => undefined)));
      const base = clone.getBoundingClientRect();
      // Charts and signatures must travel as a whole when they fit on a page.
      // Rows and paragraphs remain individually splittable for long tables.
      const ranges: Array<[number, number]> = Array.from(clone.querySelectorAll('tr, p, h1, h2, h3, h4, li, .unified-chart-card, .diagnostic-report-visual, .signature-section, [data-pdf-keep]')).map(el => {
        const rect = el.getBoundingClientRect(); return [Math.max(0, rect.top - base.top - 3), rect.bottom - base.top + 3] as [number, number];
      });
      // A table's subtitle and its first row must share a page; the former
      // fixed-height guard was too short for some actual rendered tables.
      if (clone.classList.contains('mw-print-report--mastery')) {
        clone.querySelectorAll('.mastery-judgement-table, .mastery-distribution-table').forEach(section => {
          const heading = section.querySelector('.premium-report-subtitle');
          const firstRow = section.querySelector('tbody tr');
          if (!heading || !firstRow) return;
          const top = heading.getBoundingClientRect().top - base.top;
          const bottom = firstRow.getBoundingClientRect().bottom - base.top;
          ranges.push([Math.max(0, top - 4), bottom + 5]);
        });
      }
      // Keep table and card subtitles with the first content row; avoid orphan headings.
      (clone.classList.contains('mw-print-report--mastery') ? clone.querySelectorAll('.premium-report-subtitle') : []).forEach(el => {
        const rect = el.getBoundingClientRect();
        ranges.push([Math.max(0, rect.top - base.top - 3), rect.bottom - base.top + 65]);
      });
      // Keep section titles with actual first content, not an arbitrary
      // 55px guard that can leave a heading stranded on a page.
      clone.querySelectorAll<HTMLElement>('.premium-report-section-title').forEach(heading => {
        const rect = heading.getBoundingClientRect();
        const section = heading.closest('.report-flow, .report-section');
        const content = heading.nextElementSibling ?? section?.querySelector(':scope > :not(.premium-report-section-title)');
        const contentRect = content?.getBoundingClientRect();
        const firstContentBottom = contentRect && contentRect.bottom > rect.bottom
          ? Math.min(contentRect.bottom, rect.bottom + 150)
          : rect.bottom + 55;
        ranges.push([Math.max(0, rect.top - base.top - 3), firstContentBottom - base.top + 3]);
      });
      const examSignature = clone.classList.contains('mw-print-report--exam')
        ? clone.querySelector<HTMLElement>('.signature-section')
        : null;
      const signatureTop = examSignature
        ? examSignature.getBoundingClientRect().top - base.top
        : null;
      const pages = examSignature
        ? paginateExamWithoutSignatureOrphan(Math.ceil(base.height), ranges, signatureTop)
        : paginateReport(Math.ceil(base.height), 1088, ranges);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      for (let i = 0; i < pages.length; i++) {
        const [top, bottom] = pages[i];
        const canvas = await html2canvas(clone, { backgroundColor: '#ffffff', scale: 1.4, x: 0, y: top, width: 794, height: bottom - top, windowWidth: 1100, logging: false, useCORS: true });
        if (i) pdf.addPage();
        // A signature-only final fragment may be joined to the preceding page.
        // Scale that one image proportionally (never more than 5%) to stay
        // within A4's printable 6mm margins. Other pages are identical.
        const sliceHeight = bottom - top;
        const finalScale = Math.min(1, 1140 / sliceHeight);
        const imageWidthMm = 198 * finalScale;
        const imageLeftMm = 6 + (198 - imageWidthMm) / 2;
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', imageLeftMm, 6, imageWidthMm, sliceHeight * imageWidthMm / 794, undefined, 'FAST');
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
      <button type="button" disabled={busy} onClick={createPdf} className="mw-route-action rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? 'جارٍ إعداد ملف PDF…' : 'تصدير PDF'}</button>
    </div>
    {url && <p className="mt-3 text-sm" role="status"><a className="mw-route-action inline-block rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" href={url} download={filename}>تنزيل ملف PDF</a> <span>الملف جاهز للتنزيل.</span></p>}
    {error && <p className="mt-3 text-sm text-red-800" role="alert">{error}</p>}
  </div>;
}
