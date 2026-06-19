import {
  UnifiedBoxPlotStats,
  ParetoPoint,
  QualityMetricItem,
  CumulativePoint,
  ThresholdGapPoint,
} from "./analyticsVisualTypes";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function round2(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function extractNumericValueFromUnknownPoint(point: unknown): number {
  if (!point || typeof point !== "object") return 0;

  const record = point as Record<string, unknown>;

  const preferredKeys = [
    "cumulative",
    "percent",
    "percentage",
    "value",
    "y",
    "total",
    "score",
    "amount",
    "metric",
    "result",
    "gap",
    "delta",
    "difference",
    "distance",
  ];

  for (const key of preferredKeys) {
    const candidate = record[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  for (const candidate of Object.values(record)) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return 0;
}

export function renderBoxPlotSummaryHTML(stats: UnifiedBoxPlotStats) {
  return `
  <div class="report-section">
    <h3>التشتت الإحصائي</h3>

    <table class="report-table">
      <tr><td>الوسيط</td><td>${escapeHtml(stats.median)}</td></tr>
      <tr><td>Q1</td><td>${escapeHtml(stats.q1)}</td></tr>
      <tr><td>Q3</td><td>${escapeHtml(stats.q3)}</td></tr>
      <tr><td>الحد الأدنى</td><td>${escapeHtml(stats.min)}</td></tr>
      <tr><td>الحد الأعلى</td><td>${escapeHtml(stats.max)}</td></tr>
    </table>
  </div>
  `;
}

export function renderParetoSummaryHTML(points: ParetoPoint[]) {
  const top = points.slice(0, 5);

  return `
  <div class="report-section">
    <h3>أكبر الفجوات</h3>

    <ul>
      ${top
        .map(
          (point) => `
        <li>${escapeHtml(point.label)}: ${escapeHtml(point.value)}</li>
      `
        )
        .join("")}
    </ul>
  </div>
  `;
}

export function renderQualityMetricsHTML(metrics: QualityMetricItem[]) {
  return `
  <div class="report-section">
    <h3>مؤشرات الجودة</h3>

    <table class="report-table">
      ${metrics
        .map(
          (metric) => `
        <tr>
          <td>${escapeHtml(metric.label)}</td>
          <td>${escapeHtml(metric.value)}</td>
        </tr>
      `
        )
        .join("")}
    </table>
  </div>
  `;
}

export function renderCumulativeSummaryHTML(points: CumulativePoint[]) {
  const lastPoint = points[points.length - 1];
  const lastValue = extractNumericValueFromUnknownPoint(lastPoint);

  return `
  <div class="report-section">
    <h3>التقدم التراكمي</h3>

    <p>
      آخر قيمة تراكمية:
      <strong>${escapeHtml(round2(lastValue))}</strong>
    </p>
  </div>
  `;
}

export function renderThresholdGapSummaryHTML(points: ThresholdGapPoint[]) {
  const total = points.reduce(
    (sum, point) => sum + extractNumericValueFromUnknownPoint(point),
    0
  );
  const average = points.length > 0 ? total / points.length : 0;

  return `
  <div class="report-section">
    <h3>الفجوة عن الحد</h3>

    <p>
      متوسط الفجوة:
      <strong>${escapeHtml(round2(average))}</strong>
    </p>
  </div>
  `;
}