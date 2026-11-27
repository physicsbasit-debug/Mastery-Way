import React from 'react';
import type { RadarSkillEntry } from './diagnosticTypes';

type ChartDatum = Record<string, string | number>;

/** PDF-only bars with labels on the same row as their values.
 * The screen continues to use Recharts. The PDF clone enables this markup.
 */
export function PdfStaticBars({
  data, valueKey, labelKey = 'name', suffix = '', color = '#a87526', maximum,
}: {
  data: ChartDatum[];
  valueKey: string;
  labelKey?: string;
  suffix?: string;
  color?: string;
  maximum?: number;
}) {
  const values = data.map((item) => {
    const n = Number(item[valueKey]);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  });
  const scale = Math.max(1, maximum ?? Math.max(0, ...values));

  return (
    <div className="mw-pdf-static-chart mw-pdf-static-bars" data-pdf-chart="bars" style={{ display: 'none', width: '100%' }}>
      {data.map((item, index) => {
        const label = String(item[labelKey] ?? '');
        const value = values[index];
        const fraction = Math.min(100, value / scale * 100);
        return (
          <div
            className="mw-pdf-bar-row"
            data-pdf-label={label}
            key={`${index}-${label}`}
            dir="rtl"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: index === data.length - 1 ? 'none' : '1px solid #edf2f7', minHeight: 34, boxSizing: 'border-box' }}
          >
            <span style={{ flex: '0 0 32%', maxWidth: 154, textAlign: 'right', fontSize: 12, lineHeight: 1.5, fontWeight: 700, color: '#334155', overflowWrap: 'anywhere' }}>{label}</span>
            <div style={{ minWidth: 0, flex: '1 1 0%', height: 14, borderRadius: 10, background: '#eef2f7', overflow: 'hidden' }}>
              <div className="mw-pdf-bar-fill" data-pdf-value={value} style={{ width: `${fraction}%`, height: '100%', background: color, borderRadius: 10 }} />
            </div>
            <span dir="ltr" style={{ flex: '0 0 58px', textAlign: 'left', fontSize: 12, whiteSpace: 'nowrap', fontWeight: 700, color: '#334155' }}>{value}{suffix}</span>
          </div>
        );
      })}
    </div>
  );
}

function polygonPoints(count: number, fraction: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
    return `${(150 + Math.cos(angle) * 88 * fraction).toFixed(2)},${(102 + Math.sin(angle) * 88 * fraction).toFixed(2)}`;
  }).join(' ');
}

/** Fixed viewBox and explicit data legend prevent a tiny or mislabelled PDF radar. */
export function PdfStaticRadar({ data, color = '#075b49' }: { data: RadarSkillEntry[]; color?: string }) {
  if (data.length < 3) return null;
  const count = data.length;
  const points = data.map((entry, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
    const raw = Number(entry.percent);
    const fraction = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw / 100)) : 0;
    return `${(150 + Math.cos(angle) * 88 * fraction).toFixed(2)},${(102 + Math.sin(angle) * 88 * fraction).toFixed(2)}`;
  }).join(' ');

  return (
    <div className="mw-pdf-static-chart mw-pdf-static-radar" data-pdf-chart="radar" style={{ display: 'none', width: '100%' }}>
      <svg viewBox="0 0 300 210" width="280" height="196" role="img" aria-label="رادار أداء المهارات" style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}>
        {[0.25, 0.5, 0.75, 1].map((fraction) => <polygon key={fraction} points={polygonPoints(count, fraction)} fill="none" stroke="#cbd5e1" strokeWidth="1" />)}
        {Array.from({ length: count }, (_, index) => <line key={index} x1="150" y1="102" x2={(150 + Math.cos(-Math.PI / 2 + index * 2 * Math.PI / count) * 88).toFixed(2)} y2={(102 + Math.sin(-Math.PI / 2 + index * 2 * Math.PI / count) * 88).toFixed(2)} stroke="#cbd5e1" strokeWidth="1" />)}
        <polygon points={points} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
      </svg>
      <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '5px 10px', marginTop: 2 }}>
        {data.map((entry, index) => (
          <div key={`${index}-${entry.skill}`} data-pdf-label={entry.skill} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 11, fontWeight: 700, color: '#475569', borderBottom: '1px solid #f1f5f9', padding: '2px 0' }}>
            <span style={{ overflowWrap: 'anywhere' }}>{entry.skill}</span>
            <span dir="ltr" style={{ whiteSpace: 'nowrap' }}>{entry.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
