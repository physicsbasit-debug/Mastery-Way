import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", type = "text", ...props }, ref) => {
  const baseClassName = [
    "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2",
    "text-sm text-slate-800 placeholder:text-slate-400",
    "shadow-sm transition-all duration-200",
    "outline-none",
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input ref={ref} type={type} className={baseClassName} {...props} />;
});

Input.displayName = "Input";