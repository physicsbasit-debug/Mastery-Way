import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "success"
    | "warning"
    | "destructive";
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseClassName = [
      "inline-flex items-center justify-center rounded-full px-2.5 py-1",
      "text-xs font-semibold leading-none whitespace-nowrap",
      "transition-colors duration-200",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const variantClassName =
      variant === "outline"
        ? "border border-slate-200 bg-white text-slate-700"
        : variant === "secondary"
        ? "bg-slate-100 text-slate-700"
        : variant === "success"
        ? "bg-emerald-100 text-emerald-700"
        : variant === "warning"
        ? "bg-amber-100 text-amber-700"
        : variant === "destructive"
        ? "bg-red-100 text-red-700"
        : "bg-slate-900 text-white";

    return (
      <span
        ref={ref}
        className={[baseClassName, variantClassName].filter(Boolean).join(" ")}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";