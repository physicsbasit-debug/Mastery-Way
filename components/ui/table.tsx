import * as React from "react";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = [
    "w-full border-separate border-spacing-0 text-sm",
    "rounded-2xl overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <table ref={ref} className={baseClassName} {...props} />;
});

Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = ["bg-slate-50/90", className].filter(Boolean).join(" ");

  return <thead ref={ref} className={baseClassName} {...props} />;
});

TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = ["[&_tr:last-child_td]:border-b-0", className]
    .filter(Boolean)
    .join(" ");

  return <tbody ref={ref} className={baseClassName} {...props} />;
});

TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = [
    "transition-colors duration-150",
    "hover:bg-slate-50/80",
    "data-[state=selected]:bg-blue-50",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <tr ref={ref} className={baseClassName} {...props} />;
});

TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = [
    "h-11 border-b border-slate-200 bg-slate-50 px-4 py-3",
    "text-start align-middle text-xs font-semibold tracking-wide text-slate-600",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <th ref={ref} className={baseClassName} {...props} />;
});

TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => {
  const baseClassName = [
    "border-b border-slate-100 px-4 py-3 align-middle text-slate-700",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <td ref={ref} className={baseClassName} {...props} />;
});

TableCell.displayName = "TableCell";