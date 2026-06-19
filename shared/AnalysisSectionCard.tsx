import { ReactNode } from "react";

export interface AnalysisSectionAction {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface AnalysisSectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: AnalysisSectionAction[];
  headerAside?: ReactNode;
  className?: string;
  contentClassName?: string;
  isPrintSection?: boolean;
}

function SectionActionButton({
  action,
}: {
  action: AnalysisSectionAction;
}) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 print:hidden"
    >
      {action.icon}
      <span>{action.label}</span>
    </button>
  );
}

export default function AnalysisSectionCard({
  title,
  subtitle,
  children,
  actions = [],
  headerAside,
  className = "",
  contentClassName = "",
  isPrintSection = true,
}: AnalysisSectionCardProps) {
  return (
    <section
      className={[
        "overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm",
        isPrintSection
          ? "print:break-inside-avoid print:rounded-none print:border-slate-300 print:shadow-none"
          : "print:rounded-none print:border-slate-300 print:shadow-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-slate-100 px-5 py-5 text-right lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 lg:text-lg">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>

          {headerAside ? (
            <div className="lg:max-w-[40%] lg:shrink-0">{headerAside}</div>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {actions.map((action) => (
              <SectionActionButton key={action.label} action={action} />
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={["p-5 lg:p-6", contentClassName].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    </section>
  );
}