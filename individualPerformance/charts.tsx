import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, EmptyChartMessage, HorizontalChartShell } from '../shared/UnifiedVisuals';
import type { IndividualPerformanceAnalysisResult } from './types';

type IndividualChartProps = { result: IndividualPerformanceAnalysisResult; compact?: boolean };

function formatTooltipValue(value: unknown) {
  if (Array.isArray(value)) return value.join(' - ');
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  return String(value ?? '');
}


export function StudentMasteryPositionChart({ result, compact = false }: IndividualChartProps) {
  const data = [
    { name: 'نسبة الطالب', value: result.summary.percent },
    { name: 'حد الإتقان', value: result.summary.masteryCutoffPercent },
  ];
  const chartHeight = compact ? 165 : 230;

  return (
    <ChartCard title="موقع الطالب من حد الإتقان" description="يقارن هذا الرسم نسبة الطالب بحد الإتقان المعتمد في الورقة." compact={compact}>
      <HorizontalChartShell labels={data.map((item) => item.name)} height={chartHeight} labelWidthClass={compact ? "w-24 md:w-28" : "w-28 md:w-36"} topPadding={compact ? 12 : 20} bottomPadding={compact ? 26 : 38}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 15, right: 48, left: 4, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <YAxis dataKey="name" type="category" hide />
            <Tooltip formatter={(value) => [`${formatTooltipValue(value)}%`, 'النسبة']} />
            <Bar dataKey="value" radius={[10, 10, 10, 10]}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={index === 0 ? '#5F6F3A' : '#2F3A1F'} />
              ))}
              <LabelList dataKey="value" position="right" offset={8} formatter={(value: unknown) => `${formatTooltipValue(value)}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </HorizontalChartShell>
    </ChartCard>
  );
}

export function ItemStatusChart({ result, compact = false }: IndividualChartProps) {
  const data = [
    { name: 'صحيحة', value: result.itemStatus.correctCount, fill: '#16a34a' },
    { name: 'جزئية', value: result.itemStatus.partialCount, fill: '#7A8C4A' },
    { name: 'خاطئة', value: result.itemStatus.wrongCount, fill: '#f97316' },
    { name: 'متروكة', value: result.itemStatus.omittedCount, fill: '#dc2626' },
  ].filter((item) => item.value > 0);

  return (
    <ChartCard title="حالة المفردات" description="يوضح عدد المفردات الصحيحة والجزئية والخاطئة والمتروكة." compact={compact}>
      {data.length === 0 ? (
        <EmptyChartMessage>لا توجد مفردات للعرض.</EmptyChartMessage>
      ) : (
        <ResponsiveContainer width="100%" height={compact ? 175 : 250}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={compact ? 40 : 55} outerRadius={compact ? 64 : 88} paddingAngle={2} label>
              {data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(value) => [formatTooltipValue(value), 'العدد']} />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
        {data.map((item) => (
          <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            {item.name}: <span className="font-black text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export function SkillPerformanceChart({ result, compact = false }: IndividualChartProps) {
  const data = result.skills.map((skill) => ({ name: skill.skill, percent: skill.percent }));
  const chartHeight = compact ? Math.max(165, data.length * 34) : Math.max(260, data.length * 48);

  return (
    <ChartCard title="أداء الطالب حسب المهارات" description="يعرض نسبة الأداء في كل مهارة مرتبطة بالورقة." compact={compact}>
      <HorizontalChartShell labels={data.map((item) => item.name)} height={chartHeight} labelWidthClass={compact ? "w-28 md:w-32" : "w-32 md:w-40"} topPadding={compact ? 10 : 14} bottomPadding={compact ? 24 : 36}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 48, left: 4, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <YAxis dataKey="name" type="category" hide />
            <Tooltip formatter={(value) => [`${formatTooltipValue(value)}%`, 'الأداء']} />
            <Bar dataKey="percent" fill="#5F6F3A" radius={[10, 10, 10, 10]}>
              <LabelList dataKey="percent" position="right" offset={8} formatter={(value: unknown) => `${formatTooltipValue(value)}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </HorizontalChartShell>
    </ChartCard>
  );
}

export function SkillLossChart({ result, compact = false }: IndividualChartProps) {
  const data = result.skills.map((skill) => ({ name: skill.skill, loss: skill.loss }));
  const chartHeight = compact ? Math.max(165, data.length * 34) : Math.max(260, data.length * 48);

  return (
    <ChartCard title="الفقد حسب المهارات" description="يساعد على تحديد المهارات الأكثر تأثيرًا في انخفاض الدرجة." compact={compact}>
      <HorizontalChartShell labels={data.map((item) => item.name)} height={chartHeight} labelWidthClass={compact ? "w-28 md:w-32" : "w-32 md:w-40"} topPadding={compact ? 10 : 14} bottomPadding={compact ? 24 : 36}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 48, left: 4, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" hide />
            <Tooltip formatter={(value) => [formatTooltipValue(value), 'الفقد']} />
            <Bar dataKey="loss" fill="#f97316" radius={[10, 10, 10, 10]}>
              <LabelList dataKey="loss" position="right" offset={8} formatter={(value: unknown) => formatTooltipValue(value)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </HorizontalChartShell>
    </ChartCard>
  );
}

export function ErrorPatternsChart({ result, compact = false }: IndividualChartProps) {
  const data = result.errorPatterns.slice(0, 6).map((item) => ({ name: item.errorType, count: item.count }));
  const chartHeight = compact ? Math.max(165, data.length * 34) : Math.max(260, data.length * 50);

  return (
    <ChartCard title="أكثر أنماط الخطأ ظهورًا" description="يعتمد على ترميز نوع الخطأ للمفردات غير المكتملة." compact={compact}>
      {data.length === 0 ? (
        <EmptyChartMessage>لا توجد أنماط خطأ مرمزة كافية لعرض الرسم.</EmptyChartMessage>
      ) : (
        <HorizontalChartShell labels={data.map((item) => item.name)} height={chartHeight} labelWidthClass={compact ? "w-36 md:w-44" : "w-44 md:w-56"} topPadding={compact ? 10 : 14} bottomPadding={compact ? 24 : 36}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 48, left: 4, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" hide />
              <Tooltip formatter={(value) => [formatTooltipValue(value), 'التكرار']} />
              <Bar dataKey="count" fill="#7A8C4A" radius={[10, 10, 10, 10]}>
                <LabelList dataKey="count" position="right" offset={8} formatter={(value: unknown) => formatTooltipValue(value)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </HorizontalChartShell>
      )}
    </ChartCard>
  );
}

export function TopLossItemsChart({ result, compact = false }: IndividualChartProps) {
  const data = result.topLossItems.slice(0, 8).map((item) => ({ name: item.label, loss: item.loss }));

  return (
    <ChartCard title="أعلى المفردات تأثيرًا في الفقد" description="يعرض المفردات التي فقد فيها الطالب أكبر قدر من الدرجات." compact={compact}>
      {data.length === 0 ? (
        <EmptyChartMessage>لا توجد مفردات ذات فقد واضح في البيانات الحالية.</EmptyChartMessage>
      ) : (
        <ResponsiveContainer width="100%" height={compact ? 175 : 250}>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [formatTooltipValue(value), 'الفقد']} />
            <Bar dataKey="loss" fill="#dc2626" radius={[10, 10, 0, 0]}>
              <LabelList dataKey="loss" position="top" formatter={(value: unknown) => formatTooltipValue(value)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function PriorityLineChart({ result, compact = false }: IndividualChartProps) {
  const data = result.priorities.map((priority) => ({ name: `أولوية ${priority.rank}`, percent: priority.percent, skill: priority.skill }));

  return (
    <ChartCard title="ترتيب أولويات التدخل" description="يرتب المهارات التي تبدأ بها خطة المتابعة وفق الأداء ثم الفقد." compact={compact}>
      {data.length === 0 ? (
        <EmptyChartMessage>لا توجد أولويات كافية للعرض.</EmptyChartMessage>
      ) : (
        <ResponsiveContainer width="100%" height={compact ? 170 : 230}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="skill" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value) => [`${formatTooltipValue(value)}%`, 'الأداء']} />
            <Line type="monotone" dataKey="percent" stroke="#2F3A1F" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
