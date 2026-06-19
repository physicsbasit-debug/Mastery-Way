import * as React from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value, defaultValue, onValueChange, className = "", ...props }, ref) => {
    const reactId = React.useId();
    const baseId = `tabs-${reactId.replace(/:/g, "")}`;

    const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const setValue = React.useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setInternalValue(nextValue);
        }
        onValueChange?.(nextValue);
      },
      [isControlled, onValueChange]
    );

    return (
      <TabsContext.Provider value={{ value: currentValue, setValue, baseId }}>
        <div ref={ref} className={className} {...props} />
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="tablist"
      className={cx(
        "inline-flex flex-wrap items-center gap-1 rounded-2xl bg-slate-100 p-1",
        className
      )}
      {...props}
    />
  );
});

TabsList.displayName = "TabsList";

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, onClick, className = "", ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    const isActive = ctx?.value === value;

    const triggerId = ctx ? `${ctx.baseId}-trigger-${value}` : undefined;
    const contentId = ctx ? `${ctx.baseId}-content-${value}` : undefined;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={triggerId}
        aria-controls={contentId}
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        className={cx(
          "inline-flex h-10 items-center justify-center rounded-xl px-4 py-2",
          "text-sm font-semibold whitespace-nowrap transition-all duration-200",
          "outline-none focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2",
          isActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-white hover:text-slate-900",
          className
        )}
        onClick={(event) => {
          ctx?.setValue(value);
          onClick?.(event);
        }}
        {...props}
      />
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className = "", ...props }, ref) => {
    const ctx = React.useContext(TabsContext);

    if (!ctx || ctx.value !== value) {
      return null;
    }

    const triggerId = `${ctx.baseId}-trigger-${value}`;
    const contentId = `${ctx.baseId}-content-${value}`;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={contentId}
        aria-labelledby={triggerId}
        data-state="active"
        className={cx("mt-4 outline-none", className)}
        {...props}
      />
    );
  }
);

TabsContent.displayName = "TabsContent";