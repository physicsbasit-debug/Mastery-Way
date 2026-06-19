import * as React from "react";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = [
    "rounded-2xl border border-slate-200/90 bg-white",
    "shadow-sm transition-all duration-200",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div ref={ref} className={baseClassName} {...props} />;
});

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = ["flex flex-col space-y-1.5 p-6 pb-3", className]
    .filter(Boolean)
    .join(" ");

  return <div ref={ref} className={baseClassName} {...props} />;
});

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = [
    "text-lg font-bold tracking-tight text-slate-900",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <h3 ref={ref} className={baseClassName} {...props} />;
});

CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = ["text-sm leading-6 text-slate-500", className]
    .filter(Boolean)
    .join(" ");

  return <p ref={ref} className={baseClassName} {...props} />;
});

CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = ["p-6 pt-0", className].filter(Boolean).join(" ");

  return <div ref={ref} className={baseClassName} {...props} />;
});

CardContent.displayName = "CardContent";