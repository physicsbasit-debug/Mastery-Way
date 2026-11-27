import { useEffect, useRef, useState, type CSSProperties } from 'react';

export type AnalysisStep = {
  id: string;
  label: string;
  description: string;
};

type AnalysisStepAccordionProps = {
  items: readonly AnalysisStep[];
  activeId: string;
  onSelect: (id: string) => void;
  isLocked?: (id: string) => boolean;
  label: string;
  showVisitedStatus?: boolean;
};

export function getAnalysisStepStatus({
  active,
  locked,
  visited,
  showVisitedStatus = false,
}: {
  active: boolean;
  locked: boolean;
  visited: boolean;
  showVisitedStatus?: boolean;
}): string {
  if (active) return 'الخطوة الحالية';
  if (locked) return 'مقفل';
  if (showVisitedStatus && visited) return 'مكتملة';
  return 'متاحة';
}

/** RTL step navigator shared by the three analysis tracks. */
export function AnalysisStepAccordion({ items, activeId, onSelect, isLocked, label, showVisitedStatus = false }: AnalysisStepAccordionProps) {
  const [visited, setVisited] = useState<Set<string>>(() => new Set([activeId]));

  useEffect(() => {
    setVisited((previous) => new Set(previous).add(activeId));
  }, [activeId]);

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId));
  const navRef = useRef<HTMLElement>(null);

  // On narrow screens the steps form a horizontal strip; keep the current step visible
  // by scrolling the strip only (never the page).
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const active = nav.querySelector<HTMLElement>('[aria-current="step"]');
    if (!active) return;
    const navBox = nav.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    nav.scrollLeft += box.left + box.width / 2 - (navBox.left + navBox.width / 2);
  }, [activeId]);

  return (
    <div className="mw-analysis-stepper">
      <div className="mw-analysis-stepper__progress" aria-live="polite">
        الخطوة {activeIndex + 1} من {items.length}
      </div>
      <nav ref={navRef} className="mw-analysis-steps" aria-label={label} style={{ '--mw-step-count': items.length } as CSSProperties}>
        {items.map((item, index) => {
          const active = activeId === item.id;
          const locked = isLocked?.(item.id) ?? false;
          const completed = !active && !locked && showVisitedStatus && visited.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked}
              aria-current={active ? 'step' : undefined}
              data-active={active || undefined}
              data-locked={locked || undefined}
              data-completed={completed || undefined}
              onClick={() => onSelect(item.id)}
              className="mw-analysis-step"
            >
              <span className="mw-analysis-step__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="mw-analysis-step__copy">
                <span className="mw-analysis-step__title">{item.label}</span>
                <span className="mw-analysis-step__description">{locked ? 'يُتاح بعد اكتمال التحليل' : item.description}</span>
              </span>
              <span className="mw-analysis-step__state" aria-hidden="true">
                {getAnalysisStepStatus({ active, locked, visited: visited.has(item.id), showVisitedStatus })}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
