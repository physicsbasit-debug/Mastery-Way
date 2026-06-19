import { formatLatinDate, toLatinDigits } from './numberFormat';
export interface OfficialReportHeaderField {
  label: string;
  value: string;
}

export interface OfficialReportHeaderProps {
  reportTitle: string;
  schoolName: string;
  teacherName: string;
  className: string;
  sectionName: string;
  generatedAt?: string;
  academicYear?: string;
  subjectName?: string;
  trackLabel?: string;
  ministryName?: string;
  countryName?: string;
  logoSrc?: string;
  extraFields?: OfficialReportHeaderField[];
}

function formatHeaderValue(value?: string): string {
  if (!value) return "—";

  const normalized = value.trim();
  return normalized === "" ? "—" : toLatinDigits(normalized);
}

function formatHeaderDate(value?: string): string {
  return formatLatinDate(value);
}

function HeaderFieldCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 print:border-slate-300 print:bg-white">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function OmaniEducationLogoFallback({
  countryName,
  ministryName,
}: {
  countryName: string;
  ministryName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="rounded-full border border-slate-300 px-4 py-1 text-[11px] font-semibold tracking-wide text-slate-500 print:border-slate-400">
        الخنجر والسيفان
      </div>
      <div className="mt-3 text-2xl font-extrabold leading-tight text-slate-900 print:text-[24px]">
        {countryName}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-800 print:text-[20px]">
        {ministryName}
      </div>
    </div>
  );
}

export default function OfficialReportHeader({
  reportTitle,
  schoolName,
  teacherName,
  className,
  sectionName,
  generatedAt,
  academicYear,
  subjectName,
  trackLabel,
  ministryName = "وزارة التعليم",
  countryName = "سلطنة عُمان",
  logoSrc,
  extraFields = [],
}: OfficialReportHeaderProps) {
  const baseFields: OfficialReportHeaderField[] = [
    { label: "اسم المدرسة", value: formatHeaderValue(schoolName) },
    { label: "اسم المعلم", value: formatHeaderValue(teacherName) },
    { label: "الصف", value: formatHeaderValue(className) },
    { label: "الشعبة", value: formatHeaderValue(sectionName) },
  ];

  const secondaryFields: OfficialReportHeaderField[] = [
    ...(subjectName
      ? [{ label: "المادة / المجال", value: formatHeaderValue(subjectName) }]
      : []),
    ...(trackLabel
      ? [{ label: "المسار التحليلي", value: formatHeaderValue(trackLabel) }]
      : []),
    ...(academicYear
      ? [{ label: "العام الدراسي", value: formatHeaderValue(academicYear) }]
      : []),
    ...(generatedAt
      ? [{ label: "تاريخ التقرير", value: formatHeaderDate(generatedAt) }]
      : []),
    ...extraFields.map((field) => ({
      label: field.label,
      value: formatHeaderValue(field.value),
    })),
  ];

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm print:mb-4 print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <div className="grid gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-start print:grid-cols-[0.62fr_1.38fr] print:gap-4">
        <div className="flex items-start justify-center lg:justify-start print:justify-start">
          {logoSrc ? (
            <div className="flex w-full items-center justify-center lg:justify-start print:justify-start">
              <img
                src={logoSrc}
                alt={`${countryName} - ${ministryName}`}
                className="max-h-32 w-auto object-contain print:max-h-24"
              />
            </div>
          ) : (
            <OmaniEducationLogoFallback
              countryName={countryName}
              ministryName={ministryName}
            />
          )}
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold tracking-wide text-slate-500 print:text-xs">
            تقرير تحليلي رسمي
          </div>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-slate-900 print:text-[26px]">
            {formatHeaderValue(reportTitle)}
          </h1>

          <div className="mt-4 h-1.5 rounded-full bg-slate-800 print:mt-3 print:h-1" />

          <div className="mt-5 grid gap-3 md:grid-cols-2 print:mt-4 print:gap-2">
            {baseFields.map((field) => (
              <HeaderFieldCard
                key={`${field.label}_${field.value}`}
                label={field.label}
                value={field.value}
              />
            ))}
          </div>

          {secondaryFields.length > 0 ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4 print:mt-2 print:gap-2 print:grid-cols-2">
              {secondaryFields.map((field) => (
                <HeaderFieldCard
                  key={`${field.label}_${field.value}`}
                  label={field.label}
                  value={field.value}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
