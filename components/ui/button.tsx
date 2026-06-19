import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "secondary" | "destructive";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      type = "button",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const baseClassName = [
      "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 py-2",
      "text-sm font-semibold whitespace-nowrap",
      "shadow-sm transition-all duration-200",
      "outline-none",
      "focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
    ]
      .filter(Boolean)
      .join(" ");

    const variantClassName =
      variant === "outline"
        ? [
            "border border-slate-200 bg-white text-slate-800",
            "hover:bg-slate-50 hover:border-slate-300",
          ].join(" ")
        : variant === "secondary"
        ? [
            "bg-slate-100 text-slate-800",
            "hover:bg-slate-200",
          ].join(" ")
        : variant === "destructive"
        ? [
            "bg-red-600 text-white",
            "hover:bg-red-700",
          ].join(" ")
        : [
            "bg-slate-900 text-white",
            "hover:bg-slate-800",
          ].join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={[baseClassName, variantClassName, className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";