import * as React from "react";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = [
    "flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5",
    "text-sm text-slate-800 placeholder:text-slate-400",
    "shadow-sm transition-all duration-200",
    "outline-none resize-y",
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <textarea ref={ref} className={baseClassName} {...props} />;
});

Textarea.displayName = "Textarea";