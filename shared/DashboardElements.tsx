import type { ReactNode } from 'react';

export type DashboardTone = 'royal' | 'olive' | 'violet' | 'amber' | 'slate' | 'danger';

export function PremiumMetricCard({
  label,
  value,
  hint,
  tone = 'royal',
  featured = false,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: DashboardTone;
  featured?: boolean;
  icon?: ReactNode;
}) {
  return (
    <article className={`mw-kpi-card mw-kpi-card--${tone} ${featured ? 'mw-kpi-card--featured' : ''}`}>
      <div className="mw-kpi-card__shine" />
      <div className="mw-kpi-card__head">
        <span className="mw-kpi-card__label">{label}</span>
        <span className="mw-kpi-card__icon" aria-hidden="true">{icon ?? '◇'}</span>
      </div>
      <div className="mw-kpi-card__value">{value}</div>
      {hint ? <div className="mw-kpi-card__hint">{hint}</div> : null}
    </article>
  );
}

export function InsightNarrativeCard({
  eyebrow = 'القراءة التربوية للنتائج',
  title,
  text,
  tone = 'royal',
  footer,
}: {
  eyebrow?: string;
  title: string;
  text: ReactNode;
  tone?: DashboardTone;
  footer?: ReactNode;
}) {
  return (
    <section className={`mw-insight-card mw-insight-card--${tone}`}>
      <div className="mw-insight-card__accent" />
      <div className="mw-insight-card__content">
        <span className="mw-insight-card__eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <div className="mw-insight-card__text">{text}</div>
        {footer ? <div className="mw-insight-card__footer">{footer}</div> : null}
      </div>
    </section>
  );
}

export function PremiumPanel({
  title,
  description,
  tone = 'royal',
  children,
}: {
  title: string;
  description?: ReactNode;
  tone?: DashboardTone;
  children: ReactNode;
}) {
  return (
    <section className={`mw-premium-panel mw-premium-panel--${tone}`}>
      <div className="mw-premium-panel__header">
        <div>
          <span className="mw-premium-panel__eyebrow">لوحة تحليل</span>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <div className="mw-premium-panel__body">{children}</div>
    </section>
  );
}

export function StatusBadge({ children, tone = 'royal' }: { children: ReactNode; tone?: DashboardTone }) {
  return <span className={`mw-status-badge mw-status-badge--${tone}`}>{children}</span>;
}
