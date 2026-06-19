import { ReactNode } from "react";

export interface EducationalSummaryItem {
  title: string;
  text: string;
  points?: string[];
}

export interface EducationalSummaryCardProps {
  items: EducationalSummaryItem[];
  title?: string;
  footer?: ReactNode;
}

function getGridClass(itemsCount: number): string {
  if (itemsCount >= 3) return "md:grid-cols-3";
  if (itemsCount === 2) return "md:grid-cols-2";
  return "md:grid-cols-1";
}

export default function EducationalSummaryCard({
  items,
  title = "الخلاصة التربوية",
  footer,
}: EducationalSummaryCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-sky-100/80 bg-gradient-to-b from-sky-50/90 to-white p-5 text-right shadow-sm print:rounded-none print:border-slate-300 print:bg-white print:shadow-none lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-extrabold tracking-tight text-sky-950 lg:text-base">
          {title}
        </div>
      </div>

      <div className={`mt-5 grid gap-4 ${getGridClass(items.length)}`}>
        {items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="rounded-[20px] border border-white/90 bg-white/90 p-4 shadow-sm"
          >
            <div className="text-xs font-extrabold tracking-wide text-slate-900">
              {item.title}
            </div>

            <p className="mt-3 text-sm leading-8 text-slate-700">{item.text}</p>

            {item.points && item.points.length > 0 ? (
              <ul className="mt-4 space-y-1.5 pr-5 text-sm leading-7 text-slate-700 list-disc">
                {item.points.map((point, pointIndex) => (
                  <li key={`${point}-${pointIndex}`}>{point}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </div>
  );
}