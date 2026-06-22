import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartCard, EmptyChartMessage, formatChartValue } from './UnifiedVisuals';
import type { RadarSkillEntry } from './diagnosticTypes';

export function RadarSkillChart({
  title = 'خريطة الرادار للمهارات',
  description = 'تعرض الصورة العامة لأداء المهارات مع قراءة حذرة عند ضعف التمثيل.',
  data,
  compact = false,
}: {
  title?: string;
  description?: string;
  data: RadarSkillEntry[];
  compact?: boolean;
}) {
  const eligible = data.length >= 3;
  return (
    <ChartCard title={title} description={description} compact={compact}>
      {!eligible ? (
        <EmptyChartMessage>لا يظهر مخطط الرادار إلا عند وجود 3 مهارات فأكثر؛ حتى لا نرسم طبقًا مكسورًا ونسميه تحليلًا.</EmptyChartMessage>
      ) : (
        <ResponsiveContainer width="100%" height={compact ? 235 : 310}>
          <RadarChart data={data} outerRadius={compact ? 75 : 105} margin={{ top: 12, right: 20, bottom: 12, left: 20 }}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value) => [`${formatChartValue(value)}%`, 'الأداء']} />
            <Radar name="الأداء" dataKey="percent" stroke="#2563eb" fill="#2563eb" fillOpacity={0.22} />
          </RadarChart>
        </ResponsiveContainer>
      )}
      {data.some((entry) => (entry.itemCount ?? 2) <= 1) ? (
        <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-800">
          تنبيه: بعض المهارات ممثلة بمفردة واحدة؛ لذلك يُقرأ مخطط الرادار بوصفه مؤشرًا بصريًا أوليًا لا حكمًا نهائيًا.
        </p>
      ) : null}
    </ChartCard>
  );
}
